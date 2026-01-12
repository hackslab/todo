// SPA functionality for Todo App

// Helper function to show messages using custom toast
function showMessage(type, text) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type === 'error' ? 'error' : 'success'}`;
    
    const icon = type === 'error' 
        ? '<i class="fa-solid fa-circle-exclamation" style="color: #dc3545;"></i>'
        : '<i class="fa-solid fa-circle-check" style="color: #28a745;"></i>';
        
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">${text}</div>
    `;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('removing');
        toast.addEventListener('transitionend', () => {
            if (toast.parentNode) {
                toast.remove();
            }
        });
    }, 3000);
}
// Custom confirmation dialog
function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const messageEl = document.getElementById('modalMessage');
        const confirmBtn = document.getElementById('modalConfirmBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');

        if (!modal || !messageEl || !confirmBtn || !cancelBtn) {
            resolve(confirm(message));
            return;
        }

        messageEl.textContent = message;
        modal.style.display = 'flex';
        // Force reflow
        modal.offsetHeight;
        modal.classList.add('active');

        const cleanup = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
        };

        const onConfirm = () => {
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
    });
}

// Login form handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password')
                })
            });

            const data = await response.json();
            
            if (data.success) {
                window.location.href = '/';
            } else {
                showMessage('error', data.error || 'Login failed');
            }
        } catch (error) {
            showMessage('error', 'An error occurred');
        }
    });
}

// Add todo form handler
const addTodoForm = document.getElementById('addTodoForm');
if (addTodoForm) {
    addTodoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(addTodoForm);
        const content = formData.get('content');

        if (!content) return;

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            const data = await response.json();
            
            if (data.success) {
                addTodoForm.reset();
                await loadTodos();
                showMessage('success', 'Todo added successfully');
            } else {
                showMessage('error', data.error || 'Failed to add todo');
            }
        } catch (error) {
            showMessage('error', 'An error occurred');
        }
    });
}

// Load todos dynamically
async function loadTodos() {
    try {
        const response = await fetch('/api/todos');
        const data = await response.json();
        
        const todoList = document.getElementById('todoList');
        if (!todoList) return;

        if (data.todos.length === 0) {
            todoList.innerHTML = `
                <li style="text-align: center; color: #999; padding: 24px;">
                    <i class="fa-regular fa-clipboard" style="font-size: 48px; color: #ddd; display: block; margin-bottom: 12px;"></i>
                    No todos yet.
                </li>
            `;
            return;
        }

        todoList.innerHTML = data.todos.map(todo => `
            <li class="todo-item" data-id="${todo.id}">
                <span class="todo-content ${todo.is_completed ? 'todo-completed' : ''}">
                    <span class="todo-id">#${todo.id}</span>
                    ${todo.is_completed 
                        ? '<i class="fa-solid fa-circle-check" style="color: #28a745;"></i>'
                        : '<i class="fa-regular fa-circle" style="color: #999;"></i>'
                    }
                    ${escapeHtml(todo.content)}
                </span>
                <div class="actions">
                    ${todo.canManage ? `
                        <button onclick="toggleTodo('${todo.id}')" class="btn btn-small btn-success">
                            ${todo.is_completed 
                                ? '<i class="fa-solid fa-rotate-left"></i> Undo'
                                : '<i class="fa-solid fa-check"></i> Done'
                            }
                        </button>
                        <button onclick="deleteTodo('${todo.id}')" class="btn btn-small btn-danger">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </li>
        `).join('');
    } catch (error) {
        console.error('Failed to load todos:', error);
    }
}

// Toggle todo completion
async function toggleTodo(id) {
    try {
        const response = await fetch(`/api/todos/${id}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        if (data.success) {
            await loadTodos();
        } else {
            showMessage('error', data.error || 'Failed to update todo');
        }
    } catch (error) {
        showMessage('error', 'An error occurred');
    }
}

// Delete todo
async function deleteTodo(id) {
    const confirmed = await showConfirm('Are you sure you want to delete this todo?');
    if (!confirmed) return;

    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();
        
        if (data.success) {
            await loadTodos();
            showMessage('success', 'Todo deleted successfully');
        } else {
            showMessage('error', data.error || 'Failed to delete todo');
        }
    } catch (error) {
        showMessage('error', 'An error occurred');
    }
}

// Admin form handler
const adminForm = document.getElementById('adminForm');
if (adminForm) {
    adminForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(adminForm);
        
        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.get('username'),
                    password: formData.get('password'),
                    role: formData.get('role'),
                    expireMinutes: formData.get('expireMinutes') || null
                })
            });

            const data = await response.json();
            
            if (data.success) {
                adminForm.reset();
                showMessage('success', 'User created successfully');
            } else {
                showMessage('error', data.error || 'Failed to create user');
            }
        } catch (error) {
            showMessage('error', 'An error occurred');
        }
    });
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize: Load todos on page load if on dashboard
if (document.getElementById('todoList')) {
    loadTodos();
}
