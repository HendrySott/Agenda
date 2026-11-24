import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { randomBytes } from 'crypto';
import { generateToken, authMiddleware } from '../middleware/auth.js';
import { isValidBusinessType, buildDefaultTemplates, DEFAULT_BUSINESS_TYPE } from '../../shared/businessTypes.js';

const router = Router();

const publicUserSelect = `
  id, name, lastName, companyName, email, image, parentUserId, isActive, createdAt
`;

function toPublicUser(user) {
  if (!user) return null;
  const accountOwnerId = user.parentUserId || user.id;
  return {
    id: user.id,
    name: user.name,
    lastName: user.lastName,
    companyName: user.companyName,
    email: user.email,
    image: user.image,
    parentUserId: user.parentUserId,
    accountOwnerId,
    isActive: !!user.isActive,
    isMainAccount: user.id === accountOwnerId,
    createdAt: user.createdAt,
  };
}

function requireMainAccount(req, res) {
  if (!req.user.isMainAccount) {
    res.status(403).json({ error: 'Solo la cuenta principal puede administrar usuarios' });
    return false;
  }
  return true;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

router.post('/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const lastName = String(req.body.lastName || '').trim();
  const companyName = String(req.body.companyName || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const businessType = isValidBusinessType(req.body.businessType) ? req.body.businessType : DEFAULT_BUSINESS_TYPE;
  const businessTypeLabel = businessType === 'other' ? String(req.body.businessTypeLabel || '').trim() : '';

  if (!name || !lastName || !companyName || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'El email no es válido' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (businessType === 'other' && !businessTypeLabel) {
    return res.status(400).json({ error: 'Especifica qué tipo de negocio tienes' });
  }

  const existing = await db.get('SELECT id FROM users WHERE lower(email) = ?', email);
  if (existing) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  let userId;
  try {
    userId = await db.transaction(async (tx) => {
      const { id } = await tx.run(
        'INSERT INTO users (name, lastName, companyName, email, password) VALUES (?, ?, ?, ?, ?) RETURNING id',
        name, lastName, companyName, email, hashedPassword
      );

      await tx.run(
        'INSERT INTO config (userId, businessName, businessType, businessTypeLabel) VALUES (?, ?, ?, ?)',
        id, companyName, businessType, businessTypeLabel
      );

      // Plantillas de recordatorio adaptadas al tipo de negocio
      for (const t of buildDefaultTemplates(businessType)) {
        await tx.run(
          'INSERT INTO email_templates (userId, name, subject, body, triggerType, isActive) VALUES (?, ?, ?, ?, ?, ?)',
          id, t.name, t.subject, t.body, t.triggerType, t.isActive ? 1 : 0
        );
      }
      return id;
    });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'El email ya está registrado' });
    throw error;
  }

  const user = { id: userId, name, lastName, companyName, email, image: null, parentUserId: null, isActive: 1 };
  const token = generateToken(user);

  res.status(201).json({ user: toPublicUser(user), token });
});

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
  }

  const user = await db.get('SELECT * FROM users WHERE lower(email) = ?', email);
  if (!user) {
    return res.status(401).json({ error: 'Email o contraseña inválidos' });
  }

  if (!user.isActive) {
    return res.status(403).json({ error: 'Usuario deshabilitado' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: 'Email o contraseña inválidos' });
  }

  const token = generateToken(user);

  res.json({ user: toPublicUser(user), token });
});

