import pg from 'pg';

// PostgreSQL. Configura DATABASE_URL, p. ej.:
//   DATABASE_URL=postgresql://usuario:clave@localhost:5432/admore
// Para proveedores que exigen SSL (Neon, Supabase, Render…): DATABASE_SSL=true
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Falta la variable de entorno DATABASE_URL (ej. postgresql://usuario:clave@localhost:5432/admore).');
  process.exit(1);
}

// Los enteros de 64 bits (COUNT, etc.) se devuelven como número
pg.types.setTypeParser(20, (v) => Number(v));

const pool = new pg.Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

pool.on('error', (error) => console.error('Error inesperado en el pool de PostgreSQL:', error));

// ─── Esquema ─────────────────────────────────────────────────
// Los identificadores van sin comillas (PostgreSQL los pasa a minúsculas);
// al leer las filas se restauran los nombres camelCase que usa el resto del código.

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    lastName TEXT NOT NULL,
    companyName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    parentUserId INTEGER REFERENCES users(id) ON DELETE CASCADE,
    isActive INTEGER DEFAULT 1,
    image TEXT,
    createdAt TEXT DEFAULT to_char(now() at time zone 'utc', 'YYYY-MM-DD HH24:MI:SS')
  );

  CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    employeeId INTEGER,
    notes TEXT DEFAULT '',
    telegramChatId TEXT
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employeeId INTEGER NOT NULL,
    employeeName TEXT,
    clientId INTEGER NOT NULL,
    clientName TEXT,
    day INTEGER NOT NULL,
    startHour INTEGER NOT NULL,
    endHour INTEGER NOT NULL,
    notes TEXT DEFAULT '',
    zoomLink TEXT DEFAULT '',
    color TEXT DEFAULT 'bg-gray-500'
  );

  CREATE TABLE IF NOT EXISTS config (
    userId INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
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
    whatsappTemplateName TEXT,
    whatsappTemplateLang TEXT DEFAULT 'es',
    phoneCountryCode TEXT DEFAULT '1',
    telegramEnabled INTEGER DEFAULT 0,
    telegramBotToken TEXT,
    telegramBotUsername TEXT,
    businessType TEXT DEFAULT 'general',
    businessTypeLabel TEXT,
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
    outlookTokenExpiry TEXT
  );

  CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    triggerType TEXT NOT NULL,
    isActive INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reminder_log (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    appointmentId INTEGER NOT NULL,
    triggerType TEXT NOT NULL,
    sentOn TEXT NOT NULL,
    results TEXT,
    UNIQUE (appointmentId, triggerType, sentOn)
  );

  CREATE INDEX IF NOT EXISTS idx_employees_user ON employees (userId);
  CREATE INDEX IF NOT EXISTS idx_clients_user ON clients (userId);
  CREATE INDEX IF NOT EXISTS idx_appointments_user ON appointments (userId);
  CREATE INDEX IF NOT EXISTS idx_appointments_employee ON appointments (employeeId, day);
  CREATE INDEX IF NOT EXISTS idx_templates_user ON email_templates (userId);
  CREATE INDEX IF NOT EXISTS idx_users_parent ON users (parentUserId);
`;

// minúsculas -> camelCase, extraído del propio esquema
const CAMEL = new Map(
  [...new Set(SCHEMA.match(/\b[a-z]+[A-Z][A-Za-z]*\b/g) || [])].map((name) => [name.toLowerCase(), name])
);

function camelize(row) {
  if (!row) return row;
  const out = {};
  for (const key of Object.keys(row)) out[CAMEL.get(key) || key] = row[key];
  return out;
}

/** Convierte los marcadores "?" en $1, $2… */
function toPgSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function makeExecutor(client) {
  const query = (sql, params) => client.query(toPgSql(sql), params);
  return {
    /** Primera fila o undefined */
    async get(sql, ...params) {
      const result = await query(sql, params);
      return camelize(result.rows[0]);
    },
    /** Todas las filas */
    async all(sql, ...params) {
      const result = await query(sql, params);
      return result.rows.map(camelize);
    },
    /** Ejecuta una sentencia. `changes` = filas afectadas; `id` = id devuelto con RETURNING id */
    async run(sql, ...params) {
      const result = await query(sql, params);
      return { changes: result.rowCount, id: result.rows[0]?.id };
    },
  };
}

const db = {
  ...makeExecutor(pool),
  /** Ejecuta `fn(tx)` en una transacción; hace rollback si lanza un error. */
  async transaction(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(makeExecutor(client));
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },
  async close() {
    await pool.end();
  },
};

// Evita que dos instancias creen el esquema a la vez
const setupClient = await pool.connect();
try {
  await setupClient.query('SELECT pg_advisory_lock(727274)');
  await setupClient.query(SCHEMA);
  await setupClient.query('SELECT pg_advisory_unlock(727274)');
} finally {
  setupClient.release();
}

export default db;
