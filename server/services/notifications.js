import nodemailer from 'nodemailer';
import { createHmac } from 'crypto';
import { buildVocabulary } from '../../shared/businessTypes.js';

const JWT_SECRET = process.env.JWT_SECRET || 'schedule-dashboard-secret-key-change-in-production';
// Las URL base se pueden sobrescribir (útil para pruebas con simuladores locales)
const WHATSAPP_API_BASE = process.env.WHATSAPP_API_BASE || 'https://graph.facebook.com';
const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

export const SECRET_MASK = '********';
export const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// ─── Utilidades ──────────────────────────────────────────────

export function formatHour(hour) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const display = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${display}:00 ${period}`;
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const textToHtml = (text) => escapeHtml(text).replace(/\n/g, '<br/>');

/** Variables disponibles en plantillas y mensajes. */
export function buildVariables(config, appointment, employee, client) {
  return {
    cliente_nombre: [client?.name, client?.lastName].filter(Boolean).join(' '),
    empleado_nombre: [employee?.name, employee?.lastName].filter(Boolean).join(' '),
    fecha_cita: dayNames[appointment.day] || `Día ${appointment.day}`,
    hora_cita: `${formatHour(appointment.startHour)} a ${formatHour(appointment.endHour)}`,
    negocio_nombre: config?.businessName || '',
    negocio_direccion: config?.businessAddress || 'No especificada',
    enlace_reunion: appointment.zoomLink || '',
    notas: appointment.notes || '',
  };
}

export function renderTemplate(template, variables) {
  return String(template ?? '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, key) => variables[key] ?? '');
}

/** Mensaje de confirmación por defecto, adaptado al tipo de negocio. */
export function buildConfirmationMessage(config, appointment, employee, client) {
  const vocab = buildVocabulary(config?.businessType);
  const v = buildVariables(config, appointment, employee, client);
  const noun = vocab.appointmentLower;
  const lines = [
    `Hola ${client?.name || ''},`,
    '',
    `Tu ${noun} en ${v.negocio_nombre || 'nuestro negocio'} quedó programad${vocab.appointment.gender === 'f' ? 'a' : 'o'}:`,
    `• ${vocab.employee.one}: ${v.empleado_nombre}`,
    `• Día: ${v.fecha_cita}`,
    `• Hora: ${v.hora_cita}`,
  ];
  if (config?.businessAddress) lines.push(`• Dirección: ${config.businessAddress}`);
  if (appointment.zoomLink) lines.push(`• Enlace: ${appointment.zoomLink}`);
  if (appointment.notes) lines.push(`• Notas: ${appointment.notes}`);
  lines.push('', 'Gracias.');
  return lines.join('\n');
}

/**
 * Normaliza un teléfono al formato E.164 sin "+" que exige WhatsApp Cloud API.
 * - Quita espacios, guiones, paréntesis y el "+".
 * - Quita el prefijo "00" internacional.
 * - Si tiene 10 dígitos (número nacional) antepone el código de país por defecto.
 */
export function normalizePhone(phone, defaultCountryCode = '1') {
  if (!phone) return '';
  let digits = String(phone).replace(/[^\d+]/g, '');
  const hadPlus = digits.startsWith('+');
  digits = digits.replace(/\D/g, '');
  if (!hadPlus && digits.startsWith('00')) digits = digits.slice(2);
  else if (!hadPlus && digits.length === 10) digits = `${String(defaultCountryCode).replace(/\D/g, '') || '1'}${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : '';
}

// ─── Telegram: vínculo seguro cliente ↔ chat ─────────────────

export function telegramLinkPayload(clientId) {
  const sig = createHmac('sha256', JWT_SECRET).update(`tg:${clientId}`).digest('hex').slice(0, 12);
  return `c${clientId}_${sig}`;
}

export function parseTelegramLinkPayload(payload) {
  const match = /^c(\d+)_([0-9a-f]{12})$/.exec(String(payload || ''));
  if (!match) return null;
  const clientId = Number(match[1]);
  return telegramLinkPayload(clientId) === payload ? clientId : null;
}

// ─── Resultado por canal ─────────────────────────────────────

const sent = (message = 'Enviado') => ({ status: 'sent', message });
const skipped = (message) => ({ status: 'skipped', message });
const failed = (message) => ({ status: 'failed', message });

function describeError(error) {
  return (error && (error.message || error.toString())) || 'Error desconocido';
}

// ─── Email ───────────────────────────────────────────────────

