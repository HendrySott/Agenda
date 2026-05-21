import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

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

router.post('/appointments', (req, res) => {
  const { employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color } = req.body;
  const result = db.prepare(
    `INSERT INTO appointments (userId, employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.user.accountOwnerId, employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes || '', zoomLink || '', color || 'bg-gray-500');
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ? AND userId = ?').get(result.lastInsertRowid, req.user.accountOwnerId);
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
