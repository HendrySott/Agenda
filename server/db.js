import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'schedule.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lastName TEXT NOT NULL,
    companyName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    image TEXT,
    schedule TEXT,
    workingDays TEXT DEFAULT '[]',
    status TEXT DEFAULT 'available',
    color TEXT DEFAULT 'bg-blue-500'
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    employeeId INTEGER,
    notes TEXT DEFAULT '',
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employeeId INTEGER NOT NULL,
    employeeName TEXT,
    clientId INTEGER NOT NULL,
    clientName TEXT,
    day INTEGER NOT NULL,
    startHour INTEGER NOT NULL,
    endHour INTEGER NOT NULL,
    notes TEXT DEFAULT '',
    zoomLink TEXT DEFAULT '',
    color TEXT DEFAULT 'bg-gray-500',
    FOREIGN KEY (employeeId) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    notificationEmail TEXT,
    businessName TEXT,
    businessAddress TEXT,
    businessHours TEXT,
    businessRnc TEXT,
    googleConnected INTEGER DEFAULT 0,
    googleEmail TEXT,
    outlookConnected INTEGER DEFAULT 0,
    outlookEmail TEXT
  );

  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    triggerType TEXT NOT NULL,
    isActive INTEGER DEFAULT 1
  );
`);

const rowCount = db.prepare('SELECT COUNT(*) as count FROM employees').get();
if (rowCount.count === 0) {
  const insertEmployee = db.prepare(`
    INSERT INTO employees (name, lastName, email, phone, address, schedule, workingDays, status, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const employees = [
    ['Ahmed', 'González', 'ahmed@ejemplo.com', '+1234567890', 'Calle Principal 123', '9:00 AM - 5:00 PM', JSON.stringify([1, 2, 3, 4, 5]), 'available', 'bg-blue-500'],
    ['Sarah', 'Martínez', 'sarah@ejemplo.com', '+1234567891', 'Avenida Central 456', '10:00 AM - 6:00 PM', JSON.stringify([1, 2, 3, 4, 5]), 'busy', 'bg-green-500'],
    ['Hassan', 'López', 'hassan@ejemplo.com', '+1234567892', 'Plaza Mayor 789', '8:00 AM - 4:00 PM', JSON.stringify([1, 2, 3, 4]), 'partially', 'bg-purple-500'],
    ['Fatima', 'Rodríguez', 'fatima@ejemplo.com', '+1234567893', 'Calle Secundaria 321', '11:00 AM - 7:00 PM', JSON.stringify([2, 3, 4, 5, 6]), 'available', 'bg-orange-500'],
    ['Omar', 'Fernández', 'omar@ejemplo.com', '+1234567894', 'Avenida Norte 654', '9:00 AM - 5:00 PM', JSON.stringify([1, 3, 5]), 'busy', 'bg-red-500'],
  ];

  for (const e of employees) {
    insertEmployee.run(...e);
  }

  const insertClient = db.prepare(`
    INSERT INTO clients (name, lastName, email, phone, address, employeeId, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const clients = [
    ['Ali', 'Hassan', 'ali@ejemplo.com', '+1234567895', 'Calle Cliente 111', 1, 'Cliente regular'],
    ['Amira', 'Khalil', 'amira@ejemplo.com', '+1234567896', 'Calle Cliente 222', 2, 'Nuevo cliente'],
    ['Mohamed', 'Ali', 'mohamed@ejemplo.com', '+1234567897', 'Calle Cliente 333', 3, 'VIP'],
    ['Layla', 'Ahmed', 'layla@ejemplo.com', '+1234567898', 'Calle Cliente 444', 1, 'Cliente desde 2020'],
    ['Yusuf', 'Hassan', 'yusuf@ejemplo.com', '+1234567899', 'Calle Cliente 555', 4, ''],
  ];

  for (const c of clients) {
    insertClient.run(...c);
  }

  const insertAppointment = db.prepare(`
    INSERT INTO appointments (employeeId, employeeName, clientId, clientName, day, startHour, endHour, notes, zoomLink, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const appointments = [
    [1, 'Ahmed González', 1, 'Ali Hassan', 1, 10, 11, 'Matemáticas - Revisión de álgebra', 'https://zoom.us/j/123456789', 'bg-blue-500'],
    [2, 'Sarah Martínez', 2, 'Amira Khalil', 1, 14, 15, 'Inglés - Discusión de literatura', 'https://zoom.us/j/987654321', 'bg-green-500'],
    [3, 'Hassan López', 3, 'Mohamed Ali', 2, 9, 10, 'Física - Mecánica', 'https://zoom.us/j/456789123', 'bg-purple-500'],
    [1, 'Ahmed González', 4, 'Layla Ahmed', 3, 11, 12, 'Matemáticas - Cálculo', 'https://zoom.us/j/789123456', 'bg-blue-500'],
    [4, 'Fatima Rodríguez', 5, 'Yusuf Hassan', 4, 16, 17, 'Química - Compuestos orgánicos', 'https://zoom.us/j/321654987', 'bg-orange-500'],
  ];

  for (const a of appointments) {
    insertAppointment.run(...a);
  }

  db.prepare(`
    INSERT INTO config (id, notificationEmail, businessName, businessAddress, businessHours, businessRnc)
    VALUES (1, 'notificaciones@ejemplo.com', 'Centro de Servicios Profesionales', 'Calle Principal #123, Santo Domingo, República Dominicana', 'Lunes a Viernes: 9:00 AM - 6:00 PM, Sábados: 9:00 AM - 1:00 PM', '123-45678-9')
  `).run();

  const insertTemplate = db.prepare(`
    INSERT INTO email_templates (name, subject, body, triggerType, isActive)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertTemplate.run('Recordatorio 2 días antes', 'Recordatorio: Tu cita en {{negocio_nombre}}', 'Hola {{cliente_nombre}},\n\nEste es un recordatorio de que tienes una cita programada:\n\nFecha: {{fecha_cita}}\nHora: {{hora_cita}}\nCon: {{empleado_nombre}}\n\nUbicación: {{negocio_direccion}}\n\nSi necesitas cancelar o reprogramar, por favor contáctanos.\n\nSaludos,\n{{negocio_nombre}}', 'two_days_before', 1);
  insertTemplate.run('Recordatorio el día de la cita', '¡Hoy es tu cita!', 'Hola {{cliente_nombre}},\n\nTe recordamos que hoy tienes una cita:\n\nHora: {{hora_cita}}\nCon: {{empleado_nombre}}\n\n¡Te esperamos!\n\n{{negocio_nombre}}', 'today', 1);
}

export default db;
