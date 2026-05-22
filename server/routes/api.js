import { Router } from 'express';
import nodemailer from 'nodemailer';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'schedule-dashboard-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/calendar/google/callback';
const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID;
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET;
const OUTLOOK_REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3001/api/calendar/outlook/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function buildAppointmentDetails(appointment, employee, client) {
  const day = dayNames[appointment.day] || `Día ${appointment.day}`;
  return `Cita programada:\n- Empleado: ${employee?.name || ''} ${employee?.lastName || ''}\n- Cliente: ${client?.name || ''} ${client?.lastName || ''}\n- Día: ${day}\n- Hora: ${appointment.startHour}:00 - ${appointment.endHour}:00\n- Notas: ${appointment.notes || 'No hay notas.'}\n- Zoom: ${appointment.zoomLink || 'No aplica.'}`;
}

function getNextAppointmentDate(dayIndex) {
  const now = new Date();
  const todayIndex = now.getDay();
  let offset = (dayIndex - todayIndex + 7) % 7;
  const appointmentDate = new Date(now);
  appointmentDate.setDate(now.getDate() + offset);
  appointmentDate.setHours(0, 0, 0, 0);
  return appointmentDate;
}

function createGoogleOAuthClient() {
  return new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
}

function getStatePayload(state) {
  try {
    const token = decodeURIComponent(String(state));
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function extractBearerToken(req) {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.split(' ')[1] : null;
}

async function createGoogleCalendarEvent(config, appointment, employee, client) {
  if (!config?.googleConnected || !config?.googleRefreshToken || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) return;

  const oauth2Client = createGoogleOAuthClient();
  oauth2Client.setCredentials({ refresh_token: config.googleRefreshToken });

  try {
    await oauth2Client.getAccessToken();
  } catch (error) {
    console.warn('Google OAuth token refresh failed:', error);
    return;
  }

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const appointmentDate = getNextAppointmentDate(appointment.day);
  const start = new Date(appointmentDate);
  start.setHours(appointment.startHour, 0, 0, 0);
  const end = new Date(appointmentDate);
  end.setHours(appointment.endHour, 0, 0, 0);

  const event = {
    summary: `Cita con ${client?.name || ''} ${client?.lastName || ''}`,
    description: buildAppointmentDetails(appointment, employee, client),
    start: { dateTime: start.toISOString(), timeZone: 'UTC' },
    end: { dateTime: end.toISOString(), timeZone: 'UTC' },
    attendees: client?.email ? [{ email: client.email }] : [],
  };

  try {
    await calendar.events.insert({ calendarId: 'primary', requestBody: event, sendUpdates: 'all' });
    console.log('Google Calendar event created for appointment', appointment.id);
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
  }
}

async function refreshOutlookTokens(config) {
  if (!config?.outlookRefreshToken || !OUTLOOK_CLIENT_ID || !OUTLOOK_CLIENT_SECRET) return null;

  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    client_secret: OUTLOOK_CLIENT_SECRET,
    redirect_uri: OUTLOOK_REDIRECT_URI,
    grant_type: 'refresh_token',
    refresh_token: config.outlookRefreshToken,
    scope: 'offline_access openid profile Calendars.ReadWrite',
  });

  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    console.warn('Outlook token refresh failed', await response.text());
    return null;
  }

  return response.json();
}

