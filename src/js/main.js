// Main Application Logic
// 
// Core module that orchestrates the entire kanban board application.
// Handles task creation, editing, deletion, and rendering. Manages modal dialogs
// for task details and editing. Coordinates with storage, drag-drop, and timer modules.
// Formats timestamps and due dates. Initializes the app and sets up event listeners.

import { loadNotes, saveNotes, isStorageAvailable } from './storage.js';
import { initDragAndDrop } from './dragDrop.js';
import { TimerManager, formatElapsedTime, formatCompletedTime } from './timer.js';

let notes = []; // Array to store all tasks
let timerManager = new TimerManager(); // Manages time tracking for in-progress tasks

// Initialize the application
export function init() {
  notes = loadNotes();
  renderNotes(notes);
  updateEmptyState();
  
  // Start timers for tasks already in progress
  initializeTimers();
  timerManager.startUpdateLoop(updateTimerDisplays);
  
  // Show warning if localStorage is not available
  if (!isStorageAvailable()) {
    showStorageWarning();
  }
  
  // Attach event listeners
  document.getElementById('addNoteForm').addEventListener('submit', handleFormSubmit);
  document.querySelector('.board').addEventListener('click', handleButtonClick);
  
  // Listen for updates from drag and drop
  window.addEventListener('notesUpdated', () => {
    notes = loadNotes();
    renderNotes(notes);
    initializeTimers();
  });
}
// Handle form submission for adding new tasks
function handleFormSubmit(event) {
  event.preventDefault();
  
  const noteInput = document.getElementById('noteText');
  const prioritySelect = document.getElementById('prioritySelect');
  const columnSelect = document.getElementById('columnSelect');
  
  const text = noteInput.value.trim();
  const priority = prioritySelect.value;
  const column = columnSelect.value;
  
  // Validate input
  if (text.length === 0) {
    noteInput.classList.add('invalidInput');
    setTimeout(() => noteInput.classList.remove('invalidInput'), 500);
    return;
  }
  
  // Open modal to add description and due date
  openTaskModal(null, text, column, priority, null);
  noteInput.value = '';
  prioritySelect.value = 'medium';
}
// Create and add a new task
export function addNote(text, column, priority = 'medium', description = '', dueDate = null) {
  const newNote = {
    id: Date.now(), // Unique ID based on timestamp
    text: text,
    description: description,
    column: column,
    priority: priority,
    dueDate: dueDate,
    createdAt: Date.now(),
    lastEditedAt: null,
    startedAt: column === 'inprogress' ? Date.now() : null, // Track when task starts
    completedAt: null,
    timeSpent: 0 // Accumulated time in milliseconds
  };
  
  notes.push(newNote);
  
  // Start timer if adding directly to In Progress
  if (column === 'inprogress') {
    timerManager.startTimer(newNote.id, newNote.startedAt);
  }
  
  saveNotes(notes);
  renderNotes(notes);
  updateEmptyState();
}
// Handle clicks on task cards (delete, edit, or view details)
function handleButtonClick(event) {
  // Handle delete button click
  const deleteBtn = event.target.closest('.deleteBtn');
  if (deleteBtn) {
    event.stopPropagation();
    const noteElement = deleteBtn.closest('.stickyNote');
    const noteId = parseInt(noteElement.getAttribute('data-note-id'));
    deleteNote(noteId);
    return;
  }
  
  // Handle edit button click
  const editBtn = event.target.closest('.editBtn');
  if (editBtn) {
    event.stopPropagation();
    const noteElement = editBtn.closest('.stickyNote');
    const noteId = parseInt(noteElement.getAttribute('data-note-id'));
    const note = notes.find(n => n.id === noteId);
    if (note) {
      openTaskModal(note);
    }
    return;
  }
  
  // Handle click on card itself to view details
  const noteCard = event.target.closest('.stickyNote');
  if (noteCard && !event.target.closest('.editBtn, .deleteBtn, .priorityBadge')) {
    const noteId = parseInt(noteCard.getAttribute('data-note-id'));
    const note = notes.find(n => n.id === noteId);
    if (note) {
      openTaskDetailsModal(note);
    }
    return;
  }
}
// Delete a task by ID
export function deleteNote(noteId) {
  timerManager.stopTimer(noteId); // Stop timer if running
  notes = notes.filter(note => note.id !== noteId);
  saveNotes(notes);
  renderNotes(notes);
  updateEmptyState();
}
// Open modal for adding or editing a task
function openTaskModal(note = null, taskText = '', taskColumn = 'todo', taskPriority = 'medium', taskDueDate = null) {
  // Format due date for datetime-local input
  const dueDateValue = note?.dueDate ? formatDateTimeLocal(note.dueDate) : (taskDueDate ? formatDateTimeLocal(taskDueDate) : '');
  // Create modal element with form
  const modal = document.createElement('div');
  modal.className = 'taskModal';
  modal.innerHTML = `
    <div class="modalContent">
      <div class="modalHeader">
        <h2>${note ? 'Edit Task' : 'Add Task Details'}</h2>
        <button class="modalClose">&times;</button>
      </div>
      <div class="modalBody">
        <div class="formGroup">
          <label for="modalTaskName">Task Name *</label>
          <input type="text" id="modalTaskName" value="${note ? note.text : taskText}" required>
        </div>
        <div class="formGroup">
          <label for="modalTaskDescription">Description</label>
          <textarea id="modalTaskDescription" rows="4" placeholder="Add task description...">${note ? (note.description || '') : ''}</textarea>
        </div>
        <div class="formGroup">
          <label for="modalTaskPriority">Priority</label>
          <select id="modalTaskPriority">
            <option value="high" ${(note ? note.priority : taskPriority) === 'high' ? 'selected' : ''}>High</option>
            <option value="medium" ${(note ? note.priority : taskPriority) === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="low" ${(note ? note.priority : taskPriority) === 'low' ? 'selected' : ''}>Low</option>
          </select>
        </div>
        <div class="formGroup dueDateGroup">
          <label for="modalTaskDueDate">
            <i class="fas fa-calendar-check"></i> Due Date & Time
          </label>
          <div class="dueDateInputWrapper">
            <input type="datetime-local" id="modalTaskDueDate" value="${dueDateValue}" style="display: none;">
            <input type="text" id="dueDateDisplay" class="dueDateDisplay" placeholder="Due Date and Time not set" readonly>
            <button type="button" class="btnSelectDateTime" id="btnSelectDateTime">
              <i class="fas fa-calendar-alt"></i> Select Due Date & Time
            </button>
            <div class="dateTimePickerPopup" id="dateTimePickerPopup" style="display: none;">
              <div class="dateTimePicker">
                <div class="pickerLabel">Date:</div>
                <input type="date" id="datePickerInput" class="dateInput">
                <div class="pickerLabel">Time:</div>
                <input type="time" id="timePickerInput" class="timeInput">
                <button type="button" class="btnDonePicker" id="btnDonePicker">
                  <i class="fas fa-check"></i> Done
                </button>
              </div>
            </div>
            <span class="dueDateHint">
              <i class="fas fa-info-circle"></i>
              Set when this task needs to be completed
            </span>
          </div>
          ${note?.dueDate ? '<button type="button" class="btnClearDueDate" title="Clear due date"><i class="fas fa-times-circle"></i> Clear Due Date</button>' : ''}
        </div>
        ${note && note.lastEditedAt ? `
          <div class="lastEdited">
            Last edited: ${formatTimestamp(note.lastEditedAt)}
          </div>
        ` : ''}
      </div>
      <div class="modalFooter">
        <button class="btnCancel">Cancel</button>
        <button class="btnSave">${note ? 'Save Changes' : 'Add Task'}</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Initialize custom date/time picker
  initializeDateTimePicker(modal, dueDateValue);
  
  // Focus on task name input
  const taskNameInput = modal.querySelector('#modalTaskName');
  taskNameInput.focus();
  taskNameInput.select();
  // Get modal buttons
  const closeBtn = modal.querySelector('.modalClose');
  const cancelBtn = modal.querySelector('.btnCancel');
  const saveBtn = modal.querySelector('.btnSave');
  
  // Close modal function
  const closeModal = () => {
    modal.remove();
  };
  
  // Save task function
  const saveTask = () => {
    // Get form values
    const newText = taskNameInput.value.trim();
    const newDescription = modal.querySelector('#modalTaskDescription').value.trim();
    const newPriority = modal.querySelector('#modalTaskPriority').value;
    const dueDateInput = modal.querySelector('#modalTaskDueDate').value;
    const newDueDate = dueDateInput ? new Date(dueDateInput).getTime() : null;
    
    // Validate task name
    if (newText.length === 0) {
      taskNameInput.classList.add('invalidInput');
      setTimeout(() => taskNameInput.classList.remove('invalidInput'), 500);
      return;
    }
    
    if (note) {
      // Update existing note
      note.text = newText;
      note.description = newDescription;
      note.priority = newPriority;
      note.dueDate = newDueDate;
      note.lastEditedAt = Date.now();
      saveNotes(notes);
      renderNotes(notes);
    } else {
      // Create new note
      addNote(newText, taskColumn, newPriority, newDescription, newDueDate);
    }
    
    closeModal();
  };
  // Attach event listeners
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  saveBtn.addEventListener('click', saveTask);
  
  // Clear due date button
  const clearDueDateBtn = modal.querySelector('.btnClearDueDate');
  if (clearDueDateBtn) {
    clearDueDateBtn.addEventListener('click', () => {
      modal.querySelector('#modalTaskDueDate').value = '';
      const displayInput = modal.querySelector('#dueDateDisplay');
      displayInput.value = '';
      displayInput.classList.remove('hasValue');
      clearDueDateBtn.remove();
    });
  }
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  });
  
  // Save on Enter key in task name field
  taskNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTask();
    }
  });
}
// Create a task card DOM element
export function createNoteElement(note) {
  const noteDiv = document.createElement('div');
  noteDiv.className = `stickyNote column-${note.column}`;
  noteDiv.setAttribute('data-note-id', note.id);
  
  // Add priority badge
  if (note.priority) {
    const priorityBadge = createPriorityBadge(note.priority);
    noteDiv.appendChild(priorityBadge);
  }
  
  // Add edit button
  const editBtn = document.createElement('button');
  editBtn.className = 'editBtn';
  editBtn.innerHTML = '<i class="fas fa-edit"></i>';
  editBtn.title = 'Edit task';
  noteDiv.appendChild(editBtn);
  
  // Add delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'deleteBtn';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.title = 'Delete task';
  noteDiv.appendChild(deleteBtn);
  
  // Add task text
  const textP = document.createElement('p');
  textP.className = 'noteText';
  textP.textContent = note.text;
  
  // Add description indicator if description exists
  if (note.description && note.description.trim().length > 0) {
    const descIndicator = document.createElement('span');
    descIndicator.className = 'descriptionIndicator';
    descIndicator.innerHTML = '<i class="fas fa-align-left"></i>';
    descIndicator.title = 'Has description';
    textP.appendChild(descIndicator);
  }
  
  noteDiv.appendChild(textP);
  // Add due date display (except for Done column)
  if (note.dueDate && note.column !== 'done') {
    const dueDateInfo = formatDueDate(note.dueDate);
    const dueDateDiv = document.createElement('div');
    dueDateDiv.className = 'noteDueDate';
    if (dueDateInfo.isOverdue) {
      dueDateDiv.classList.add('overdue');
    } else if (dueDateInfo.isUrgent) {
      dueDateDiv.classList.add('urgent');
    }
    dueDateDiv.innerHTML = `<i class="fas fa-clock"></i> ${dueDateInfo.text}`;
    noteDiv.appendChild(dueDateDiv);
  }
  
  // Add creation timestamp for To Do column
  if (note.column === 'todo' && note.createdAt) {
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'noteTimestamp';
    timestampDiv.textContent = formatTimestamp(note.createdAt);
    noteDiv.appendChild(timestampDiv);
  }
  
  // Add live timer for In Progress column
  if (note.column === 'inprogress' && note.startedAt) {
    const timerDiv = document.createElement('div');
    timerDiv.className = 'timerDisplay';
    const elapsedTime = Date.now() - note.startedAt;
    timerDiv.textContent = `⏱ ${formatElapsedTime(elapsedTime)}`;
    noteDiv.appendChild(timerDiv);
  }
  
  // Add completion info for Done column
  if (note.column === 'done') {
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'completedTimeDisplay';
    timeDisplay.textContent = `Completed in ${formatCompletedTime(note.timeSpent)}`;
    noteDiv.appendChild(timeDisplay);
    
    if (note.completedAt) {
      const completedDateDiv = document.createElement('div');
      completedDateDiv.className = 'completedDate';
      completedDateDiv.textContent = `on ${formatTimestamp(note.completedAt)}`;
      noteDiv.appendChild(completedDateDiv);
    }
  }
  
  return noteDiv;
}
// Create a priority badge element
export function createPriorityBadge(priority) {
  const badge = document.createElement('span');
  badge.className = `priorityBadge priority-${priority}`;
  badge.setAttribute('data-priority', priority);
  
  // Set badge text based on priority level
  const labels = {
    high: 'HIGH',
    medium: 'MED',
    low: 'LOW'
  };
  badge.textContent = labels[priority] || 'MED';
  
  return badge;
}
// Format timestamp to readable date string
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  
  const dayOfWeek = date.toLocaleDateString('en-US', { 
    weekday: 'long'
  });
  
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  return `${dayOfWeek}, ${dateStr} at ${timeStr}`;
}
// Format timestamp for datetime-local input
export function formatDateTimeLocal(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
// Format due date with urgency indicators
export function formatDueDate(timestamp) {
  const dueDate = new Date(timestamp);
  const now = new Date();
  
  // Normalize to midnight for accurate day comparison
  const dueDateMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrowMidnight = new Date(todayMidnight);
  tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1);
  
  const diffMs = dueDate - now;
  const diffDays = Math.floor((dueDateMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  const dateStr = dueDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  // Check if overdue
  if (diffMs < 0) {
    return { text: `Overdue: ${dateStr}`, isOverdue: true, isUrgent: false };
  }
  
  // Check if due today
  if (diffDays === 0) {
    return { text: `Due today: ${dateStr}`, isOverdue: false, isUrgent: true };
  }
  
  // Check if due tomorrow
  if (diffDays === 1) {
    return { text: `Due tomorrow: ${dateStr}`, isOverdue: false, isUrgent: true };
  }
  
  // Check if within 48 hours
  if (diffHours < 48 && diffHours >= 0) {
    return { text: `Due in ${diffHours}h: ${dateStr}`, isOverdue: false, isUrgent: true };
  }
  
  return { text: `Due: ${dateStr}`, isOverdue: false, isUrgent: false };
}
// Render all tasks to the board
export function renderNotes(notesToRender) {
  const todoContainer = document.querySelector('#todo .notesContainer');
  const inprogressContainer = document.querySelector('#inprogress .notesContainer');
  const doneContainer = document.querySelector('#done .notesContainer');
  
  // Clear existing notes
  todoContainer.innerHTML = '';
  inprogressContainer.innerHTML = '';
  doneContainer.innerHTML = '';
  
  // Sort notes by priority
  const sortedNotes = sortNotesByPriority(notesToRender);
  
  // Add notes to their respective columns
  sortedNotes.forEach(note => {
    const noteElement = createNoteElement(note);
    
    if (note.column === 'todo') {
      todoContainer.appendChild(noteElement);
    } else if (note.column === 'inprogress') {
      inprogressContainer.appendChild(noteElement);
    } else if (note.column === 'done') {
      doneContainer.appendChild(noteElement);
    }
  });
  
  // Re-enable drag and drop
  initDragAndDrop();
}
// Sort notes by priority (high > medium > low)
function sortNotesByPriority(notesToSort) {
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  
  return [...notesToSort].sort((a, b) => {
    const priorityA = priorityOrder[a.priority] || 2;
    const priorityB = priorityOrder[b.priority] || 2;
    return priorityA - priorityB;
  });
}
// Show or hide empty state message
export function updateEmptyState() {
  const emptyState = document.getElementById('emptyState');
  if (notes.length > 0) {
    emptyState.style.display = 'none';
  } else {
    emptyState.style.display = 'block';
  }
}
// Display warning if localStorage is not available
function showStorageWarning() {
  const warning = document.createElement('div');
  warning.className = 'storageWarning';
  warning.innerHTML =
    '<p><i class="fas fa-exclamation-triangle"></i> Warning: Your notes will not be saved.</p>';
  const container = document.querySelector('.container');
  container.insertBefore(warning, container.firstChild);
}
// Getter for notes array
export function getNotes() {
  return notes;
}

// Setter for notes array
export function setNotes(newNotes) {
  notes = newNotes;
}

// Start timers for all tasks in progress
function initializeTimers() {
  notes.forEach(note => {
    if (note.column === 'inprogress' && note.startedAt) {
      timerManager.startTimer(note.id, note.startedAt);
    }
  });
}

// Update timer displays for all active timers
function updateTimerDisplays() {
  const activeTimerIds = timerManager.getActiveTimerIds();
  
  activeTimerIds.forEach(noteId => {
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (noteElement) {
      const timerDisplay = noteElement.querySelector('.timerDisplay');
      if (timerDisplay) {
        const elapsedTime = timerManager.getElapsedTime(noteId);
        timerDisplay.textContent = `⏱ ${formatElapsedTime(elapsedTime)}`;
      }
    }
  });
}

// Getter for timer manager
export function getTimerManager() {
  return timerManager;
}
// Initialize custom date/time picker in modal
function initializeDateTimePicker(modal, initialValue) {
  const btnSelectDateTime = modal.querySelector('#btnSelectDateTime');
  const dateTimePickerPopup = modal.querySelector('#dateTimePickerPopup');
  const datePickerInput = modal.querySelector('#datePickerInput');
  const timePickerInput = modal.querySelector('#timePickerInput');
  const btnDonePicker = modal.querySelector('#btnDonePicker');
  const hiddenInput = modal.querySelector('#modalTaskDueDate');
  const displayInput = modal.querySelector('#dueDateDisplay');
  const modalBody = modal.querySelector('.modalBody');
  
  // Set initial values if provided
  if (initialValue) {
    datePickerInput.value = initialValue.split('T')[0];
    timePickerInput.value = initialValue.split('T')[1];
    const date = new Date(initialValue);
    displayInput.value = formatDueDateDisplay(date);
    displayInput.classList.add('hasValue');
  }
  // Toggle picker visibility
  btnSelectDateTime.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = dateTimePickerPopup.style.display === 'block';
    
    if (isVisible) {
      dateTimePickerPopup.style.display = 'none';
      dateTimePickerPopup.classList.remove('active');
    } else {
      // Set current date/time if empty
      if (!datePickerInput.value) {
        const now = new Date();
        datePickerInput.value = formatDateTimeLocal(now.getTime()).split('T')[0];
        timePickerInput.value = formatDateTimeLocal(now.getTime()).split('T')[1];
      }
      dateTimePickerPopup.style.display = 'block';
      dateTimePickerPopup.classList.add('active');
      
      // Scroll picker into view
      setTimeout(() => {
        dateTimePickerPopup.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  });
  // Open native date picker on click
  datePickerInput.addEventListener('click', (e) => {
    e.stopPropagation();
    datePickerInput.showPicker();
  });
  
  // Open native time picker on click
  timePickerInput.addEventListener('click', (e) => {
    e.stopPropagation();
    timePickerInput.showPicker();
  });
  
  // Save selected date/time
  btnDonePicker.addEventListener('click', () => {
    if (datePickerInput.value && timePickerInput.value) {
      const dateTimeValue = `${datePickerInput.value}T${timePickerInput.value}`;
      hiddenInput.value = dateTimeValue;
      const date = new Date(dateTimeValue);
      displayInput.value = formatDueDateDisplay(date);
      displayInput.classList.add('hasValue');
      dateTimePickerPopup.style.display = 'none';
      dateTimePickerPopup.classList.remove('active');
    }
  });
  
  // Close picker when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dueDateInputWrapper')) {
      dateTimePickerPopup.style.display = 'none';
      dateTimePickerPopup.classList.remove('active');
    }
  });
}

// Format date for display in picker
function formatDueDateDisplay(date) {
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
// Open modal to view task details
function openTaskDetailsModal(note) {
  const modal = document.createElement('div');
  modal.className = 'taskModal taskDetailsModal';
  
  const priorityLabels = { high: 'High', medium: 'Medium', low: 'Low' };
  const columnLabels = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
  
  // Calculate time spent for display
  let timeSpentDisplay = '';
  if (note.startedAt && (note.timeSpent > 0 || note.column === 'inprogress')) {
    if (note.column === 'inprogress') {
      const timerManager = getTimerManager();
      const currentSessionTime = Date.now() - timerManager.getTimerStartTime(note.id);
      const totalTime = (note.timeSpent || 0) + currentSessionTime;
      timeSpentDisplay = formatElapsedTime(totalTime);
    } else {
      timeSpentDisplay = formatCompletedTime(note.timeSpent);
    }
  }
  modal.innerHTML = `
    <div class="modalContent">
      <div class="modalHeader">
        <h2><i class="fas fa-info-circle"></i> Task Details</h2>
        <button class="modalClose">&times;</button>
      </div>
      <div class="modalBody">
        <div class="detailsView">
          <div class="detailSection">
            <div class="detailLabel"><i class="fas fa-tasks"></i> Task Name</div>
            <div class="detailValue taskName">${note.text}</div>
          </div>
          ${note.description ? `
            <div class="detailSection">
              <div class="detailLabel"><i class="fas fa-align-left"></i> Description</div>
              <div class="detailValue description">${note.description}</div>
            </div>
          ` : ''}
          <div class="detailRow">
            <div class="detailSection">
              <div class="detailLabel"><i class="fas fa-flag"></i> Priority</div>
              <div class="detailValue">
                <span class="priorityBadge priority-${note.priority}">${priorityLabels[note.priority]}</span>
              </div>
            </div>
            <div class="detailSection">
              <div class="detailLabel"><i class="fas fa-columns"></i> Status</div>
              <div class="detailValue statusBadge status-${note.column}">${columnLabels[note.column]}</div>
            </div>
          </div>
          ${note.dueDate ? `
            <div class="detailSection highlight">
              <div class="detailLabel"><i class="fas fa-calendar-check"></i> Due Date & Time</div>
              <div class="detailValue dueDate">${formatDueDateDisplay(new Date(note.dueDate))}</div>
            </div>
          ` : ''}
          <div class="detailSection">
            <div class="detailLabel"><i class="fas fa-calendar-plus"></i> Created</div>
            <div class="detailValue">${formatTimestamp(note.createdAt)}</div>
          </div>
          ${note.lastEditedAt ? `
            <div class="detailSection">
              <div class="detailLabel"><i class="fas fa-edit"></i> Last Edited</div>
              <div class="detailValue">${formatTimestamp(note.lastEditedAt)}</div>
            </div>
          ` : ''}
          ${note.startedAt ? `
            <div class="detailSection">
              <div class="detailLabel"><i class="fas fa-play-circle"></i> First Started</div>
              <div class="detailValue">${formatTimestamp(note.startedAt)}</div>
            </div>
          ` : ''}
          ${timeSpentDisplay ? `
            <div class="detailSection">
              <div class="detailLabel"><i class="fas fa-hourglass-half"></i> Time Spent So Far</div>
              <div class="detailValue">${timeSpentDisplay}</div>
            </div>
          ` : ''}
          ${note.completedAt && note.column === 'done' ? `
            <div class="detailSection">
              <div class="detailLabel"><i class="fas fa-check-circle"></i> Completed</div>
              <div class="detailValue">${formatTimestamp(note.completedAt)}</div>
            </div>
            <div class="detailSection">
              <div class="detailLabel"><i class="fas fa-clock"></i> Total Time Spent</div>
              <div class="detailValue">${formatCompletedTime(note.timeSpent)}</div>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="modalFooter">
        <button class="btnDelete" data-note-id="${note.id}">
          <i class="fas fa-trash"></i> Delete Task
        </button>
        <button class="btnEdit" data-note-id="${note.id}">
          <i class="fas fa-edit"></i> Edit Task
        </button>
        <button class="btnClose">Close</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Get modal buttons
  const closeBtn = modal.querySelector('.modalClose');
  const closeFooterBtn = modal.querySelector('.btnClose');
  const editBtn = modal.querySelector('.btnEdit');
  const deleteBtn = modal.querySelector('.btnDelete');
  
  const closeModal = () => {
    modal.remove();
  };
  
  // Attach event listeners
  closeBtn.addEventListener('click', closeModal);
  closeFooterBtn.addEventListener('click', closeModal);
  
  editBtn.addEventListener('click', () => {
    closeModal();
    openTaskModal(note);
  });
  
  deleteBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteNote(note.id);
      closeModal();
    }
  });
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escapeHandler);
    }
  });
}

// Initialize app when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}