router.put('/account', authMiddleware, async (req, res) => {
  const { name, lastName, companyName, email, currentPassword, newPassword } = req.body;

  const user = await db.get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  if (currentPassword) {
    const valid = bcrypt.compareSync(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
  }

  const updateFields = [];
  const updateValues = [];

  if (name) { updateFields.push('name = ?'); updateValues.push(name); }
  if (lastName) { updateFields.push('lastName = ?'); updateValues.push(lastName); }
  if (companyName && req.user.isMainAccount) { updateFields.push('companyName = ?'); updateValues.push(companyName); }
  const nextEmail = email ? normalizeEmail(email) : '';
  if (nextEmail && nextEmail !== user.email) {
    if (!EMAIL_RE.test(nextEmail)) return res.status(400).json({ error: 'El email no es válido' });
    const existing = await db.get('SELECT id FROM users WHERE lower(email) = ? AND id != ?', nextEmail, req.user.id);
    if (existing) return res.status(409).json({ error: 'El email ya está registrado' });
    updateFields.push('email = ?'); updateValues.push(nextEmail);
  }
  if (newPassword) {
    if (String(newPassword).length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    if (!currentPassword) return res.status(400).json({ error: 'Debes proporcionar la contraseña actual' });
    updateFields.push('password = ?'); updateValues.push(bcrypt.hashSync(newPassword, 10));
  }

  if (updateFields.length > 0) {
    updateValues.push(req.user.id);
    await db.run(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, ...updateValues);
  }

  const updated = await db.get(`SELECT ${publicUserSelect} FROM users WHERE id = ?`, req.user.id);
  const token = generateToken(updated);

  res.json({ user: toPublicUser(updated), token });
});

router.put('/avatar', authMiddleware, async (req, res) => {
  const { image } = req.body;
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Imagen inválida' });
  }
  await db.run('UPDATE users SET image = ? WHERE id = ?', image, req.user.id);
  const user = await db.get(`SELECT ${publicUserSelect} FROM users WHERE id = ?`, req.user.id);
  const token = generateToken(user);
  res.json({ user: toPublicUser(user), token });
});

router.get('/users', authMiddleware, async (req, res) => {
  if (!requireMainAccount(req, res)) return;

  const users = await db.all(`
    SELECT ${publicUserSelect}
    FROM users
    WHERE parentUserId = ?
    ORDER BY isActive DESC, lower(name), lower(lastName)
  `, req.user.accountOwnerId);

  res.json(users.map(toPublicUser));
});

router.post('/users', authMiddleware, async (req, res) => {
  if (!requireMainAccount(req, res)) return;

  const name = String(req.body.name || '').trim();
  const lastName = String(req.body.lastName || '').trim();
  const email = normalizeEmail(req.body.email);
  if (!name || !lastName || !email) {
    return res.status(400).json({ error: 'Nombre, apellido y email son obligatorios' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'El email no es válido' });
  }

  const existing = await db.get('SELECT id FROM users WHERE lower(email) = ?', email);
  if (existing) {
    return res.status(409).json({ error: 'El email ya está registrado' });
  }

  const owner = await db.get('SELECT id, companyName FROM users WHERE id = ?', req.user.accountOwnerId);
  if (!owner) {
    return res.status(404).json({ error: 'Cuenta principal no encontrada' });
  }

  const defaultPassword = randomBytes(6).toString('base64url');
  const result = await db.run(`
    INSERT INTO users (name, lastName, companyName, email, password, parentUserId, isActive)
    VALUES (?, ?, ?, ?, ?, ?, 1)
    RETURNING id
  `, name, lastName, owner.companyName, email, bcrypt.hashSync(defaultPassword, 10), owner.id);

  const user = await db.get(`SELECT ${publicUserSelect} FROM users WHERE id = ?`, result.id);
  res.status(201).json({ user: toPublicUser(user), defaultPassword });
});

router.put('/users/:id/status', authMiddleware, async (req, res) => {
  if (!requireMainAccount(req, res)) return;

  const { isActive } = req.body;
  const user = await db.get('SELECT id FROM users WHERE id = ? AND parentUserId = ?', req.params.id, req.user.accountOwnerId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  await db.run('UPDATE users SET isActive = ? WHERE id = ? AND parentUserId = ?', isActive ? 1 : 0, req.params.id, req.user.accountOwnerId);

  const updated = await db.get(`SELECT ${publicUserSelect} FROM users WHERE id = ?`, req.params.id);
  res.json(toPublicUser(updated));
});

router.delete('/users/:id', authMiddleware, async (req, res) => {
  if (!requireMainAccount(req, res)) return;

  const user = await db.get('SELECT id FROM users WHERE id = ? AND parentUserId = ?', req.params.id, req.user.accountOwnerId);
  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  await db.run('DELETE FROM users WHERE id = ? AND parentUserId = ?', req.params.id, req.user.accountOwnerId);
  res.json({ success: true });
});

router.get('/me', authMiddleware, async (req, res) => {
  const user = await db.get(`SELECT ${publicUserSelect} FROM users WHERE id = ?`, req.user.id);
  res.json({ user: toPublicUser(user) });
});

export default router;