async function createOutlookCalendarEvent(config, appointment, employee, client) {
  if (!config?.outlookConnected || !config?.outlookRefreshToken || !OUTLOOK_CLIENT_ID || !OUTLOOK_CLIENT_SECRET) return;

  const tokenData = await refreshOutlookTokens(config);
  if (!tokenData?.access_token) return;

  const appointmentDate = getNextAppointmentDate(appointment.day);
  const start = new Date(appointmentDate);
  start.setHours(appointment.startHour, 0, 0, 0);
  const end = new Date(appointmentDate);
  end.setHours(appointment.endHour, 0, 0, 0);

  const event = {
    subject: `Cita con ${client?.name || ''} ${client?.lastName || ''}`,
    body: { contentType: 'HTML', content: buildAppointmentDetails(appointment, employee, client).replace(/\n/g, '<br/>') },
    start: { dateTime: start.toISOString(), timeZone: 'UTC' },
    end: { dateTime: end.toISOString(), timeZone: 'UTC' },
    attendees: client?.email ? [{ emailAddress: { address: client.email, name: `${client.name || ''} ${client.lastName || ''}`.trim() }, type: 'required' }] : [],
  };

  const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    console.error('Failed to create Outlook Calendar event:', await response.text());
    return;
  }

  console.log('Outlook Calendar event created for appointment', appointment.id);
}

async function sendEmailNotification(config, appointment, employee, client) {
  if (!config?.notificationEmail || !config?.emailEnabled) return;
  if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
    console.warn('Email configuration is incomplete, skipping email notification.');
    return;
  }
  if (!client?.email) {
    console.warn('Client email is missing, skipping email notification.');
    return;
  }

  const smtpPort = Number(config.smtpPort) || 587;
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  });

  const fromName = config.emailFromName?.trim();
  const fromAddress = config.notificationEmail;
  const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;
  const subject = `Recordatorio de cita: ${employee?.name || ''} ${employee?.lastName || ''}`;
  const text = `Hola ${client.name || ''},\n\nTe recordamos que tienes una cita programada.\n\n${buildAppointmentDetails(appointment, employee, client)}\n\nSaludos,\n${fromName || fromAddress}`;
  const html = `<p>Hola ${client.name || ''},</p><p>Te recordamos que tienes una cita programada.</p><ul><li><strong>Empleado:</strong> ${employee?.name || ''} ${employee?.lastName || ''}</li><li><strong>Cliente:</strong> ${client?.name || ''} ${client?.lastName || ''}</li><li><strong>Día:</strong> ${dayNames[appointment.day] || appointment.day}</li><li><strong>Hora:</strong> ${appointment.startHour}:00 - ${appointment.endHour}:00</li><li><strong>Notas:</strong> ${appointment.notes || 'No hay notas.'}</li><li><strong>Zoom:</strong> ${appointment.zoomLink || 'No aplica.'}</li></ul><p>Saludos,<br/>${fromName || fromAddress}</p>`;

  const info = await transporter.sendMail({
    from,
    to: client.email,
    subject,
    text,
    html,
  });

  console.log(`Email sent to ${client.email}: ${info.messageId}`);
}

