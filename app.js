// DOM Elements
const kanbanBoard = document.getElementById('kanbanBoard');
const taskModal = document.getElementById('taskModal');
const editTaskModal = document.getElementById('editTaskModal');
const categoryModal = document.getElementById('categoryModal');
const taskForm = document.getElementById('taskForm');
const editTaskForm = document.getElementById('editTaskForm');
const categoryForm = document.getElementById('categoryForm');
const categoryList = document.getElementById('categoryList');
const categoryFilter = document.getElementById('categoryFilter');
const kanbanViewBtn = document.getElementById('kanbanViewBtn');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const kanbanView = document.getElementById('kanbanView');
const calendarView = document.getElementById('calendarView');

// Buttons
const addTaskBtn = document.getElementById('addTaskBtn');
const newCategoryBtn = document.getElementById('newCategoryBtn');
const closeTaskModal = document.getElementById('closeTaskModal');
const closeEditTaskModal = document.getElementById('closeEditTaskModal');
const closeCategoryModal = document.getElementById('closeCategoryModal');

// Initial Categories
const defaultCategories = [
    'Design Gráfico',
    'Design Editorial',
    'UI/UX Design',
    'Webdesign',
    'Ilustração',
    'Fotografia',
    'Motion Design'
];

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;
let currentEditingTaskId = null;

// Calendar
let calendar;

// Initialize categories if empty
if (!localStorage.getItem('categories')) {
    localStorage.setItem('categories', JSON.stringify(defaultCategories));
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    categories = JSON.parse(localStorage.getItem('categories')) || defaultCategories;
    renderTasks();
    renderCategories();
    updateTaskCounts();
    populateCategoryDropdowns();
    setupDragAndDrop();
});

addTaskBtn.addEventListener('click', () => taskModal.style.display = 'block');
newCategoryBtn.addEventListener('click', () => categoryModal.style.display = 'block');
closeTaskModal.addEventListener('click', () => taskModal.style.display = 'none');
closeEditTaskModal.addEventListener('click', () => {
    editTaskModal.style.display = 'none';
    editTaskForm.reset();
    currentEditingTaskId = null;
});
closeCategoryModal.addEventListener('click', () => categoryModal.style.display = 'none');

taskForm.addEventListener('submit', handleTaskSubmit);
editTaskForm.addEventListener('submit', handleEditTaskSubmit);
categoryForm.addEventListener('submit', handleCategorySubmit);
categoryFilter.addEventListener('change', filterCategories);

window.addEventListener('click', (e) => {
    if (e.target === taskModal) taskModal.style.display = 'none';
    if (e.target === editTaskModal) editTaskModal.style.display = 'none';
    if (e.target === categoryModal) categoryModal.style.display = 'none';
});

// Event Listeners for View Toggle
kanbanViewBtn.addEventListener('click', () => {
    kanbanView.classList.add('active');
    calendarView.classList.remove('active');
    kanbanViewBtn.classList.add('active');
    calendarViewBtn.classList.remove('active');
});

calendarViewBtn.addEventListener('click', () => {
    calendarView.classList.add('active');
    kanbanView.classList.remove('active');
    calendarViewBtn.classList.add('active');
    kanbanViewBtn.classList.remove('active');
    if (!calendar) {
        initializeCalendar();
    }
});

// Task Functions
function handleTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const category = document.getElementById('taskCategory').value;
    const priority = document.getElementById('taskPriority').checked;
    const dueDate = document.getElementById('taskDueDate').value;
    const imageInput = document.getElementById('taskImage');
    
    const newTask = {
        id: Date.now(),
        title,
        description,
        category,
        priority,
        status: 'todo',
        dueDate,
        image: null
    };

    const createTask = () => {
        tasks.push(newTask);
        saveTasks();
        renderTasks();
        updateTaskCounts();
        if (calendar) {
            calendar.removeAllEvents();
            calendar.addEventSource(getCalendarEvents());
        }
        taskModal.style.display = 'none';
        taskForm.reset();
    };

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            newTask.image = event.target.result;
            createTask();
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        createTask();
    }
}

function handleEditTaskSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('editTaskTitle').value;
    const description = document.getElementById('editTaskDescription').value;
    const category = document.getElementById('editTaskCategory').value;
    const priority = document.getElementById('editTaskPriority').checked;
    const dueDate = document.getElementById('editTaskDueDate').value;
    const imageInput = document.getElementById('editTaskImage');

    const taskIndex = tasks.findIndex(task => task.id === currentEditingTaskId);
    if (taskIndex === -1) return;

    const updatedTask = {
        ...tasks[taskIndex],
        title,
        description,
        category,
        priority,
        dueDate
    };

    const updateTask = () => {
        tasks[taskIndex] = updatedTask;
        saveTasks();
        renderTasks();
        if (calendar) {
            calendar.removeAllEvents();
            calendar.addEventSource(getCalendarEvents());
        }
        editTaskModal.style.display = 'none';
        editTaskForm.reset();
        currentEditingTaskId = null;
    };

    if (imageInput.files && imageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            updatedTask.image = event.target.result;
            updateTask();
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        // Keep the existing image if no new image is selected
        updatedTask.image = tasks[taskIndex].image;
        updateTask();
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentEditingTaskId = taskId;
    
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editTaskPriority').checked = task.priority;
    document.getElementById('editTaskDueDate').value = task.dueDate;

    const imagePreview = document.getElementById('editImagePreview');
    if (task.image) {
        imagePreview.innerHTML = `<img src="${task.image}" alt="Task image">`;
        imagePreview.classList.add('has-image');
    } else {
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('has-image');
    }

    editTaskModal.style.display = 'block';
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
    renderTasks();
    updateTaskCounts();
    if (calendar) {
        calendar.removeAllEvents();
        calendar.addEventSource(getCalendarEvents());
    }
}

function moveTask(taskId, newStatus) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    tasks[taskIndex].status = newStatus;
    saveTasks();
    
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (taskElement) {
        taskElement.dataset.status = newStatus; 
        const progress = getProgressByStatus(newStatus);
        const progressText = newStatus === 'inProgress' ? 'Em Progresso' : `${progress}% Concluído`;
        
        // Update progress bar
        const progressFill = taskElement.querySelector('.progress-fill');
        const progressTextElement = taskElement.querySelector('.progress-text');
        if (progressFill && progressTextElement) {
            progressFill.style.width = `${progress}%`;
            progressTextElement.textContent = progressText;
        }
    }
    
    renderTasks();
    updateTaskCounts();
    if (calendar) {
        calendar.removeAllEvents();
        calendar.addEventSource(getCalendarEvents());
    }
}

function renderTasks() {
    const todoList = document.getElementById('todoList');
    const inProgressList = document.getElementById('inProgressList');
    const doneList = document.getElementById('doneList');

    todoList.innerHTML = '';
    inProgressList.innerHTML = '';
    doneList.innerHTML = '';

    const currentFilter = categoryFilter.value;
    const filteredTasks = currentFilter === 'all' 
        ? tasks 
        : tasks.filter(task => task.category === currentFilter);

    filteredTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        
        switch(task.status) {
            case 'todo':
                todoList.appendChild(taskElement);
                break;
            case 'inProgress':
                inProgressList.appendChild(taskElement);
                break;
            case 'done':
                doneList.appendChild(taskElement);
                break;
        }
    });

    updateTaskCounts();
    setupDragAndDrop();
}

function getProgressByStatus(status) {
    switch(status) {
        case 'todo': return 0;
        case 'inProgress': return 50;
        case 'done': return 100;
        default: return 0;
    }
}

function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `task-card ${task.priority ? 'priority' : ''}`;
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;
    taskElement.dataset.status = task.status; 
    
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const now = new Date();
    let dueDateClass = '';
    
    if (task.status === 'done') {
        dueDateClass = 'completed';
    } else if (dueDate && dueDate < now) {
        dueDateClass = 'overdue';
    } else if (dueDate && dueDate - now < 24 * 60 * 60 * 1000) { // Less than 24 hours
        dueDateClass = 'upcoming';
    }

    const progress = getProgressByStatus(task.status);
    const progressText = task.status === 'inProgress' ? 'Em Progresso' : `${progress}% Concluído`;
    
    const taskContent = `
        <div class="task-header">
            <h4>${task.title}</h4>
            <div class="task-actions">
                <select class="status-select" onchange="moveTask(${task.id}, this.value)">
                    <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>Por Fazer</option>
                    <option value="inProgress" ${task.status === 'inProgress' ? 'selected' : ''}>Em Progresso</option>
                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>Concluído</option>
                </select>
                <button class="icon-btn edit-btn" onclick="startTaskEdit(${task.id})" title="Editar">
                    <i class="fas fa-pencil-alt"></i>
                </button>
                <button class="icon-btn delete-btn" onclick="deleteTask(${task.id})" title="Excluir">
                    <i class="fas fa-xmark"></i>
                </button>
            </div>
        </div>
        <p>${task.description}</p>
        ${task.image ? `<div class="task-image-container"><img src="${task.image}" alt="Task image" class="task-image"></div>` : ''}
        <div class="task-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <span class="progress-text">${progressText}</span>
        </div>
        <div class="task-footer">
            <span class="category-tag">${task.category}</span>
            ${task.priority ? '<span class="priority-tag"><i class="fas fa-star"></i> Prioritário</span>' : ''}
            ${task.dueDate ? `
                <div class="due-date ${dueDateClass}">
                    <i class="fas fa-clock"></i>
                    ${formatDueDate(task.dueDate)}
                </div>
            ` : ''}
        </div>
    `;
    
    taskElement.innerHTML = taskContent;
    return taskElement;
}

function formatDueDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('pt-BR', options);
}

function startTaskEdit(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    currentEditingTaskId = taskId;
    
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editTaskPriority').checked = task.priority;
    document.getElementById('editTaskDueDate').value = task.dueDate;
    
    const imagePreview = document.getElementById('editImagePreview');
    if (task.image) {
        imagePreview.innerHTML = `<img src="${task.image}" alt="Task image">`;
        imagePreview.classList.add('has-image');
    } else {
        imagePreview.innerHTML = '';
        imagePreview.classList.remove('has-image');
    }
    
    editTaskModal.style.display = 'block';
}

function saveTaskEdit(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;
    
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) return;

    const title = taskElement.querySelector('.edit-title').value;
    const description = taskElement.querySelector('.edit-description').value;
    const category = taskElement.querySelector('.edit-category').value;
    const priority = taskElement.querySelector('.priority-checkbox input').checked;
    const dueDate = taskElement.querySelector('.edit-due-date').value;

    tasks[taskIndex] = {
        ...tasks[taskIndex],
        title,
        description,
        category,
        priority,
        dueDate
    };

    saveTasks();
    taskElement.dataset.isEditing = 'false';
    renderTasks();
}

function cancelTaskEdit(taskId) {
    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
    if (!taskElement) return;
    
    taskElement.dataset.isEditing = 'false';
    renderTasks();
}

// Category Functions
function handleCategorySubmit(e) {
    e.preventDefault();
    
    const categoryName = document.getElementById('categoryName').value;
    if (!categories.includes(categoryName)) {
        categories.push(categoryName);
        saveCategories();
        renderCategories();
        populateCategoryDropdowns();
    }

    categoryModal.style.display = 'none';
    categoryForm.reset();
}

function renderCategories() {
    categoryList.innerHTML = '';
    categories.forEach(category => {
        const li = document.createElement('li');
        const isDefaultCategory = defaultCategories.includes(category);
        li.className = `category-item ${isDefaultCategory ? 'default-category' : ''}`;
        const taskCount = tasks.filter(task => task.category === category).length;
        
        li.innerHTML = `
            <div class="category-name">
                <i class="fas fa-folder"></i>
                ${category}
            </div>
            <div class="category-actions">
                <span class="category-count">${taskCount}</span>
                ${!isDefaultCategory ? `
                    <button class="delete-category" onclick="deleteCategory('${category}')" title="Excluir categoria">
                        <i class="fas fa-xmark"></i>
                    </button>
                ` : ''}
            </div>
        `;
        
        categoryList.appendChild(li);
    });

    // Update dropdowns
    populateCategoryDropdowns();
}

function deleteCategory(categoryName) {
    if (confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
        // Find tasks using this category
        const tasksUsingCategory = tasks.filter(task => task.category === categoryName);
        
        if (tasksUsingCategory.length > 0) {
            const moveToDefault = confirm(
                `Existem ${tasksUsingCategory.length} tarefa(s) usando esta categoria.\n` +
                'Deseja mover estas tarefas para a categoria "Design Gráfico"?'
            );
            
            if (moveToDefault) {
                // Move tasks to default category
                tasks = tasks.map(task => 
                    task.category === categoryName 
                        ? {...task, category: 'Design Gráfico'}
                        : task
                );
                saveTasks();
            } else {
                return; // Cancel deletion if user doesn't want to move tasks
            }
        }
        
        // Remove the category
        categories = categories.filter(cat => cat !== categoryName);
        saveCategories();
        renderCategories();
        populateCategoryDropdowns();
        renderTasks();
    }
}

