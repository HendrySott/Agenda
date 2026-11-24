import db from '../db.js';
import { buildVariables, renderTemplate, notifyClient } from './notifications.js';

// Hora local del servidor a partir de la cual se envían los recordatorios del día.
const REMINDER_START_HOUR = Number(process.env.REMINDER_START_HOUR ?? 8);
const CHECK_INTERVAL_MS = 10 * 60 * 1000;

const pad = (n) => String(n).padStart(2, '0');
const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Día de la semana de las citas que deben recibir recordatorio hoy para cada tipo de plantilla. */
function targetDayFor(triggerType, now) {
  if (triggerType === 'two_days_before') return (now.getDay() + 2) % 7;
  if (triggerType === 'today') return now.getDay();
  return null; // "custom" no se envía automáticamente
}

export async function runReminders(now = new Date()) {
  if (now.getHours() < REMINDER_START_HOUR) return { sent: 0 };

  const accounts = await db.all(`
    SELECT c.* FROM config c
    WHERE (c.emailEnabled = 1 OR c.whatsappEnabled = 1 OR c.telegramEnabled = 1)
  `);

  const today = toDateKey(now);
  let total = 0;

  for (const config of accounts) {
    const templates = await db.all('SELECT * FROM email_templates WHERE userId = ? AND isActive = 1 ORDER BY id', config.userId);
    if (templates.length === 0) continue;

    // Una plantilla activa por tipo de disparo
    const byTrigger = new Map();
    for (const t of templates) if (!byTrigger.has(t.triggerType)) byTrigger.set(t.triggerType, t);

    for (const [triggerType, template] of byTrigger) {
      const day = targetDayFor(triggerType, now);
      if (day === null) continue;

      const appointments = await db.all('SELECT * FROM appointments WHERE userId = ? AND day = ?', config.userId, day);
      for (const appointment of appointments) {
        // El recordatorio "el mismo día" no tiene sentido si la cita ya empezó
        if (triggerType === 'today' && appointment.startHour <= now.getHours()) continue;

        const already = await db.get('SELECT 1 FROM reminder_log WHERE appointmentId = ? AND triggerType = ? AND sentOn = ?', appointment.id, triggerType, today);
        if (already) continue;

        const client = await db.get('SELECT * FROM clients WHERE id = ? AND userId = ?', appointment.clientId, config.userId);
        const employee = await db.get('SELECT * FROM employees WHERE id = ? AND userId = ?', appointment.employeeId, config.userId);
        if (!client) continue;

        // Se registra antes de enviar para no duplicar si el servidor se reinicia a mitad del proceso
        const claimed = await db.run('INSERT INTO reminder_log (userId, appointmentId, triggerType, sentOn) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING', config.userId, appointment.id, triggerType, today);
        if (claimed.changes === 0) continue; // otra instancia ya lo está enviando

        const vars = buildVariables(config, appointment, employee, client);
        const results = await notifyClient(config, {
          appointment,
          employee,
          client,
          channels: {
            email: !!config.emailEnabled,
            whatsapp: !!config.whatsappEnabled,
            telegram: !!config.telegramEnabled,
          },
          subject: renderTemplate(template.subject, vars),
          text: renderTemplate(template.body, vars),
        });

        await db.run('UPDATE reminder_log SET results = ? WHERE appointmentId = ? AND triggerType = ? AND sentOn = ?', JSON.stringify(results), appointment.id, triggerType, today);
        total += Object.values(results).filter(r => r.status === 'sent').length;
      }
    }
  }

  // Limpieza de registros antiguos
  await db.run("DELETE FROM reminder_log WHERE sentOn < to_char(CURRENT_DATE - 30, 'YYYY-MM-DD')");
  return { sent: total };
}

export function startReminderScheduler() {
  const tick = () => runReminders().catch(error => console.error('Error en recordatorios:', error));
  setTimeout(tick, 15 * 1000);
  setInterval(tick, CHECK_INTERVAL_MS);
  console.log(`Recordatorios automáticos activos (desde las ${REMINDER_START_HOUR}:00, cada 10 min).`);
}
