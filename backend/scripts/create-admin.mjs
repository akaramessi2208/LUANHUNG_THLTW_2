import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { mkdirSync } from 'node:fs';

const prompt = createInterface({ input: stdin, output: stdout });
const email = (process.argv[2] || await prompt.question('Admin email: ')).trim().toLowerCase();
const password = await prompt.question('Admin password (minimum 10 characters): ');
prompt.close();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
  console.error('Email or password is invalid.');
  process.exitCode = 1;
} else {
  const configuredPath = process.env.SQLITE_DATABASE_PATH || './data/luanhung.sqlite';
  const databasePath = path.resolve(process.cwd(), configuredPath);
  mkdirSync(path.dirname(databasePath), { recursive: true });
  const db = new DatabaseSync(databasePath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      email_verified_at TEXT,
      password TEXT NOT NULL,
      remember_token TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      deleted_at TEXT,
      created_at TEXT,
      updated_at TEXT
    )
  `);
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const passwordHash = await bcrypt.hash(password, 12);

  if (user) {
    db.prepare('UPDATE users SET password = ?, role = ?, deleted_at = NULL, updated_at = ? WHERE id = ?')
      .run(passwordHash, 'admin', now, user.id);
  } else {
    db.prepare('INSERT INTO users (name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run('LuanHung Admin', email, passwordHash, 'admin', now, now);
  }

  db.close();
  console.log(`Administrator account is ready: ${email}`);
}
