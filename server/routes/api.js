import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import { google } from 'googleapis';
import { buildVocabulary, isValidBusinessType, DEFAULT_BUSINESS_TYPE } from '../../shared/businessTypes.js';
import {
  SECRET_MASK,
  dayNames,
  buildConfirmationMessage,
  notifyClient,
  summarizeResults,
  sendEmail,
  sendWhatsapp,
  sendTelegram,
  telegramApi,
  telegramLinkPayload,
  parseTelegramLinkPayload,
  normalizePhone,
  createTransporter,
} from '../services/notifications.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'schedule-dashboard-secret-key-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/calendar/google/callback';
const OUTLOOK_CLIENT_ID = process.env.OUTLOOK_CLIENT_ID;
const OUTLOOK_CLIENT_SECRET = process.env.OUTLOOK_CLIENT_SECRET;
const OUTLOOK_REDIRECT_URI = process.env.OUTLOOK_REDIRECT_URI || 'http://localhost:3001/api/calendar/outlook/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function buildAppointmentDetails(appointment, employee, client, config) {
  const vocab = buildVocabulary(config?.businessType);
  const day = dayNames[appointment.day] || `Día ${appointment.day}`;
  return `${vocab.appointment.one}:\n- ${vocab.employee.one}: ${employee?.name || ''} ${employee?.lastName || ''}\n- ${vocab.client.one}: ${client?.name || ''} ${client?.lastName || ''}\n- Día: ${day}\n- Hora: ${appointment.startHour}:00 - ${appointment.endHour}:00\n- Notas: ${appointment.notes || 'No hay notas.'}\n- Enlace: ${appointment.zoomLink || 'No aplica.'}`;
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
    summary: `${buildVocabulary(config?.businessType).appointment.one} con ${client?.name || ''} ${client?.lastName || ''}`,
    description: buildAppointmentDetails(appointment, employee, client, config),
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
    subject: `${buildVocabulary(config?.businessType).appointment.one} con ${client?.name || ''} ${client?.lastName || ''}`,
    body: { contentType: 'HTML', content: buildAppointmentDetails(appointment, employee, client, config).replace(/\n/g, '<br/>') },
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


// ─── Configuración: serialización y secretos ─────────────────

const SECRET_FIELDS = ['smtpPassword', 'whatsappAccessToken', 'telegramBotToken'];

async function ensureConfigRow(userId) {
  await db.run('INSERT INTO config (userId) VALUES (?) ON CONFLICT DO NOTHING', userId);
  return await db.get('SELECT * FROM config WHERE userId = ?', userId);
}

function serializeConfig(config, templates = []) {
  const mask = (value) => (value ? SECRET_MASK : '');
  return {
    notificationEmail: config.notificationEmail || '',
    notificationSettings: {
      emailEnabled: config.emailEnabled !== 0,
      emailFromName: config.emailFromName || '',
      smtpHost: config.smtpHost || '',
      smtpPort: config.smtpPort || '',
      smtpUser: config.smtpUser || '',
      smtpPassword: mask(config.smtpPassword),
      whatsappEnabled: !!config.whatsappEnabled,
      whatsappBusinessPhone: config.whatsappBusinessPhone || '',
      whatsappPhoneNumberId: config.whatsappPhoneNumberId || '',
      whatsappBusinessAccountId: config.whatsappBusinessAccountId || '',
      whatsappAccessToken: mask(config.whatsappAccessToken),
      whatsappWebhookVerifyToken: config.whatsappWebhookVerifyToken || '',
      whatsappTemplateName: config.whatsappTemplateName || '',
      whatsappTemplateLang: config.whatsappTemplateLang || 'es',
      phoneCountryCode: config.phoneCountryCode || '1',
      telegramEnabled: !!config.telegramEnabled,
      telegramBotToken: mask(config.telegramBotToken),
      telegramBotUsername: config.telegramBotUsername || '',
    },
    businessInfo: {
      name: config.businessName || '',
      address: config.businessAddress || '',
      businessHours: config.businessHours || '',
      rnc: config.businessRnc || '',
      type: isValidBusinessType(config.businessType) ? config.businessType : DEFAULT_BUSINESS_TYPE,
      typeLabel: config.businessTypeLabel || '',
    },
    emailTemplates: templates.map(t => ({ ...t, isActive: !!t.isActive })),
    calendarSync: {
      googleConnected: !!config.googleConnected,
      googleEmail: config.googleEmail || undefined,
      outlookConnected: !!config.outlookConnected,
      outlookEmail: config.outlookEmail || undefined,
    },
  };
}

