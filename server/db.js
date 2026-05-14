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
    image TEXT,
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    image TEXT,
    schedule TEXT,
    workingDays TEXT DEFAULT '[]',
    status TEXT DEFAULT 'available',
    color TEXT DEFAULT 'bg-blue-500',
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    employeeId INTEGER,
    notes TEXT DEFAULT '',
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
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
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS config (
    userId INTEGER PRIMARY KEY,
    notificationEmail TEXT,
    businessName TEXT,
    businessAddress TEXT,
    businessHours TEXT,
    businessRnc TEXT,
    googleConnected INTEGER DEFAULT 0,
    googleEmail TEXT,
    outlookConnected INTEGER DEFAULT 0,
    outlookEmail TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    triggerType TEXT NOT NULL,
    isActive INTEGER DEFAULT 1,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export default db;