async function sendWhatsappNotification(config, appointment, employee, client) {
  if (!config?.whatsappEnabled) return;
  if (!config.whatsappPhoneNumberId || !config.whatsappAccessToken) {
    console.warn('WhatsApp Cloud API configuration is incomplete, skipping WhatsApp notification.');
    return;
  }
  if (!client?.phone) {
    console.warn('Client phone is missing, skipping WhatsApp notification.');
    return;
  }

  const body = {
    messaging_product: 'whatsapp',
    to: client.phone.replace(/\s+/g, ''),
    type: 'text',
    text: {
      body: `Recordatorio de cita: ${dayNames[appointment.day] || appointment.day} de ${appointment.startHour}:00 a ${appointment.endHour}:00 con ${employee?.name || ''} ${employee?.lastName || ''}. Notas: ${appointment.notes || 'No hay notas.'}`,
    },
  };

  const response = await fetch(`https://graph.facebook.com/v17.0/${config.whatsappPhoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.whatsappAccessToken}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    console.error('WhatsApp send failed', payload);
    return;
  }

  console.log(`WhatsApp sent to ${client.phone}`, payload);
}

function emptyNotificationSettings() {
  return {
    emailEnabled: true,
    emailFromName: '',
    smtpHost: '',
    smtpPort: '',
    smtpUser: '',
    smtpPassword: '',
    whatsappEnabled: false,
    whatsappBusinessPhone: '',
    whatsappPhoneNumberId: '',
    whatsappBusinessAccountId: '',
    whatsappAccessToken: '',
    whatsappWebhookVerifyToken: '',
  };
}

function serializeConfig(config, templates = []) {
  return {
    notificationEmail: config.notificationEmail || '',
    notificationSettings: {
      emailEnabled: config.emailEnabled !== 0,
      emailFromName: config.emailFromName || '',
      smtpHost: config.smtpHost || '',
      smtpPort: config.smtpPort || '',
      smtpUser: config.smtpUser || '',
      smtpPassword: config.smtpPassword || '',
      whatsappEnabled: !!config.whatsappEnabled,
      whatsappBusinessPhone: config.whatsappBusinessPhone || '',
      whatsappPhoneNumberId: config.whatsappPhoneNumberId || '',
      whatsappBusinessAccountId: config.whatsappBusinessAccountId || '',
      whatsappAccessToken: config.whatsappAccessToken || '',
      whatsappWebhookVerifyToken: config.whatsappWebhookVerifyToken || '',
    },
    businessInfo: {
      name: config.businessName || '',
      address: config.businessAddress || '',
      businessHours: config.businessHours || '',
      rnc: config.businessRnc || '',
    },
    emailTemplates: templates.map(t => ({ ...t, isActive: !!t.isActive })),
    calendarSync: {
      googleConnected: !!config.googleConnected,
      googleEmail: config.googleEmail,
      outlookConnected: !!config.outlookConnected,
      outlookEmail: config.outlookEmail,
    }
  };
}

router.get('/calendar/google/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  const decoded = getStatePayload(state);
  if (!decoded) {
    return res.status(401).send('Invalid authorization state');
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.id);
  if (!user) {
    return res.status(401).send('Usuario no encontrado');
  }

  const oauth2Client = createGoogleOAuthClient();
  const { tokens } = await oauth2Client.getToken(String(code));
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
  const profile = await oauth2.userinfo.get();
  const email = profile.data.email || '';

  db.prepare('INSERT OR IGNORE INTO config (userId) VALUES (?)').run(user.id);
  const currentConfig = db.prepare('SELECT * FROM config WHERE userId = ?').get(user.id);
  db.prepare(`
    UPDATE config SET
      googleConnected = 1,
      googleEmail = ?,
      googleRefreshToken = ?,
      googleAccessToken = ?,
      googleTokenExpiry = ?
    WHERE userId = ?
  `).run(
    email,
    tokens.refresh_token || currentConfig?.googleRefreshToken || '',
    tokens.access_token || currentConfig?.googleAccessToken || '',
    tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : currentConfig?.googleTokenExpiry || '',
    user.id
  );

  return res.redirect(`${FRONTEND_URL}/config?connected=google`);
});

router.get('/calendar/outlook/callback', async (req, res) => {
  const code = req.query.code;
  const state = req.query.state;
  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  const decoded = getStatePayload(state);
  if (!decoded) {
    return res.status(401).send('Invalid authorization state');
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(decoded.id);
  if (!user) {
    return res.status(401).send('Usuario no encontrado');
  }

  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    scope: 'offline_access openid profile Calendars.ReadWrite',
    code: String(code),
    redirect_uri: OUTLOOK_REDIRECT_URI,
    grant_type: 'authorization_code',
    client_secret: OUTLOOK_CLIENT_SECRET,
  });

  const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Outlook callback token exchange failed:', errorText);
    return res.status(500).send('No se pudo intercambiar el token de Outlook');
  }

  const tokens = await tokenResponse.json();
  const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });
  const profile = await profileResponse.json();
  const email = profile.mail || profile.userPrincipalName || '';

  db.prepare('INSERT OR IGNORE INTO config (userId) VALUES (?)').run(user.id);
  const currentConfig = db.prepare('SELECT * FROM config WHERE userId = ?').get(user.id);
  db.prepare(`
    UPDATE config SET
      outlookConnected = 1,
      outlookEmail = ?,
      outlookRefreshToken = ?,
      outlookAccessToken = ?,
      outlookTokenExpiry = ?
    WHERE userId = ?
  `).run(
    email,
    tokens.refresh_token || currentConfig?.outlookRefreshToken || '',
    tokens.access_token || currentConfig?.outlookAccessToken || '',
    tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString() : currentConfig?.outlookTokenExpiry || '',
    user.id
  );

  return res.redirect(`${FRONTEND_URL}/config?connected=outlook`);
});

router.use(authMiddleware);

router.get('/calendar/google/connect', (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Google OAuth no está configurado' });
  }

  const authUrl = createGoogleOAuthClient().generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
      'profile',
    ],
    prompt: 'consent',
    state: encodeURIComponent(extractBearerToken(req) || ''),
  });

  res.json({ url: authUrl });
});

router.post('/calendar/google/disconnect', (req, res) => {
  db.prepare('UPDATE config SET googleConnected = 0, googleEmail = ?, googleRefreshToken = ?, googleAccessToken = ?, googleTokenExpiry = ? WHERE userId = ?')
    .run('', '', '', '', req.user.accountOwnerId);
  const config = db.prepare('SELECT * FROM config WHERE userId = ?').get(req.user.accountOwnerId);
  res.json(serializeConfig(config, []));
});

router.get('/calendar/outlook/connect', (req, res) => {
  if (!OUTLOOK_CLIENT_ID || !OUTLOOK_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Outlook OAuth no está configurado' });
  }

  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    response_type: 'code',
    redirect_uri: OUTLOOK_REDIRECT_URI,
    response_mode: 'query',
    scope: 'offline_access openid profile Calendars.ReadWrite',
    state: encodeURIComponent(extractBearerToken(req) || ''),
  });
  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  res.json({ url });
});

router.post('/calendar/outlook/disconnect', (req, res) => {
  db.prepare('UPDATE config SET outlookConnected = 0, outlookEmail = ?, outlookRefreshToken = ?, outlookAccessToken = ?, outlookTokenExpiry = ? WHERE userId = ?')
    .run('', '', '', '', req.user.accountOwnerId);
  const config = db.prepare('SELECT * FROM config WHERE userId = ?').get(req.user.accountOwnerId);
  res.json(serializeConfig(config, []));
});

// ─── Employees ───────────────────────────────────────────────
router.get('/employees', (req, res) => {
  const rows = db.prepare('SELECT * FROM employees WHERE userId = ? ORDER BY id').all(req.user.accountOwnerId);
  res.json(rows.map(r => ({ ...r, workingDays: JSON.parse(r.workingDays) })));
});

router.post('/employees', (req, res) => {
  const { name, lastName, email, phone, address, image, schedule, workingDays, status, color } = req.body;
  const result = db.prepare(
    `INSERT INTO employees (userId, name, lastName, email, phone, address, image, schedule, workingDays, status, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.user.accountOwnerId, name, lastName, email, phone, address, image, schedule, JSON.stringify(workingDays || []), status || 'available', color || 'bg-blue-500');
  const employee = db.prepare('SELECT * FROM employees WHERE id = ? AND userId = ?').get(result.lastInsertRowid, req.user.accountOwnerId);
  res.status(201).json({ ...employee, workingDays: JSON.parse(employee.workingDays) });
});