function filterCategories() {
    const selectedCategory = categoryFilter.value;
    const taskCards = document.querySelectorAll('.task-card');

    taskCards.forEach(card => {
        const taskId = parseInt(card.dataset.taskId);
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) return;

        if (selectedCategory === 'all' || task.category === selectedCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    // Update column headers to show filtered counts
    updateTaskCounts();
}

function updateTaskCounts() {
    const currentFilter = categoryFilter.value;
    const filteredTasks = currentFilter === 'all' 
        ? tasks 
        : tasks.filter(task => task.category === currentFilter);

    document.getElementById('todoCount').textContent = 
        filteredTasks.filter(task => task.status === 'todo').length;
    document.getElementById('inProgressCount').textContent = 
        filteredTasks.filter(task => task.status === 'inProgress').length;
    document.getElementById('doneCount').textContent = 
        filteredTasks.filter(task => task.status === 'done').length;
}

function populateCategoryDropdowns() {
    // Get all dropdowns
    const dropdowns = [
        document.getElementById('taskCategory'),
        document.getElementById('editTaskCategory'),
        document.getElementById('categoryFilter')
    ];

    // Ensure all dropdowns exist
    if (!dropdowns.every(dropdown => dropdown)) {
        console.error('Some category dropdowns are missing');
        return;
    }

    // Clear and populate each dropdown
    dropdowns.forEach(dropdown => {
        dropdown.innerHTML = dropdown === document.getElementById('categoryFilter')
            ? '<option value="all">Todas as Categorias</option>'
            : '';

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            dropdown.appendChild(option);
        });
    });

    console.log('Categories populated:', categories); // Debug log
}

// Drag and Drop
function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.task-card');
    const dropZones = document.querySelectorAll('.task-list');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
        });
    });

    dropZones.forEach(zone => {
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            const draggable = document.querySelector('.dragging');
            zone.appendChild(draggable);
        });

        zone.addEventListener('drop', e => {
            e.preventDefault();
            const taskId = parseInt(document.querySelector('.dragging').dataset.taskId);
            const newStatus = zone.parentElement.dataset.state;
            moveTask(taskId, newStatus);
        });
    });
}

// Calendar
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
        },
        events: getCalendarEvents(),
        eventClick: function(info) {
            const taskId = parseInt(info.event.id);
            editTask(taskId);
        },
        eventDidMount: function(info) {
            const task = tasks.find(t => t.id === parseInt(info.event.id));
            if (!task) return;

            if (task.priority) {
                info.el.classList.add('priority');
            }
            
            const now = new Date();
            const dueDate = new Date(task.dueDate);
            
            if (task.status === 'done') {
                info.el.classList.add('completed');
            } else if (dueDate < now) {
                info.el.classList.add('overdue');
            }
        }
    });
    
    calendar.render();
}

function getCalendarEvents() {
    return tasks.map(task => ({
        id: task.id.toString(),
        title: task.title,
        start: task.dueDate,
        backgroundColor: getEventColor(task),
        borderColor: getEventColor(task),
        extendedProps: {
            category: task.category,
            status: task.status,
            priority: task.priority
        }
    }));
}

function getEventColor(task) {
    if (task.status === 'done') {
        return '#34C759';
    }
    
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    
    if (dueDate < now && task.status !== 'done') {
        return '#FF3B30';
    }
    
    switch(task.status) {
        case 'todo':
            return task.priority ? '#FF9500' : '#8E8E93';
        case 'inProgress':
            return '#007AFF';
        default:
            return '#8E8E93';
    }
}

// Utility Functions
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

// Add image preview event listeners
document.getElementById('taskImage').addEventListener('change', function(e) {
    const preview = document.getElementById('imagePreview');
    handleImagePreview(e.target.files[0], preview);
});

document.getElementById('editTaskImage').addEventListener('change', function(e) {
    const preview = document.getElementById('editImagePreview');
    handleImagePreview(e.target.files[0], preview);
});

function handleImagePreview(file, previewElement) {
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            previewElement.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    } else {
        previewElement.innerHTML = '';
        previewElement.classList.remove('has-image');
    }
}
