import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken, authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { name, lastName, companyName, email, password } = req.body;

  if (!name || !lastName || !companyName || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, lastName, companyName, email, password) VALUES (?, ?, ?, ?, ?)'
  ).run(name, lastName, companyName, email, hashedPassword);

  const userId = result.lastInsertRowid;
  db.prepare('INSERT INTO config (userId) VALUES (?)').run(userId);

  const user = { id: userId, name, lastName, companyName, email, image: null };
  const token = generateToken(user);

  res.status(201).json({ user, token });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Email o contraseña inválidos' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Email o contraseña inválidos' });
  }

  const token = generateToken(user);
  const { password: _, ...safeUser } = user;

  res.json({ user: safeUser, token });
});

router.put('/account', authMiddleware, (req, res) => {
  const { name, lastName, companyName, email, currentPassword, newPassword } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (currentPassword) {
    const valid = bcrypt.compareSync(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
  }

  const updateFields = [];
  const updateValues = [];

  if (name) { updateFields.push('name = ?'); updateValues.push(name); }
  if (lastName) { updateFields.push('lastName = ?'); updateValues.push(lastName); }
  if (companyName) { updateFields.push('companyName = ?'); updateValues.push(companyName); }
  if (email && email !== user.email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
    if (existing) return res.status(409).json({ error: 'El email ya está registrado' });
    updateFields.push('email = ?'); updateValues.push(email);
  }
  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Debes proporcionar la contraseña actual' });
    updateFields.push('password = ?'); updateValues.push(bcrypt.hashSync(newPassword, 10));
  }

  if (updateFields.length > 0) {
    updateValues.push(req.user.id);
    db.prepare(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`).run(...updateValues);
  }

  const updated = db.prepare('SELECT id, name, lastName, companyName, email, image, createdAt FROM users WHERE id = ?').get(req.user.id);
  const token = generateToken(updated);

  res.json({ user: updated, token });
});

router.put('/avatar', authMiddleware, (req, res) => {
  const { image } = req.body;
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Imagen inválida' });
  }
  db.prepare('UPDATE users SET image = ? WHERE id = ?').run(image, req.user.id);
  const user = db.prepare('SELECT id, name, lastName, companyName, email, image, createdAt FROM users WHERE id = ?').get(req.user.id);
  const token = generateToken(user);
  res.json({ user, token });
});

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'schedule-dashboard-secret-key-change-in-production';
    const { default: jwt } = await import('jsonwebtoken');
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const user = db.prepare('SELECT id, name, lastName, companyName, email, image, createdAt FROM users WHERE id = ?').get(decoded.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user });
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
