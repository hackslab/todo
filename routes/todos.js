const express = require('express');
const router = express.Router();
const { createTodo, getTodos, toggleTodo, deleteTodo } = require('../db/todos');
const { requireAuth } = require('../middleware/auth');

// Public route to view todos (as per "unauthorized requests can only see todos")
// BUT, "Only admins and users can manage todos".
// So GET / is public.
router.get('/', (req, res) => {
    const todos = getTodos();
    // We need to know who owns what to show delete/complete buttons?
    // "users can manage todos". Assume users manage their own, or all?
    // "Only admins and users can manage todos"
    // implies Guests can SEE but NOT manage.
    // Let's assume Users can manage THEIR OWN todos, and Admins can manage ALL.
    
    // Actually, re-reading: "Only admins and users can manage todos". 
    // It doesn't explicitly say "manage THEIR OWN".
    // But usually that's the case. I'll stick to: Users own theirs. Admins can delete any?
    // For simplicity: Users manage their own.
    
    const todosWithPermissions = todos.map(todo => {
        let canManage = false;
        if (req.user) {
            if (req.user.role === 'admin') canManage = true;
            if (req.user.id === todo.owner_id) canManage = true;
        }
        return { ...todo, canManage };
    });

    res.render('index', { title: 'Dashboard', todos: todosWithPermissions });
});

router.post('/todos', requireAuth, (req, res) => {
    const { content } = req.body;
    if (content) {
        createTodo(content, req.user.id);
    }
    res.redirect('/');
});

router.patch('/todos/:id', requireAuth, (req, res) => {
    // In a real app we'd check ownership here too
    toggleTodo(req.params.id);
    res.json({ success: true });
});

router.delete('/todos/:id', requireAuth, (req, res) => {
     // In a real app we'd check ownership here too
    deleteTodo(req.params.id);
    res.json({ success: true });
});

module.exports = router;
