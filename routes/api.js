const express = require('express');
const router = express.Router();
const { createUser, findUserByUsername, deleteUser } = require('../db/users');
const { createTodo, getTodos, getTodoById, toggleTodo, deleteTodo } = require('../db/todos');
const bcrypt = require('bcryptjs');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Login API
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = findUserByUsername(username);

    if (user && bcrypt.compareSync(password, user.password)) {
        // Check expiry on login
        if (user.expire_at && Date.now() > user.expire_at) {
            deleteUser(user.id);
            return res.json({ success: false, error: 'Account expired' });
        }

        res.cookie('user_id', user.id, { signed: true, httpOnly: true });
        return res.json({ success: true });
    }

    res.json({ success: false, error: 'Invalid credentials' });
});

// Get all todos
router.get('/todos', (req, res) => {
    const todos = getTodos();
    
    const todosWithPermissions = todos.map(todo => {
        let canManage = false;
        if (req.user) {
            if (req.user.role === 'admin') canManage = true;
            if (req.user.id === todo.owner_id) canManage = true;
        }
        return { ...todo, canManage };
    });

    res.json({ success: true, todos: todosWithPermissions });
});

// Get single todo (raw content)
router.get('/todos/:id', (req, res) => {
    const todo = getTodoById(req.params.id);
    if (!todo) {
        return res.status(404).send('Todo not found');
    }
    
    // Check if user can see this todo
    // Currently "unauthorized requests can only see todos" so public viewing is fine.

    res.set('Content-Type', 'text/plain');
    res.send(todo.content);
});

// Create todo
router.post('/todos', requireAuth, (req, res) => {
    const { content } = req.body;
    
    if (!content) {
        return res.json({ success: false, error: 'Content is required' });
    }

    try {
        const id = createTodo(content, req.user.id);
        res.json({ success: true, id });
    } catch (error) {
        res.json({ success: false, error: 'Failed to create todo' });
    }
});

// Toggle todo completion
router.patch('/todos/:id/toggle', requireAuth, (req, res) => {
    const todo = getTodoById(req.params.id);
    
    if (!todo) {
        return res.json({ success: false, error: 'Todo not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && req.user.id !== todo.owner_id) {
        return res.json({ success: false, error: 'Permission denied' });
    }

    try {
        toggleTodo(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: 'Failed to update todo' });
    }
});

// Delete todo
router.delete('/todos/:id', requireAuth, (req, res) => {
    const todo = getTodoById(req.params.id);
    
    if (!todo) {
        return res.json({ success: false, error: 'Todo not found' });
    }

    // Check permission
    if (req.user.role !== 'admin' && req.user.id !== todo.owner_id) {
        return res.json({ success: false, error: 'Permission denied' });
    }

    try {
        deleteTodo(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: 'Failed to delete todo' });
    }
});

// Admin: Create user
router.post('/admin/users', requireAdmin, (req, res) => {
    const { username, password, role, expireMinutes } = req.body;

    if (findUserByUsername(username)) {
        return res.json({ success: false, error: 'Username already exists' });
    }

    // Default expiry logic:
    // If expireMinutes is provided, use it.
    // If NOT provided:
    //   - If role is 'user', default to 1 minute.
    //   - If role is 'admin', default to null (no expiry).
    let finalExpireMinutes = expireMinutes ? parseInt(expireMinutes) : null;

    if (!finalExpireMinutes && role === 'user') {
        finalExpireMinutes = 1;
    }

    try {
        createUser(username, password, role, finalExpireMinutes);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: 'Error creating user' });
    }
});

module.exports = router;
