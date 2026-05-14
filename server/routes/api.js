import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// ─── Employees ───────────────────────────────────────────────
router.get('/employees', (req, res) => {
  const rows = db.prepare('SELECT * FROM employees ORDER BY id').all();
  res.json(rows.map(r => ({ ...r, workingDays: JSON.parse(r.workingDays) })));
});

router.post('/employees', (req, res) => {
  const { name, lastName, email, phone, address, image, schedule, workingDays, status, color } = req.body;
  const result = db.prepare(
    `INSERT INTO employees (name, lastName, email, phone, address, image, schedule, workingDays, status, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(name, lastName, email, phone, address, image, schedule, JSON.stringify(workingDays || []), status || 'available', color || 'bg-blue-500');
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...employee, workingDays: JSON.parse(employee.workingDays) });
});

router.put('/employees/:id', (req, res) => {
  const { name, lastName, email, phone, address, image, schedule, workingDays, status, color } = req.body;
  db.prepare(
    `UPDATE employees SET name=?, lastName=?, email=?, phone=?, address=?, image=?, schedule=?, workingDays=?, status=?, color=?
     WHERE id=?`
  ).run(name, lastName, email, phone, address, image, schedule, JSON.stringify(workingDays || []), status, color, req.params.id);
  const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
  res.json({ ...employee, workingDays: JSON.parse(employee.workingDays) });
});

router.delete('/employees/:id', (req, res) => {
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Clients ─────────────────────────────────────────────────
router.get('/clients', (req, res) => {
  const rows = db.prepare('SELECT * FROM clients ORDER BY id').all();
  res.json(rows);
});

router.post('/clients', (req, res) => {
  const { name, lastName, email, phone, address, employeeId, notes } = req.body;
  const result = db.prepare(
    `INSERT INTO clients (name, lastName, email, phone, address, employeeId, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(name, lastName, email, phone, address, employeeId, notes || '');
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

router.put('/clients/:id', (req, res) => {
  const { name, lastName, email, phone, address, employeeId, notes } = req.body;
  db.prepare(
    `UPDATE clients SET name=?, lastName=?, email=?, phone=?, address=?, employeeId=?, notes=?
     WHERE id=?`
  ).run(name, lastName, email, phone, address, employeeId, notes, req.params.id);
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  res.json(client);
});

router.delete('/clients/:id', (req, res) => {
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Appointments ────────────────────────────────────────────
router.get('/appointments', (req, res) => {
  const rows = db.prepare('SELECT * FROM appointments ORDER BY id').all();
  res.json(rows);
});

router.post('/appointments', (req, res) => {
  const { employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color } = req.body;
  const result = db.prepare(
    `INSERT INTO appointments (employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes || '', zoomLink || '', color || 'bg-gray-500');
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(appointment);
});

router.put('/appointments/:id', (req, res) => {
  const { employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color } = req.body;
  db.prepare(
    `UPDATE appointments SET employeeId=?, employeeName=?, clientId=?, clientName=?, day=?, startHour=?, endHour=?, notes=?, zoomLink=?, color=?
     WHERE id=?`
  ).run(employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color, req.params.id);
  const appointment = db.prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id);
  res.json(appointment);
});

router.delete('/appointments/:id', (req, res) => {
  db.prepare('DELETE FROM appointments WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ─── Config ──────────────────────────────────────────────────
router.get('/config', (req, res) => {
  const config = db.prepare('SELECT * FROM config WHERE id = 1').get();
  if (!config) return res.json(null);
  const templates = db.prepare('SELECT * FROM email_templates ORDER BY id').all();
  res.json({
    notificationEmail: config.notificationEmail,
    businessInfo: {
      name: config.businessName,
      address: config.businessAddress,
      businessHours: config.businessHours,
      rnc: config.businessRnc,
    },
    emailTemplates: templates.map(t => ({ ...t, isActive: !!t.isActive })),
    calendarSync: {
      googleConnected: !!config.googleConnected,
      googleEmail: config.googleEmail,
      outlookConnected: !!config.outlookConnected,
      outlookEmail: config.outlookEmail,
    }
  });
});

router.put('/config', (req, res) => {
  const { notificationEmail, businessInfo, emailTemplates, calendarSync } = req.body;
  db.prepare(`
    UPDATE config SET
      notificationEmail = ?,
      businessName = ?,
      businessAddress = ?,
      businessHours = ?,
      businessRnc = ?,
      googleConnected = ?,
      googleEmail = ?,
      outlookConnected = ?,
      outlookEmail = ?
    WHERE id = 1
  `).run(
    notificationEmail,
    businessInfo?.name,
    businessInfo?.address,
    businessInfo?.businessHours,
    businessInfo?.rnc,
    calendarSync?.googleConnected ? 1 : 0,
    calendarSync?.googleEmail,
    calendarSync?.outlookConnected ? 1 : 0,
    calendarSync?.outlookEmail
  );

  if (emailTemplates) {
    db.prepare('DELETE FROM email_templates').run();
    const insert = db.prepare('INSERT INTO email_templates (name, subject, body, triggerType, isActive) VALUES (?, ?, ?, ?, ?)');
    for (const t of emailTemplates) {
      insert.run(t.name, t.subject, t.body, t.triggerType, t.isActive ? 1 : 0);
    }
  }

  const config = db.prepare('SELECT * FROM config WHERE id = 1').get();
  const templates = db.prepare('SELECT * FROM email_templates ORDER BY id').all();
  res.json({
    notificationEmail: config.notificationEmail,
    businessInfo: {
      name: config.businessName,
      address: config.businessAddress,
      businessHours: config.businessHours,
      rnc: config.businessRnc,
    },
    emailTemplates: templates.map(t => ({ ...t, isActive: !!t.isActive })),
    calendarSync: {
      googleConnected: !!config.googleConnected,
      googleEmail: config.googleEmail,
      outlookConnected: !!config.outlookConnected,
      outlookEmail: config.outlookEmail,
    }
  });
});

export default router;