router.put('/employees/:id', (req, res) => {
  const { name, lastName, email, phone, address, image, schedule, workingDays, status, color } = req.body;
  db.prepare(
    `UPDATE employees SET name=?, lastName=?, email=?, phone=?, address=?, image=?, schedule=?, workingDays=?, status=?, color=?
     WHERE id=? AND userId=?`
  ).run(name, lastName, email, phone, address, image, schedule, JSON.stringify(workingDays || []), status, color, req.params.id, req.user.accountOwnerId);
  const employee = db.prepare('SELECT * FROM employees WHERE id = ? AND userId = ?').get(req.params.id, req.user.accountOwnerId);
  res.json({ ...employee, workingDays: JSON.parse(employee.workingDays) });
});

router.delete('/employees/:id', (req, res) => {
  db.prepare('DELETE FROM employees WHERE id = ? AND userId = ?').run(req.params.id, req.user.accountOwnerId);
  res.json({ success: true });
});

// ─── Clients ─────────────────────────────────────────────────
router.get('/clients', (req, res) => {
  const rows = db.prepare('SELECT * FROM clients WHERE userId = ? ORDER BY id').all(req.user.accountOwnerId);
  res.json(rows);
});

router.post('/clients', (req, res) => {
  const { name, lastName, email, phone, address, employeeId, notes } = req.body;
  const result = db.prepare(
    `INSERT INTO clients (userId, name, lastName, email, phone, address, employeeId, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.user.accountOwnerId, name, lastName, email, phone, address, employeeId, notes || '');
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND userId = ?').get(result.lastInsertRowid, req.user.accountOwnerId);
  res.status(201).json(client);
});

router.put('/clients/:id', (req, res) => {
  const { name, lastName, email, phone, address, employeeId, notes } = req.body;
  db.prepare(
    `UPDATE clients SET name=?, lastName=?, email=?, phone=?, address=?, employeeId=?, notes=?
     WHERE id=? AND userId=?`
  ).run(name, lastName, email, phone, address, employeeId, notes, req.params.id, req.user.accountOwnerId);
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND userId = ?').get(req.params.id, req.user.accountOwnerId);
  res.json(client);
});

router.delete('/clients/:id', (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ? AND userId = ?').run(req.params.id, req.user.accountOwnerId);
  res.json({ success: true });
});

// ─── Appointments ────────────────────────────────────────────
router.get('/appointments', (req, res) => {
  const rows = db.prepare('SELECT * FROM appointments WHERE userId = ? ORDER BY id').all(req.user.accountOwnerId);
  res.json(rows);
});

router.post('/appointments', async (req, res) => {
  const {
    employeeId,
    employeeName,
    clientId,
    clientName,
    day,
    startHour,
    endHour,
    notes,
    zoomLink,
    color,
    sendEmailNotification: shouldSendEmail,
    sendWhatsappNotification: shouldSendWhatsapp,
  } = req.body;

  const result = db.prepare(
    `INSERT INTO appointments (userId, employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.user.accountOwnerId, employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes || '', zoomLink || '', color || 'bg-gray-500');

  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ? AND userId = ?').get(result.lastInsertRowid, req.user.accountOwnerId);
  const config = db.prepare('SELECT * FROM config WHERE userId = ?').get(req.user.accountOwnerId);
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND userId = ?').get(clientId, req.user.accountOwnerId);
  const employee = db.prepare('SELECT * FROM employees WHERE id = ? AND userId = ?').get(employeeId, req.user.accountOwnerId);

  if (shouldSendEmail) {
    try {
      await sendEmailNotification(config, appointment, employee, client);
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  if (shouldSendWhatsapp) {
    try {
      await sendWhatsappNotification(config, appointment, employee, client);
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
    }
  }

  if (config?.googleConnected) {
    try {
      await createGoogleCalendarEvent(config, appointment, employee, client);
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
    }
  }

  if (config?.outlookConnected) {
    try {
      await createOutlookCalendarEvent(config, appointment, employee, client);
    } catch (error) {
      console.error('Error creating Outlook Calendar event:', error);
    }
  }

  res.status(201).json(appointment);
});

router.put('/appointments/:id', (req, res) => {
  const { employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color } = req.body;
  db.prepare(
    `UPDATE appointments SET employeeId=?, employeeName=?, clientId=?, clientName=?, day=?, startHour=?, endHour=?, notes=?, zoomLink=?, color=?
     WHERE id=? AND userId=?`
  ).run(employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color, req.params.id, req.user.accountOwnerId);
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ? AND userId = ?').get(req.params.id, req.user.accountOwnerId);
  res.json(appointment);
});

router.delete('/appointments/:id', (req, res) => {
  db.prepare('DELETE FROM appointments WHERE id = ? AND userId = ?').run(req.params.id, req.user.accountOwnerId);
  res.json({ success: true });
});

// ─── Config ──────────────────────────────────────────────────
router.get('/config', (req, res) => {
  const config = db.prepare('SELECT * FROM config WHERE userId = ?').get(req.user.accountOwnerId);
  if (!config) {
    db.prepare('INSERT INTO config (userId) VALUES (?)').run(req.user.accountOwnerId);
    return res.json({
      notificationEmail: '',
      notificationSettings: emptyNotificationSettings(),
      emailTemplates: [],
      businessInfo: { name: req.user.name || '', address: '', businessHours: '', rnc: '' },
      calendarSync: { googleConnected: false, outlookConnected: false },
    });
  }
  const templates = db.prepare('SELECT * FROM email_templates WHERE userId = ? ORDER BY id').all(req.user.accountOwnerId);
  res.json(serializeConfig(config, templates));
});

router.put('/config', (req, res) => {
  const { notificationEmail, notificationSettings, businessInfo, emailTemplates, calendarSync } = req.body;
  const existing = db.prepare('SELECT userId FROM config WHERE userId = ?').get(req.user.accountOwnerId);
  if (!existing) {
    db.prepare('INSERT INTO config (userId) VALUES (?)').run(req.user.accountOwnerId);
  }

  const settings = notificationSettings || {};

  db.prepare(`
    UPDATE config SET
      notificationEmail = ?,
      emailEnabled = ?,
      emailFromName = ?,
      smtpHost = ?,
      smtpPort = ?,
      smtpUser = ?,
      smtpPassword = ?,
      whatsappEnabled = ?,
      whatsappBusinessPhone = ?,
      whatsappPhoneNumberId = ?,
      whatsappBusinessAccountId = ?,
      whatsappAccessToken = ?,
      whatsappWebhookVerifyToken = ?,
      businessName = ?,
      businessAddress = ?,
      businessHours = ?,
      businessRnc = ?,
      googleConnected = ?,
      googleEmail = ?,
      outlookConnected = ?,
      outlookEmail = ?
    WHERE userId = ?
  `).run(
    notificationEmail || '',
    settings.emailEnabled ? 1 : 0,
    settings.emailFromName || '',
    settings.smtpHost || '',
    settings.smtpPort || '',
    settings.smtpUser || '',
    settings.smtpPassword || '',
    settings.whatsappEnabled ? 1 : 0,
    settings.whatsappBusinessPhone || '',
    settings.whatsappPhoneNumberId || '',
    settings.whatsappBusinessAccountId || '',
    settings.whatsappAccessToken || '',
    settings.whatsappWebhookVerifyToken || '',
    businessInfo?.name || '',
    businessInfo?.address || '',
    businessInfo?.businessHours || '',
    businessInfo?.rnc || '',
    calendarSync?.googleConnected ? 1 : 0,
    calendarSync?.googleEmail || '',
    calendarSync?.outlookConnected ? 1 : 0,
    calendarSync?.outlookEmail || '',
    req.user.accountOwnerId
  );

  if (emailTemplates) {
    db.prepare('DELETE FROM email_templates WHERE userId = ?').run(req.user.accountOwnerId);
    const insert = db.prepare('INSERT INTO email_templates (userId, name, subject, body, triggerType, isActive) VALUES (?, ?, ?, ?, ?, ?)');
    for (const t of emailTemplates) {
      insert.run(req.user.accountOwnerId, t.name, t.subject, t.body, t.triggerType, t.isActive ? 1 : 0);
    }
  }

  const config = db.prepare('SELECT * FROM config WHERE userId = ?').get(req.user.accountOwnerId);
  const templates = db.prepare('SELECT * FROM email_templates WHERE userId = ? ORDER BY id').all(req.user.accountOwnerId);
  res.json(serializeConfig(config, templates));
});

export default router;