export function createTransporter(config) {
  const port = Number(config.smtpPort) || 587;
  return nodemailer.createTransport({
    host: config.smtpHost,
    port,
    secure: port === 465,
    auth: { user: config.smtpUser, pass: config.smtpPassword },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

export function isEmailConfigured(config) {
  return !!(config?.emailEnabled && config.notificationEmail && config.smtpHost && config.smtpPort && config.smtpUser && config.smtpPassword);
}

export async function sendEmail(config, { to, subject, text }) {
  if (!config?.emailEnabled) return skipped('El canal de email está desactivado');
  if (!config.notificationEmail || !config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
    return skipped('Configuración SMTP incompleta');
  }
  if (!to) return skipped('El cliente no tiene email');

  try {
    const fromName = config.emailFromName?.trim() || config.businessName?.trim();
    const from = fromName ? `"${fromName.replace(/"/g, '')}" <${config.notificationEmail}>` : config.notificationEmail;
    const info = await createTransporter(config).sendMail({ from, to, subject, text, html: `<p>${textToHtml(text)}</p>` });
    return sent(`Email enviado a ${to} (${info.messageId})`);
  } catch (error) {
    return failed(`No se pudo enviar el email: ${describeError(error)}`);
  }
}

// ─── WhatsApp (Cloud API) ────────────────────────────────────

export function isWhatsappConfigured(config) {
  return !!(config?.whatsappEnabled && config.whatsappPhoneNumberId && config.whatsappAccessToken);
}

export async function sendWhatsapp(config, { phone, text, templateParams }) {
  if (!config?.whatsappEnabled) return skipped('El canal de WhatsApp está desactivado');
  if (!config.whatsappPhoneNumberId || !config.whatsappAccessToken) return skipped('Configuración de WhatsApp incompleta');
  const to = normalizePhone(phone, config.phoneCountryCode);
  if (!to) return skipped('El cliente no tiene un teléfono válido');

  // Los mensajes iniciados por el negocio fuera de la ventana de 24 h exigen una plantilla aprobada por Meta.
  const useTemplate = !!config.whatsappTemplateName?.trim();
  const body = useTemplate
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: config.whatsappTemplateName.trim(),
          language: { code: config.whatsappTemplateLang || 'es' },
          components: templateParams?.length
            ? [{ type: 'body', parameters: templateParams.map(p => ({ type: 'text', text: String(p || '-') })) }]
            : [],
        },
      }
    : { messaging_product: 'whatsapp', to, type: 'text', text: { body: text, preview_url: true } };

  try {
    const response = await fetch(`${WHATSAPP_API_BASE}/${WHATSAPP_API_VERSION}/${config.whatsappPhoneNumberId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.whatsappAccessToken}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      return failed(`WhatsApp rechazó el mensaje: ${payload?.error?.message || response.statusText}`);
    }
    return sent(`WhatsApp enviado a +${to}`);
  } catch (error) {
    return failed(`No se pudo contactar WhatsApp: ${describeError(error)}`);
  }
}

// ─── Telegram (Bot API) ──────────────────────────────────────

export function isTelegramConfigured(config) {
  return !!(config?.telegramEnabled && config.telegramBotToken);
}

export async function telegramApi(token, method, payload) {
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || response.statusText || 'Error de Telegram');
  }
  return data.result;
}

export async function sendTelegram(config, { chatId, text }) {
  if (!config?.telegramEnabled) return skipped('El canal de Telegram está desactivado');
  if (!config.telegramBotToken) return skipped('Falta el token del bot de Telegram');
  if (!chatId) return skipped('El cliente aún no ha vinculado su Telegram');

  try {
    await telegramApi(config.telegramBotToken, 'sendMessage', { chat_id: chatId, text, disable_web_page_preview: true });
    return sent('Telegram enviado');
  } catch (error) {
    return failed(`Telegram rechazó el mensaje: ${describeError(error)}`);
  }
}

// ─── Envío a un cliente por todos los canales ────────────────

/**
 * Envía un mensaje al cliente por los canales indicados.
 * channels: { email: boolean, whatsapp: boolean, telegram: boolean }
 */
export async function notifyClient(config, { appointment, employee, client, channels, subject, text }) {
  const vars = buildVariables(config, appointment, employee, client);
  const results = {};

  if (channels.email) {
    results.email = await sendEmail(config, { to: client?.email, subject, text });
  }
  if (channels.whatsapp) {
    results.whatsapp = await sendWhatsapp(config, {
      phone: client?.phone,
      text,
      templateParams: [vars.cliente_nombre, vars.empleado_nombre, vars.fecha_cita, vars.hora_cita, vars.negocio_nombre],
    });
  }
  if (channels.telegram) {
    results.telegram = await sendTelegram(config, { chatId: client?.telegramChatId, text });
  }
  return results;
}

/** Texto corto para mostrar al usuario el resultado de los envíos. */
export function summarizeResults(results) {
  return Object.entries(results).map(([channel, r]) => ({ channel, ...r }));
}
