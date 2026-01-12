const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'todo.sqlite');
const db = new Database(dbPath);

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT CHECK(role IN ('admin', 'user')),
        created_at INTEGER,
        expire_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT,
        owner_id TEXT,
        is_completed INTEGER DEFAULT 0,
        created_at INTEGER
    );
`);

console.log('Database initialized and tables created.');

module.exports = db;
