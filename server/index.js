import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { existsSync } from 'fs';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import { startReminderScheduler } from './services/reminders.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Errores de la base de datos o de código: respuesta JSON uniforme
app.use('/api', (error, _req, res, _next) => {
  if (error?.code === '22P02') return res.status(400).json({ error: 'Identificador inválido' });
  console.error('Error en la API:', error);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const distPath = join(import.meta.dirname, '..', 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('/{*path}', (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  startReminderScheduler();
});
