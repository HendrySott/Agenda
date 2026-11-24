// Copia los datos de la base SQLite anterior (server/schedule.db) a PostgreSQL.
//
// Uso:
//   npm install --no-save better-sqlite3
//   DATABASE_URL=postgresql://... npm run db:migrate-sqlite [ruta/a/schedule.db]
//
// Es seguro ejecutarlo varias veces: las filas existentes (mismo id) no se duplican.
import 'dotenv/config';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const here = dirname(fileURLToPath(import.meta.url));
const sqlitePath = process.argv[2] || join(here, '..', 'schedule.db');

if (!existsSync(sqlitePath)) {
  console.error(`No se encontró ${sqlitePath}`);
  process.exit(1);
}

let Database;
try {
  ({ default: Database } = await import('better-sqlite3'));
} catch {
  console.error('Falta better-sqlite3. Ejecuta: npm install --no-save better-sqlite3');
  process.exit(1);
}

const { default: db } = await import('../db.js');
const sqlite = new Database(sqlitePath, { readonly: true });

// Orden respetando claves foráneas. "id" = tabla con SERIAL cuya secuencia hay que ajustar.
const TABLES = [
  { name: 'users', serial: true },
  { name: 'config', serial: false },
  { name: 'employees', serial: true },
  { name: 'clients', serial: true },
  { name: 'appointments', serial: true },
  { name: 'email_templates', serial: true },
];

const exists = (table) => !!sqlite.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(table);

await db.transaction(async (tx) => {
  // Los usuarios secundarios dependen de la cuenta principal: se insertan después
  for (const { name, serial } of TABLES) {
    if (!exists(name)) continue;
    let rows = sqlite.prepare(`SELECT * FROM ${name}`).all();
    if (name === 'users') rows = [...rows.filter(r => !r.parentUserId), ...rows.filter(r => r.parentUserId)];

    let copied = 0;
    for (const row of rows) {
      const columns = Object.keys(row);
      const placeholders = columns.map(() => '?').join(', ');
      const conflict = name === 'config' ? '(userId)' : '(id)';
      const result = await tx.run(
        `INSERT INTO ${name} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT ${conflict} DO NOTHING`,
        ...columns.map(c => row[c])
      );
      copied += result.changes;
    }
    if (serial) {
      await tx.run(`SELECT setval(pg_get_serial_sequence('${name}', 'id'), COALESCE((SELECT MAX(id) FROM ${name}), 1))`);
    }
    console.log(`${name}: ${copied} de ${rows.length} filas copiadas`);
  }
});

sqlite.close();
await db.close();
console.log('Migración completada.');