async function loadConfigResponse(userId) {
  const config = await ensureConfigRow(userId);
  const templates = await db.all('SELECT * FROM email_templates WHERE userId = ? ORDER BY id', userId);
  return serializeConfig(config, templates);
}

/** Aplica ajustes (posiblemente sin guardar) sobre la fila guardada, resolviendo secretos enmascarados. */
function mergeSettings(row, notificationEmail, settings = {}) {
  const merged = { ...row };
  if (notificationEmail !== undefined) merged.notificationEmail = notificationEmail;
  for (const [key, value] of Object.entries(settings)) {
    if (SECRET_FIELDS.includes(key) && value === SECRET_MASK) continue;
    if (typeof value === 'boolean') merged[key] = value ? 1 : 0;
    else if (value !== undefined && value !== null) merged[key] = value;
  }
  return merged;
}

function createOAuthState(accountOwnerId) {
  return jwt.sign({ accountOwnerId, purpose: 'calendar-oauth' }, JWT_SECRET, { expiresIn: '10m' });
}

function getOAuthState(state) {
  const payload = getStatePayload(state);
  return payload?.purpose === 'calendar-oauth' ? payload : null;
}

// ─── Webhook público de WhatsApp (verificación de Meta) ──────

router.get('/webhooks/whatsapp/:accountId', async (req, res) => {
  const config = await db.get('SELECT whatsappWebhookVerifyToken FROM config WHERE userId = ?', req.params.accountId);
  const expected = config?.whatsappWebhookVerifyToken;
  if (req.query['hub.mode'] === 'subscribe' && expected && req.query['hub.verify_token'] === expected) {
    return res.status(200).send(String(req.query['hub.challenge'] ?? ''));
  }
  res.sendStatus(403);
});

router.post('/webhooks/whatsapp/:accountId', (_req, res) => res.sendStatus(200));

// ─── Callbacks OAuth de calendario ───────────────────────────

router.get('/calendar/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send('Faltan parámetros de autorización');

  const decoded = getOAuthState(state);
  if (!decoded) return res.status(401).send('Estado de autorización inválido o vencido');

  const owner = await db.get('SELECT id FROM users WHERE id = ?', decoded.accountOwnerId);
  if (!owner) return res.status(401).send('Usuario no encontrado');

  try {
    const oauth2Client = createGoogleOAuthClient();
    const { tokens } = await oauth2Client.getToken(String(code));
    oauth2Client.setCredentials(tokens);

    const profile = await google.oauth2({ auth: oauth2Client, version: 'v2' }).userinfo.get();
    const email = profile.data.email || '';

    const currentConfig = await ensureConfigRow(owner.id);
    await db.run(`
      UPDATE config SET googleConnected = 1, googleEmail = ?, googleRefreshToken = ?, googleAccessToken = ?, googleTokenExpiry = ?
      WHERE userId = ?
    `, 
      email,
      tokens.refresh_token || currentConfig.googleRefreshToken || '',
      tokens.access_token || currentConfig.googleAccessToken || '',
      tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : currentConfig.googleTokenExpiry || '',
      owner.id
    );
    return res.redirect(`${FRONTEND_URL}/config?connected=google`);
  } catch (error) {
    console.error('Google callback failed:', error);
    return res.redirect(`${FRONTEND_URL}/config?error=google`);
  }
});

