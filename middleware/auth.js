const { findUserById, deleteUser } = require('../db/users');

// Middleware to populate req.user if logged in
const authMiddleware = (req, res, next) => {
    const userId = req.signedCookies.user_id;
    if (!userId) {
        req.user = null;
        return next();
    }

    const user = findUserById(userId);

    if (!user) {
        // User might have been deleted manually or expired
        res.clearCookie('user_id');
        req.user = null;
        return next();
    }

    // Check expiration
    if (user.expire_at && Date.now() > user.expire_at) {
        deleteUser(userId);
        res.clearCookie('user_id');
        req.user = null;
        return next();
    }

    req.user = user;
    res.locals.user = user; // Make user available in HBS templates
    res.locals.isAdmin = user.role === 'admin';
    next();
};

const requireAuth = (req, res, next) => {
    if (!req.user) {
        // Check if it's an API request
        if (req.path.startsWith('/api/')) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }
        return res.redirect('/login');
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        // Check if it's an API request
        if (req.path.startsWith('/api/')) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }
        return res.status(403).send('Forbidden');
    }
    next();
};

module.exports = {
    authMiddleware,
    requireAuth,
    requireAdmin
};
