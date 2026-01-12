const express = require('express');
const router = express.Router();
const { createUser, findUserByUsername } = require('../db/users');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

router.get('/', (req, res) => {
    // Ideally pass list of users here if we want to show them
    // For now just the form
    res.render('admin', { title: 'Admin Panel' });
});

router.post('/users', (req, res) => {
    const { username, password, role, expireMinutes } = req.body;

    if (findUserByUsername(username)) {
        return res.render('admin', { error: 'Username already exists', title: 'Admin Panel' });
    }

    let finalExpireMinutes = expireMinutes ? parseInt(expireMinutes) : null;
    if (!finalExpireMinutes && role === 'user') {
        finalExpireMinutes = 1;
    }

    try {
        createUser(username, password, role, finalExpireMinutes);
        res.render('admin', { success: 'User created successfully', title: 'Admin Panel' });
    } catch (e) {
        res.render('admin', { error: 'Error creating user', title: 'Admin Panel' });
    }
});

module.exports = router;
