const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const createUser = (username, password, role, expireMinutes = null) => {
    const id = uuidv4();
    const hash = bcrypt.hashSync(password, 10);
    const now = Date.now();
    let expireAt = null;

    // Logic is primarily handled in route, but we can respect explicit null vs undefined here if needed.
    // However, route passes resolved value.
    if (expireMinutes) {
        expireAt = now + (expireMinutes * 60 * 1000);
    }

    const stmt = db.prepare('INSERT INTO users (id, username, password, role, created_at, expire_at) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(id, username, hash, role, now, expireAt);
    return id;
};

const findUserByUsername = (username) => {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
};

const findUserById = (id) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
};

const deleteUser = (id) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
};

// Check for expired users and delete them
const deleteExpiredUsers = () => {
    const now = Date.now();
    const stmt = db.prepare('DELETE FROM users WHERE expire_at IS NOT NULL AND expire_at < ?');
    const result = stmt.run(now);
    if (result.changes > 0) {
        console.log(`Deleted ${result.changes} expired users.`);
    }
};

module.exports = {
    createUser,
    findUserByUsername,
    findUserById,
    deleteUser,
    deleteExpiredUsers
};
