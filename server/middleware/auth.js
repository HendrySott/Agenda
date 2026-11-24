import jwt from 'jsonwebtoken';
import db from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'schedule-dashboard-secret-key-change-in-production';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      accountOwnerId: user.parentUserId || user.id,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await db.get('SELECT id, name, lastName, companyName, email, parentUserId, isActive FROM users WHERE id = ?', decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuario deshabilitado' });
    }

    const accountOwnerId = user.parentUserId || user.id;
    req.user = {
      ...decoded,
      ...user,
      accountOwnerId,
      isMainAccount: user.id === accountOwnerId,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
