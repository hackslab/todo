const express = require('express');
const hbs = require('hbs');
const path = require('path');
const cookieParser = require('cookie-parser');
const { authMiddleware } = require('./middleware/auth');
const { createUser, findUserByUsername } = require('./db/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup HBS
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Basic helpers
hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser('secret-key-123')); // Simple secret for signed cookies
app.use(authMiddleware);

// Routes
app.use('/', require('./routes/auth'));
app.use('/', require('./routes/todos'));
app.use('/admin', require('./routes/admin'));
app.use('/api', require('./routes/api'));

// Seed Admin
const seedAdmin = () => {
    if (!findUserByUsername('admin')) {
        console.log('Seeding admin user...');
        createUser('admin', 'admin123', 'admin', null);
        console.log('Admin created: username=admin, password=admin123');
    }
};
seedAdmin();

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
