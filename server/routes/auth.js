import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', (req, res) => {
  const { name, lastName, companyName, email, password } = req.body;

  if (!name || !lastName || !companyName || !email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    return res.status(409).json({ error: 'El email ya está registrado' });
    return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    return res.status(401).json({ error: 'Email o contraseña inválidos' });
    return res.status(401).json({ error: 'Email o contraseña inválidos' });
    return res.status(401).json({ error: 'Token no proporcionado' });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;
