const express = require('express');
const router = express.Router();
const { findUserByUsername } = require('../db/users');
const bcrypt = require('bcryptjs');

router.get('/login', (req, res) => {
    if (req.user) {
        return res.redirect('/');
    }
    res.render('login', { title: 'Login' });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = findUserByUsername(username);

    if (user && bcrypt.compareSync(password, user.password)) {
         // check expiry on login too, though middleware does it on next request
        if (user.expire_at && Date.now() > user.expire_at) {
             return res.render('login', { error: 'Account expired' });
        }

        res.cookie('user_id', user.id, { signed: true, httpOnly: true });
        return res.redirect('/');
    }

    res.render('login', { error: 'Invalid credentials' });
});

router.get('/logout', (req, res) => {
    res.clearCookie('user_id');
    res.redirect('/login');
});

module.exports = router;