router.get('/calendar/outlook/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code || !state) return res.status(400).send('Faltan parámetros de autorización');

  const decoded = getOAuthState(state);
  if (!decoded) return res.status(401).send('Estado de autorización inválido o vencido');

  const owner = await db.get('SELECT id FROM users WHERE id = ?', decoded.accountOwnerId);
  if (!owner) return res.status(401).send('Usuario no encontrado');

  try {
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
      console.error('Outlook callback token exchange failed:', await tokenResponse.text());
      return res.redirect(`${FRONTEND_URL}/config?error=outlook`);
    }

    const tokens = await tokenResponse.json();
    const profile = await (await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })).json();
    const email = profile.mail || profile.userPrincipalName || '';

    const currentConfig = await ensureConfigRow(owner.id);
    await db.run(`
      UPDATE config SET outlookConnected = 1, outlookEmail = ?, outlookRefreshToken = ?, outlookAccessToken = ?, outlookTokenExpiry = ?
      WHERE userId = ?
    `, 
      email,
      tokens.refresh_token || currentConfig.outlookRefreshToken || '',
      tokens.access_token || currentConfig.outlookAccessToken || '',
      tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString() : currentConfig.outlookTokenExpiry || '',
      owner.id
    );
    return res.redirect(`${FRONTEND_URL}/config?connected=outlook`);
  } catch (error) {
    console.error('Outlook callback failed:', error);
    return res.redirect(`${FRONTEND_URL}/config?error=outlook`);
  }
});

router.use(authMiddleware);

router.get('/calendar/google/connect', async (req, res) => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Google OAuth no está configurado en el servidor (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)' });
  }
  const url = createGoogleOAuthClient().generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
      'profile',
    ],
    prompt: 'consent',
    state: createOAuthState(req.user.accountOwnerId),
  });
  res.json({ url });
});

router.post('/calendar/google/disconnect', async (req, res) => {
  await db.run('UPDATE config SET googleConnected = 0, googleEmail = ?, googleRefreshToken = ?, googleAccessToken = ?, googleTokenExpiry = ? WHERE userId = ?', '', '', '', '', req.user.accountOwnerId);
  res.json(await loadConfigResponse(req.user.accountOwnerId));
});

