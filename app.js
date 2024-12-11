// Initial categories
const defaultCategories = [
    'Graphic Design',
    'Editorial Design',
    'UI/UX Design',
    'Web Design',
    'Illustration',
    'Motion Design'
];

// Initial state
let state = {
    tasks: [],
    categories: [...defaultCategories],
    filter: ''
};

// Load state from localStorage
function loadState() {
    const savedState = localStorage.getItem('kanbanState');
    if (savedState) {
        state = JSON.parse(savedState);
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('kanbanState', JSON.stringify(state));
}

// Initialize the app
function init() {
    loadState();
    setupEventListeners();
    renderTasks();
    renderCategories();
    updateDashboard();
    initializeDragAndDrop();
}

// Setup Event Listeners
function setupEventListeners() {
    // Task Modal
    const addTaskBtn = document.getElementById('addTaskBtn');
    const taskModal = document.getElementById('taskModal');
    const closeTaskModal = document.getElementById('closeTaskModal');
    const taskForm = document.getElementById('taskForm');

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            taskModal.style.display = 'block';
            updateCategoryDropdown(); // Update categories when opening modal
        });
    }

    if (closeTaskModal) {
        closeTaskModal.addEventListener('click', () => {
            taskModal.style.display = 'none';
            taskForm.reset();
        });
    }

    if (taskForm) {
        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const imageFile = document.getElementById('taskImage').files[0];
            
            const createTask = (imageUrl = null) => {
                const task = {
                    id: Date.now().toString(),
                    title: document.getElementById('taskTitle').value,
                    description: document.getElementById('taskDescription').value,
                    category: document.getElementById('taskCategory').value,
                    priority: document.getElementById('taskPriority').checked,
                    status: 'todo',
                    imageUrl
                };
                addTask(task);
                taskModal.style.display = 'none';
                taskForm.reset();
            };

            if (imageFile) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    createTask(event.target.result);
                };
                reader.readAsDataURL(imageFile);
            } else {
                createTask();
            }
        });
    }

    // Category Modal
    const newCategoryBtn = document.getElementById('newCategoryBtn');
    const categoryModal = document.getElementById('categoryModal');
    const closeCategoryModal = document.getElementById('closeCategoryModal');
    const categoryForm = document.getElementById('categoryForm');

    if (newCategoryBtn) {
        newCategoryBtn.addEventListener('click', () => {
            categoryModal.style.display = 'block';
        });
    }

    if (closeCategoryModal) {
        closeCategoryModal.addEventListener('click', () => {
            categoryModal.style.display = 'none';
            categoryForm.reset();
        });
    }

    if (categoryForm) {
        categoryForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const categoryName = document.getElementById('categoryName').value;
            addNewCategory(categoryName);
            categoryModal.style.display = 'none';
            categoryForm.reset();
        });
    }

    // Category Filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('input', (e) => {
            filterCategories(e.target.value);
        });
    }
}

// Filter categories
function filterCategories(query) {
    state.filter = query.toLowerCase();
    renderCategories();
}

// Render categories
function renderCategories() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    categoryList.innerHTML = '';
    const filteredCategories = state.categories.filter(category => 
        category.toLowerCase().includes(state.filter)
    );

    filteredCategories.forEach(category => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${category}</span>
            <button class="btn secondary small" onclick="deleteCategory('${category}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        categoryList.appendChild(li);
    });

    // Update category dropdown
    updateCategoryDropdown();
}

// Category management
function addNewCategory(categoryName) {
    if (!categoryName.trim()) return;
    
    // Check if category already exists
    if (state.categories.includes(categoryName)) {
        alert('Esta categoria já existe!');
        return;
    }
    
    state.categories.push(categoryName);
    saveState();
    renderCategories();
}

function deleteCategory(category) {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
        state.categories = state.categories.filter(c => c !== category);
        saveState();
        renderCategories();
    }
}

// Update category dropdown
function updateCategoryDropdown() {
    const categorySelect = document.getElementById('taskCategory');
    if (!categorySelect) return;

    categorySelect.innerHTML = '';
    state.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Task management
function addTask(task) {
    state.tasks.push(task);
    saveState();
    renderTasks();
    updateDashboard();
    showNotification('Tarefa criada com sucesso!');
}

function deleteTask(taskId) {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
        state.tasks = state.tasks.filter(task => task.id !== taskId);
        saveState();
        renderTasks();
        updateDashboard();
        showNotification('Tarefa excluída com sucesso!');
    }
}

function editTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        const taskModal = document.getElementById('taskModal');
        document.getElementById('taskTitle').value = task.title;
        document.getElementById('taskDescription').value = task.description || '';
        document.getElementById('taskCategory').value = task.category;
        document.getElementById('taskPriority').checked = task.priority;
        
        taskModal.style.display = 'block';
        
        const form = document.getElementById('taskForm');
        const originalSubmit = form.onsubmit;
        
        form.onsubmit = (e) => {
            e.preventDefault();
            const imageFile = document.getElementById('taskImage').files[0];
            
            const updateTaskData = (imageUrl = task.imageUrl) => {
                task.title = document.getElementById('taskTitle').value;
                task.description = document.getElementById('taskDescription').value;
                task.category = document.getElementById('taskCategory').value;
                task.priority = document.getElementById('taskPriority').checked;
                task.imageUrl = imageUrl;
                
                saveState();
                renderTasks();
                updateDashboard();
                
                taskModal.style.display = 'none';
                form.reset();
                form.onsubmit = originalSubmit;
                showNotification('Tarefa atualizada com sucesso!');
            };

            if (imageFile) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    updateTaskData(event.target.result);
                };
                reader.readAsDataURL(imageFile);
            } else {
                updateTaskData();
            }
        };
    }
}

