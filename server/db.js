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
    parentUserId INTEGER,
    isActive INTEGER DEFAULT 1,
    image TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (parentUserId) REFERENCES users(id) ON DELETE CASCADE
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
    emailEnabled INTEGER DEFAULT 1,
    emailFromName TEXT,
    smtpHost TEXT,
    smtpPort TEXT,
    smtpUser TEXT,
    smtpPassword TEXT,
    whatsappEnabled INTEGER DEFAULT 0,
    whatsappBusinessPhone TEXT,
    whatsappPhoneNumberId TEXT,
    whatsappBusinessAccountId TEXT,
    whatsappAccessToken TEXT,
    whatsappWebhookVerifyToken TEXT,
    businessName TEXT,
    businessAddress TEXT,
    businessHours TEXT,
    businessRnc TEXT,
    googleConnected INTEGER DEFAULT 0,
    googleEmail TEXT,
    googleRefreshToken TEXT,
    googleAccessToken TEXT,
    googleTokenExpiry TEXT,
    outlookConnected INTEGER DEFAULT 0,
    outlookEmail TEXT,
    outlookRefreshToken TEXT,
    outlookAccessToken TEXT,
    outlookTokenExpiry TEXT,
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

const userColumns = db.prepare('PRAGMA table_info(users)').all().map(column => column.name);

if (!userColumns.includes('parentUserId')) {
  db.exec('ALTER TABLE users ADD COLUMN parentUserId INTEGER REFERENCES users(id) ON DELETE CASCADE');
}

if (!userColumns.includes('isActive')) {
  db.exec('ALTER TABLE users ADD COLUMN isActive INTEGER DEFAULT 1');
  db.prepare('UPDATE users SET isActive = 1 WHERE isActive IS NULL').run();
}

const configColumns = db.prepare('PRAGMA table_info(config)').all().map(column => column.name);
const configMigrations = [
  ['emailEnabled', 'ALTER TABLE config ADD COLUMN emailEnabled INTEGER DEFAULT 1'],
  ['emailFromName', 'ALTER TABLE config ADD COLUMN emailFromName TEXT'],
  ['smtpHost', 'ALTER TABLE config ADD COLUMN smtpHost TEXT'],
  ['smtpPort', 'ALTER TABLE config ADD COLUMN smtpPort TEXT'],
  ['smtpUser', 'ALTER TABLE config ADD COLUMN smtpUser TEXT'],
  ['smtpPassword', 'ALTER TABLE config ADD COLUMN smtpPassword TEXT'],
  ['whatsappEnabled', 'ALTER TABLE config ADD COLUMN whatsappEnabled INTEGER DEFAULT 0'],
  ['whatsappBusinessPhone', 'ALTER TABLE config ADD COLUMN whatsappBusinessPhone TEXT'],
  ['whatsappPhoneNumberId', 'ALTER TABLE config ADD COLUMN whatsappPhoneNumberId TEXT'],
  ['whatsappBusinessAccountId', 'ALTER TABLE config ADD COLUMN whatsappBusinessAccountId TEXT'],
  ['whatsappAccessToken', 'ALTER TABLE config ADD COLUMN whatsappAccessToken TEXT'],
  ['whatsappWebhookVerifyToken', 'ALTER TABLE config ADD COLUMN whatsappWebhookVerifyToken TEXT'],
  ['googleRefreshToken', 'ALTER TABLE config ADD COLUMN googleRefreshToken TEXT'],
  ['googleAccessToken', 'ALTER TABLE config ADD COLUMN googleAccessToken TEXT'],
  ['googleTokenExpiry', 'ALTER TABLE config ADD COLUMN googleTokenExpiry TEXT'],
  ['outlookRefreshToken', 'ALTER TABLE config ADD COLUMN outlookRefreshToken TEXT'],
  ['outlookAccessToken', 'ALTER TABLE config ADD COLUMN outlookAccessToken TEXT'],
  ['outlookTokenExpiry', 'ALTER TABLE config ADD COLUMN outlookTokenExpiry TEXT'],
];

for (const [column, statement] of configMigrations) {
  if (!configColumns.includes(column)) {
    db.exec(statement);
  }
}

export default db;