router.get('/calendar/outlook/connect', async (req, res) => {
  if (!OUTLOOK_CLIENT_ID || !OUTLOOK_CLIENT_SECRET) {
    return res.status(500).json({ error: 'Outlook OAuth no está configurado en el servidor (OUTLOOK_CLIENT_ID / OUTLOOK_CLIENT_SECRET)' });
  }
  const params = new URLSearchParams({
    client_id: OUTLOOK_CLIENT_ID,
    response_type: 'code',
    redirect_uri: OUTLOOK_REDIRECT_URI,
    response_mode: 'query',
    scope: 'offline_access openid profile Calendars.ReadWrite',
    state: createOAuthState(req.user.accountOwnerId),
  });
  res.json({ url: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}` });
});

router.post('/calendar/outlook/disconnect', async (req, res) => {
  await db.run('UPDATE config SET outlookConnected = 0, outlookEmail = ?, outlookRefreshToken = ?, outlookAccessToken = ?, outlookTokenExpiry = ? WHERE userId = ?', '', '', '', '', req.user.accountOwnerId);
  res.json(await loadConfigResponse(req.user.accountOwnerId));
});

// ─── Helpers de datos ────────────────────────────────────────

const text = (value) => (typeof value === 'string' ? value.trim() : value ?? '');
const parseWorkingDays = (raw) => { try { return JSON.parse(raw || '[]'); } catch { return []; } };
const withDays = (row) => (row ? { ...row, workingDays: parseWorkingDays(row.workingDays) } : row);

async function getVocabForAccount(userId) {
  const row = await db.get('SELECT businessType FROM config WHERE userId = ?', userId);
  return buildVocabulary(row?.businessType);
}

async function findOverlap(userId, { employeeId, day, startHour, endHour, ignoreId }) {
  return await db.get(`SELECT id FROM appointments
     WHERE userId = ? AND employeeId = ? AND day = ? AND startHour < ? AND endHour > ? AND id != ?`, userId, employeeId, day, endHour, startHour, ignoreId ?? -1);
}

/** Valida los datos de una cita. Devuelve { error, status } o { employee, client, data }. */
async function validateAppointment(userId, body, ignoreId) {
  const vocab = await getVocabForAccount(userId);
  const data = {
    employeeId: Number(body.employeeId),
    clientId: Number(body.clientId),
    day: Number(body.day),
    startHour: Number(body.startHour),
    endHour: Number(body.endHour),
    notes: text(body.notes) || '',
    zoomLink: text(body.zoomLink) || '',
  };

  if ([data.employeeId, data.clientId, data.day, data.startHour, data.endHour].some(n => !Number.isInteger(n))) {
    return { status: 400, error: 'Faltan datos obligatorios de la ' + vocab.appointmentLower };
  }
  if (data.day < 0 || data.day > 6) return { status: 400, error: 'Día inválido' };
  if (data.startHour < 0 || data.endHour > 24 || data.startHour >= data.endHour) {
    return { status: 400, error: 'La hora de finalización debe ser posterior a la hora de inicio' };
  }

  const employee = await db.get('SELECT * FROM employees WHERE id = ? AND userId = ?', data.employeeId, userId);
  if (!employee) return { status: 404, error: `${vocab.employee.one} no encontrado` };
  const client = await db.get('SELECT * FROM clients WHERE id = ? AND userId = ?', data.clientId, userId);
  if (!client) return { status: 404, error: `${vocab.client.one} no encontrado` };

  if (await findOverlap(userId, { ...data, ignoreId })) {
    return { status: 409, error: `${employee.name} ${employee.lastName} ya tiene ${vocab.appointment.gender === 'f' ? 'una' : 'un'} ${vocab.appointmentLower} en ese horario` };
  }

  // Los nombres se derivan siempre de los registros, no de lo que envía el cliente
  data.employeeName = `${employee.name} ${employee.lastName}`.trim();
  data.clientName = `${client.name} ${client.lastName}`.trim();
  return { data, employee, client };
}

// ─── Employees ───────────────────────────────────────────────
router.get('/employees', async (req, res) => {
  const rows = await db.all('SELECT * FROM employees WHERE userId = ? ORDER BY id', req.user.accountOwnerId);
  res.json(rows.map(withDays));
});

router.post('/employees', async (req, res) => {
  const { name, lastName, email, phone, address, image, schedule, workingDays, status, color } = req.body;
  if (!text(name) || !text(lastName)) return res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
  const result = await db.run(`INSERT INTO employees (userId, name, lastName, email, phone, address, image, schedule, workingDays, status, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`, req.user.accountOwnerId, text(name), text(lastName), text(email), text(phone), text(address), image ?? null, schedule ?? '', JSON.stringify(workingDays || []), status || 'available', color || 'bg-blue-500');
  const employee = await db.get('SELECT * FROM employees WHERE id = ? AND userId = ?', result.id, req.user.accountOwnerId);
  res.status(201).json(withDays(employee));
});

router.put('/employees/:id', async (req, res) => {
  const { name, lastName, email, phone, address, image, schedule, workingDays, status, color } = req.body;
  const result = await db.run(`UPDATE employees SET name=?, lastName=?, email=?, phone=?, address=?, image=?, schedule=?, workingDays=?, status=?, color=?
     WHERE id=? AND userId=?`, text(name), text(lastName), text(email), text(phone), text(address), image ?? null, schedule ?? '', JSON.stringify(workingDays || []), status || 'available', color || 'bg-blue-500', req.params.id, req.user.accountOwnerId);
  if (result.changes === 0) return res.status(404).json({ error: 'Registro no encontrado' });
  // Mantiene coherentes los nombres/color guardados en las citas
  const employee = await db.get('SELECT * FROM employees WHERE id = ? AND userId = ?', req.params.id, req.user.accountOwnerId);
  await db.run('UPDATE appointments SET employeeName = ?, color = ? WHERE employeeId = ? AND userId = ?', `${employee.name} ${employee.lastName}`.trim(), employee.color, employee.id, req.user.accountOwnerId);
  res.json(withDays(employee));
});

router.delete('/employees/:id', async (req, res) => {
  const userId = req.user.accountOwnerId;
  await db.transaction(async (tx) => {
    await tx.run('DELETE FROM appointments WHERE employeeId = ? AND userId = ?', req.params.id, userId);
    await tx.run('DELETE FROM clients WHERE employeeId = ? AND userId = ?', req.params.id, userId);
    await tx.run('DELETE FROM employees WHERE id = ? AND userId = ?', req.params.id, userId);
  });
  res.json({ success: true });
});

// ─── Clients ─────────────────────────────────────────────────
router.get('/clients', async (req, res) => {
  res.json(await db.all('SELECT * FROM clients WHERE userId = ? ORDER BY id', req.user.accountOwnerId));
});

router.post('/clients', async (req, res) => {
  const { name, lastName, email, phone, address, employeeId, notes, telegramChatId } = req.body;
  if (!text(name) || !text(lastName)) return res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
  const result = await db.run(`INSERT INTO clients (userId, name, lastName, email, phone, address, employeeId, notes, telegramChatId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`, req.user.accountOwnerId, text(name), text(lastName), text(email), text(phone), text(address), employeeId ?? null, notes || '', text(telegramChatId) || null);
  res.status(201).json(await db.get('SELECT * FROM clients WHERE id = ? AND userId = ?', result.id, req.user.accountOwnerId));
});

router.put('/clients/:id', async (req, res) => {
  const { name, lastName, email, phone, address, employeeId, notes, telegramChatId } = req.body;
  const result = await db.run(`UPDATE clients SET name=?, lastName=?, email=?, phone=?, address=?, employeeId=?, notes=?, telegramChatId=?
     WHERE id=? AND userId=?`, text(name), text(lastName), text(email), text(phone), text(address), employeeId ?? null, notes || '', text(telegramChatId) || null, req.params.id, req.user.accountOwnerId);
  if (result.changes === 0) return res.status(404).json({ error: 'Registro no encontrado' });
  const client = await db.get('SELECT * FROM clients WHERE id = ? AND userId = ?', req.params.id, req.user.accountOwnerId);
  await db.run('UPDATE appointments SET clientName = ? WHERE clientId = ? AND userId = ?', `${client.name} ${client.lastName}`.trim(), client.id, req.user.accountOwnerId);
  res.json(client);
});

router.delete('/clients/:id', async (req, res) => {
  const userId = req.user.accountOwnerId;
  await db.transaction(async (tx) => {
    await tx.run('DELETE FROM appointments WHERE clientId = ? AND userId = ?', req.params.id, userId);
    await tx.run('DELETE FROM clients WHERE id = ? AND userId = ?', req.params.id, userId);
  });
  res.json({ success: true });
});

router.get('/clients/:id/telegram-link', async (req, res) => {
  const config = await ensureConfigRow(req.user.accountOwnerId);
  const client = await db.get('SELECT id FROM clients WHERE id = ? AND userId = ?', req.params.id, req.user.accountOwnerId);
  if (!client) return res.status(404).json({ error: 'Registro no encontrado' });
  if (!config.telegramBotUsername) {
    return res.status(400).json({ error: 'Configura y guarda primero el bot de Telegram en Configuración' });
  }
  res.json({ url: `https://t.me/${config.telegramBotUsername}?start=${telegramLinkPayload(client.id)}` });
});

// ─── Appointments ────────────────────────────────────────────
router.get('/appointments', async (req, res) => {
  res.json(await db.all('SELECT * FROM appointments WHERE userId = ? ORDER BY id', req.user.accountOwnerId));
});

router.post('/appointments', async (req, res) => {
  const userId = req.user.accountOwnerId;
  const validation = await validateAppointment(userId, req.body);
  if (validation.error) return res.status(validation.status).json({ error: validation.error });
  const { data, employee, client } = validation;

  const result = await db.run(`INSERT INTO appointments (userId, employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING id`, userId, data.employeeId, data.employeeName, data.clientId, data.clientName, data.day, data.startHour, data.endHour, data.notes, data.zoomLink, employee.color || req.body.color || 'bg-gray-500');

  const appointment = await db.get('SELECT * FROM appointments WHERE id = ? AND userId = ?', result.id, userId);
  const config = await ensureConfigRow(userId);

  const channels = {
    email: !!req.body.sendEmailNotification,
    whatsapp: !!req.body.sendWhatsappNotification,
    telegram: !!req.body.sendTelegramNotification,
  };

  let notifications = [];
  if (Object.values(channels).some(Boolean)) {
    const vocab = buildVocabulary(config.businessType);
    try {
      const results = await notifyClient(config, {
        appointment,
        employee,
        client,
        channels,
        subject: `${vocab.appointment.one} programad${vocab.appointment.gender === 'f' ? 'a' : 'o'} en ${config.businessName || 'nuestro negocio'}`,
        text: buildConfirmationMessage(config, appointment, employee, client),
      });
      notifications = summarizeResults(results);
    } catch (error) {
      console.error('Error enviando notificaciones:', error);
      notifications = [{ channel: 'general', status: 'failed', message: error.message }];
    }
  }

  if (config.googleConnected) {
    createGoogleCalendarEvent(config, appointment, employee, client).catch(e => console.error('Google Calendar:', e));
  }
  if (config.outlookConnected) {
    createOutlookCalendarEvent(config, appointment, employee, client).catch(e => console.error('Outlook Calendar:', e));
  }

  res.status(201).json({ ...appointment, notifications });
});

router.put('/appointments/:id', async (req, res) => {
  const userId = req.user.accountOwnerId;
  const existing = await db.get('SELECT id FROM appointments WHERE id = ? AND userId = ?', req.params.id, userId);
  if (!existing) return res.status(404).json({ error: 'Registro no encontrado' });

  const validation = await validateAppointment(userId, req.body, Number(req.params.id));
  if (validation.error) return res.status(validation.status).json({ error: validation.error });
  const { data, employee } = validation;

  await db.run(`UPDATE appointments SET employeeId=?, employeeName=?, clientId=?, clientName=?, day=?, startHour=?, endHour=?, notes=?, zoomLink=?, color=?
     WHERE id=? AND userId=?`, data.employeeId, data.employeeName, data.clientId, data.clientName, data.day, data.startHour, data.endHour, data.notes, data.zoomLink, employee.color || 'bg-gray-500', req.params.id, userId);
  res.json(await db.get('SELECT * FROM appointments WHERE id = ? AND userId = ?', req.params.id, userId));
});

router.delete('/appointments/:id', async (req, res) => {
  await db.run('DELETE FROM appointments WHERE id = ? AND userId = ?', req.params.id, req.user.accountOwnerId);
  res.json({ success: true });
});

// ─── Config ──────────────────────────────────────────────────
router.get('/config', async (req, res) => {
  res.json(await loadConfigResponse(req.user.accountOwnerId));
});

router.put('/config', async (req, res) => {
  const userId = req.user.accountOwnerId;
  const { notificationEmail, notificationSettings, businessInfo, emailTemplates } = req.body;
  const current = await ensureConfigRow(userId);

  const merged = mergeSettings(current, notificationEmail !== undefined ? text(notificationEmail) : undefined, notificationSettings || {});
  const info = businessInfo || {};
  const businessType = isValidBusinessType(info.type) ? info.type : (current.businessType || DEFAULT_BUSINESS_TYPE);

  // Si cambia el token del bot de Telegram, se valida y se guarda su @usuario
  let telegramBotUsername = merged.telegramBotUsername || '';
  if (merged.telegramBotToken && merged.telegramBotToken !== current.telegramBotToken) {
    try {
      const me = await telegramApi(merged.telegramBotToken, 'getMe');
      telegramBotUsername = me.username || '';
    } catch (error) {
      return res.status(400).json({ error: `Token de Telegram inválido: ${error.message}` });
    }
  }
  if (!merged.telegramBotToken) telegramBotUsername = '';

  await db.run(`
    UPDATE config SET
      notificationEmail = ?, emailEnabled = ?, emailFromName = ?, smtpHost = ?, smtpPort = ?, smtpUser = ?, smtpPassword = ?,
      whatsappEnabled = ?, whatsappBusinessPhone = ?, whatsappPhoneNumberId = ?, whatsappBusinessAccountId = ?,
      whatsappAccessToken = ?, whatsappWebhookVerifyToken = ?, whatsappTemplateName = ?, whatsappTemplateLang = ?, phoneCountryCode = ?,
      telegramEnabled = ?, telegramBotToken = ?, telegramBotUsername = ?,
      businessName = ?, businessAddress = ?, businessHours = ?, businessRnc = ?, businessType = ?, businessTypeLabel = ?
    WHERE userId = ?
  `, 
    text(merged.notificationEmail) || '',
    merged.emailEnabled ? 1 : 0,
    text(merged.emailFromName) || '',
    text(merged.smtpHost) || '',
    String(merged.smtpPort || '').trim(),
    text(merged.smtpUser) || '',
    merged.smtpPassword || '',
    merged.whatsappEnabled ? 1 : 0,
    text(merged.whatsappBusinessPhone) || '',
    text(merged.whatsappPhoneNumberId) || '',
    text(merged.whatsappBusinessAccountId) || '',
    merged.whatsappAccessToken || '',
    text(merged.whatsappWebhookVerifyToken) || '',
    text(merged.whatsappTemplateName) || '',
    text(merged.whatsappTemplateLang) || 'es',
    String(merged.phoneCountryCode || '1').replace(/\D/g, '') || '1',
    merged.telegramEnabled ? 1 : 0,
    merged.telegramBotToken || '',
    telegramBotUsername,
    info.name !== undefined ? text(info.name) : current.businessName || '',
    info.address !== undefined ? text(info.address) : current.businessAddress || '',
    info.businessHours !== undefined ? text(info.businessHours) : current.businessHours || '',
    info.rnc !== undefined ? text(info.rnc) : current.businessRnc || '',
    businessType,
    businessType === 'other' ? text(info.typeLabel ?? current.businessTypeLabel) || '' : '',
    userId
  );

  // La conexión con Google/Outlook solo cambia mediante OAuth, nunca desde este formulario.

  if (Array.isArray(emailTemplates)) {
    await db.transaction(async (tx) => {
      await tx.run('DELETE FROM email_templates WHERE userId = ?', userId);
      for (const t of emailTemplates) {
        await tx.run(
          'INSERT INTO email_templates (userId, name, subject, body, triggerType, isActive) VALUES (?, ?, ?, ?, ?, ?)',
          userId, t.name, t.subject, t.body, t.triggerType, t.isActive ? 1 : 0
        );
      }
    });
  }

  res.json(await loadConfigResponse(userId));
});

// ─── Pruebas de canales y vinculación de Telegram ────────────

router.post('/notifications/test', async (req, res) => {
  const userId = req.user.accountOwnerId;
  const { channel, to, notificationEmail, notificationSettings } = req.body;
  const config = mergeSettings(await ensureConfigRow(userId), notificationEmail, notificationSettings || {});
  const businessName = config.businessName || 'tu negocio';
  const message = `✅ Mensaje de prueba de ${businessName}. Si lo recibes, este canal está funcionando correctamente.`;

  try {
    if (channel === 'email') {
      config.emailEnabled = 1;
      if (!config.smtpHost || !config.smtpUser || !config.smtpPassword || !config.notificationEmail) {
        return res.status(400).json({ error: 'Completa el email remitente y los datos SMTP' });
      }
      try {
        await createTransporter(config).verify();
      } catch (error) {
        return res.status(400).json({ error: `Conexión SMTP fallida: ${error.message}` });
      }
      const result = await sendEmail(config, { to: text(to) || config.notificationEmail, subject: `Prueba de notificaciones - ${businessName}`, text: message });
      return res.status(result.status === 'sent' ? 200 : 400).json(result.status === 'sent' ? result : { error: result.message });
    }

    if (channel === 'whatsapp') {
      config.whatsappEnabled = 1;
      if (!normalizePhone(to, config.phoneCountryCode)) {
        return res.status(400).json({ error: 'Indica un número de teléfono de destino válido (con código de país)' });
      }
      const result = await sendWhatsapp(config, { phone: to, text: message, templateParams: ['Prueba', '-', '-', '-', businessName] });
      return res.status(result.status === 'sent' ? 200 : 400).json(result.status === 'sent' ? result : { error: result.message });
    }

    if (channel === 'telegram') {
      config.telegramEnabled = 1;
      if (!config.telegramBotToken) return res.status(400).json({ error: 'Falta el token del bot de Telegram' });
      let me;
      try {
        me = await telegramApi(config.telegramBotToken, 'getMe');
      } catch (error) {
        return res.status(400).json({ error: `Token de Telegram inválido: ${error.message}` });
      }
      if (!text(to)) return res.json({ status: 'sent', message: `Bot válido: @${me.username}. Indica un Chat ID para enviar un mensaje de prueba.` });
      const result = await sendTelegram(config, { chatId: text(to), text: message });
      return res.status(result.status === 'sent' ? 200 : 400).json(result.status === 'sent' ? { ...result, message: `Bot @${me.username}: ${result.message}` } : { error: result.message });
    }

    res.status(400).json({ error: 'Canal desconocido' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lee los mensajes pendientes del bot ("/start <código>") y vincula el chat con el cliente.
router.post('/notifications/telegram/sync', async (req, res) => {
  const userId = req.user.accountOwnerId;
  const config = await ensureConfigRow(userId);
  if (!config.telegramBotToken) return res.status(400).json({ error: 'Configura primero el token del bot de Telegram' });

  try {
    const updates = await telegramApi(config.telegramBotToken, 'getUpdates', { timeout: 0, allowed_updates: ['message'] });
    let linked = 0;
    let lastUpdateId = null;

    for (const update of updates) {
      lastUpdateId = update.update_id;
      const message = update.message;
      const match = /^\/start\s+(\S+)/.exec(message?.text || '');
      if (!match) continue;
      const clientId = parseTelegramLinkPayload(match[1]);
      if (!clientId) continue;
      const result = await db.run('UPDATE clients SET telegramChatId = ? WHERE id = ? AND userId = ?', String(message.chat.id), clientId, userId);
      if (result.changes > 0) {
        linked++;
        telegramApi(config.telegramBotToken, 'sendMessage', {
          chat_id: message.chat.id,
          text: `¡Listo! Recibirás tus recordatorios de ${config.businessName || 'tus citas'} por este chat.`,
        }).catch(() => {});
      }
    }

    if (lastUpdateId !== null) {
      await telegramApi(config.telegramBotToken, 'getUpdates', { offset: lastUpdateId + 1, timeout: 0 });
    }
    res.json({ linked });
  } catch (error) {
    res.status(400).json({ error: `No se pudo leer Telegram: ${error.message}` });
  }
});

export default router;