// Render tasks
function renderTasks() {
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');

    if (!todoList || !inProgressList || !doneList) return;

    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    // Sort tasks by status and render them in appropriate columns
    state.tasks.forEach(task => {
        const taskElement = createTaskElement(task);
        switch (task.status) {
            case 'todo':
                todoList.appendChild(taskElement);
                break;
            case 'doing':
                inProgressList.appendChild(taskElement);
                break;
            case 'done':
                doneList.appendChild(taskElement);
                break;
        }
    });
}

// Create task element
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-card';
    taskElement.setAttribute('data-task-id', task.id);
    taskElement.draggable = true;

    const taskStatus = task.status || 'todo';
    const statusClass = `status-${taskStatus}`;

    taskElement.innerHTML = `
        <div class="task-header ${statusClass}">
            <div class="task-category" style="background-color: ${task.categoryColor || '#ddd'}">${task.category}</div>
            <div class="task-actions">
                <select class="status-select" onchange="updateTaskStatus('${task.id}', this.value)">
                    <option value="todo" ${taskStatus === 'todo' ? 'selected' : ''}>Por Fazer</option>
                    <option value="doing" ${taskStatus === 'doing' ? 'selected' : ''}>Em Progresso</option>
                    <option value="done" ${taskStatus === 'done' ? 'selected' : ''}>Concluído</option>
                </select>
                <button class="btn-icon edit-task" onclick="editTask('${task.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete-task" onclick="deleteTask('${task.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="task-content">
            <h3>${task.title}</h3>
            <p>${task.description}</p>
            ${task.imageUrl ? `<img src="${task.imageUrl}" alt="${task.title}" class="task-image">` : ''}
        </div>
        <div class="task-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${getProgressWidth(taskStatus)}"></div>
            </div>
            <span class="progress-text">${getProgressText(taskStatus)}</span>
        </div>
    `;

    // Add drag and drop event listeners
    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);

    return taskElement;
}

function getProgressWidth(status) {
    switch(status) {
        case 'todo': return '0%';
        case 'doing': return '50%';
        case 'done': return '100%';
        default: return '0%';
    }
}

function getProgressText(status) {
    switch(status) {
        case 'todo': return '0% Completo';
        case 'doing': return '50% Em Progresso';
        case 'done': return '100% Concluído';
        default: return '0% Completo';
    }
}

function updateTaskStatus(taskId, newStatus) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        task.status = newStatus;
        
        // Save state and re-render tasks
        saveState();
        renderTasks();
        updateDashboard();
        
        // Show notification
        showNotification(`Tarefa movida para ${STATUS_TRANSLATIONS[newStatus]}`);
    }
}

// Update dashboard
function updateDashboard() {
    const todoCount = document.getElementById('todoCount');
    const inProgressCount = document.getElementById('inProgressCount');
    const doneCount = document.getElementById('doneCount');

    if (!todoCount || !inProgressCount || !doneCount) return;

    todoCount.textContent = state.tasks.filter(task => task.status === 'todo').length;
    inProgressCount.textContent = state.tasks.filter(task => task.status === 'doing').length;
    doneCount.textContent = state.tasks.filter(task => task.status === 'done').length;
}

// Drag and Drop
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-task-id'));
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    const column = e.target.closest('.column');
    if (column) {
        column.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    const column = e.target.closest('.column');
    if (column) {
        column.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    const column = e.target.closest('.column');
    if (!column) return;

    column.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData('text/plain');
    const newStatus = column.getAttribute('data-state');
    
    // Convert column status to task status
    let taskStatus = newStatus;
    if (newStatus === 'inProgress') {
        taskStatus = 'doing';
    }

    updateTaskStatus(taskId, taskStatus);
}

// Initialize drag and drop
function initializeDragAndDrop() {
    const columns = document.querySelectorAll('.column');
    columns.forEach(column => {
        column.addEventListener('dragover', handleDragOver);
        column.addEventListener('dragleave', handleDragLeave);
        column.addEventListener('drop', handleDrop);
    });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Error messages
const ERROR_MESSAGES = {
    TASK_REQUIRED: 'Por favor, preencha todos os campos obrigatórios.',
    TASK_SAVE: 'Erro ao guardar a tarefa. Por favor, tente novamente.',
    CATEGORY_REQUIRED: 'Por favor, insira um nome para a categoria.',
    CATEGORY_SAVE: 'Erro ao guardar a categoria. Por favor, tente novamente.',
    IMAGE_LOAD: 'Erro ao carregar a imagem. Por favor, tente novamente.',
    INVALID_FILE: 'Por favor, selecione uma imagem válida.',
    FILE_SIZE: 'A imagem é muito grande. O tamanho máximo é 5MB.'
};

// Success messages
const SUCCESS_MESSAGES = {
    TASK_CREATED: 'Tarefa criada com sucesso!',
    TASK_UPDATED: 'Tarefa atualizada com sucesso!',
    TASK_DELETED: 'Tarefa excluída com sucesso!',
    CATEGORY_CREATED: 'Categoria criada com sucesso!',
    CATEGORY_UPDATED: 'Categoria atualizada com sucesso!',
    CATEGORY_DELETED: 'Categoria excluída com sucesso!'
};

// Status translations
const STATUS_TRANSLATIONS = {
    'todo': 'Por Fazer',
    'doing': 'Em Progresso',
    'done': 'Concluído'
};

// Initialize the app
document.addEventListener('DOMContentLoaded', init);
