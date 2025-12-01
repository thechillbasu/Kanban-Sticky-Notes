import { loadNotes, saveNotes, isStorageAvailable } from './storage.js';
import { initDragAndDrop } from './dragDrop.js';
import { TimerManager, formatElapsedTime, formatCompletedTime } from './timer.js';

let notes = [];
let timerManager = new TimerManager();

export function init() {
  notes = loadNotes();
  renderNotes(notes);
  updateEmptyState();
  
  // Initialize timers for notes in progress
  initializeTimers();
  
  // Start the timer update loop
  timerManager.startUpdateLoop(updateTimerDisplays);
  
  if (!isStorageAvailable()) {
    showStorageWarning();
  }
  
  document.getElementById('addNoteForm').addEventListener('submit', handleFormSubmit);
  // event delegation for delete buttons
  document.querySelector('.board').addEventListener('click', handleDeleteClick);
  // event delegation for note text clicks (edit mode)
  document.querySelector('.board').addEventListener('click', handleNoteTextClick);
  
  // Listen for notes updates from drag and drop
  window.addEventListener('notesUpdated', () => {
    notes = loadNotes();
    renderNotes(notes);
    initializeTimers();
  });
}

function handleFormSubmit(event) {
  event.preventDefault();
  
  const noteInput = document.getElementById('noteText');
  const prioritySelect = document.getElementById('prioritySelect');
  const columnSelect = document.getElementById('columnSelect');
  
  const text = noteInput.value.trim();
  const priority = prioritySelect.value;
  const column = columnSelect.value;
  
  if (text.length === 0) {
    noteInput.classList.add('invalidInput');
    setTimeout(() => noteInput.classList.remove('invalidInput'), 500);
    return;
  }
  
  addNote(text, column, priority);
  noteInput.value = '';
  prioritySelect.value = 'medium';
}

export function addNote(text, column, priority = 'medium') {
  const newNote = {
    id: Date.now(), // timestamp as unique id
    text: text,
    column: column,
    priority: priority,
    createdAt: Date.now(),
    startedAt: null,
    completedAt: null,
    timeSpent: 0
  };
  
  notes.push(newNote);
  saveNotes(notes);
  renderNotes(notes);
  updateEmptyState();
}

function handleDeleteClick(event) {
  const deleteBtn = event.target.closest('.deleteBtn');
  
  if (deleteBtn) {
    const noteElement = deleteBtn.closest('.stickyNote');
    const noteId = parseInt(noteElement.getAttribute('data-note-id'));
    deleteNote(noteId);
  }
}

export function deleteNote(noteId) {
  notes = notes.filter(note => note.id !== noteId);
  saveNotes(notes);
  renderNotes(notes);
  updateEmptyState();
}

function handleNoteTextClick(event) {
  const noteText = event.target.closest('.noteText');
  
  if (noteText) {
    const noteElement = noteText.closest('.stickyNote');
    // Don't enable edit mode if already in edit mode
    if (!noteElement.classList.contains('editing')) {
      enableEditMode(noteElement);
    }
  }
}

export function enableEditMode(noteElement) {
  const noteId = parseInt(noteElement.getAttribute('data-note-id'));
  const note = notes.find(n => n.id === noteId);
  
  if (!note) return;
  
  // Mark note as being edited
  noteElement.classList.add('editing');
  
  // Disable dragging during edit mode
  noteElement.setAttribute('draggable', 'false');
  
  const noteTextElement = noteElement.querySelector('.noteText');
  const originalText = note.text;
  
  // Store original text as data attribute for cancel functionality
  noteElement.setAttribute('data-original-text', originalText);
  
  // Create input field
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'noteEditInput';
  input.value = originalText;
  
  // Replace text with input
  noteTextElement.style.display = 'none';
  noteElement.insertBefore(input, noteTextElement);
  
  // Focus the input and select all text
  input.focus();
  input.select();
  
  // Add event listeners
  input.addEventListener('blur', () => saveEdit(noteElement));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit(noteElement);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit(noteElement);
    }
  });
}

export function saveEdit(noteElement) {
  const noteId = parseInt(noteElement.getAttribute('data-note-id'));
  const note = notes.find(n => n.id === noteId);
  
  if (!note) return;
  
  const input = noteElement.querySelector('.noteEditInput');
  if (!input) return;
  
  const newText = input.value.trim();
  
  // Validate: reject empty or whitespace-only text
  if (newText.length === 0) {
    // Restore original text without saving
    cancelEdit(noteElement);
    return;
  }
  
  // Update note data
  note.text = newText;
  
  // Persist to storage
  saveNotes(notes);
  
  // Exit edit mode and restore note display
  exitEditMode(noteElement, newText);
}

export function cancelEdit(noteElement) {
  const originalText = noteElement.getAttribute('data-original-text');
  
  // Exit edit mode and restore original text
  exitEditMode(noteElement, originalText);
}

function exitEditMode(noteElement, textToDisplay) {
  // Remove editing class
  noteElement.classList.remove('editing');
  
  // Re-enable dragging
  noteElement.setAttribute('draggable', 'true');
  
  // Remove input field
  const input = noteElement.querySelector('.noteEditInput');
  if (input) {
    input.remove();
  }
  
  // Show and update text element
  const noteTextElement = noteElement.querySelector('.noteText');
  noteTextElement.textContent = textToDisplay;
  noteTextElement.style.display = '';
  
  // Clean up data attribute
  noteElement.removeAttribute('data-original-text');
}

export function createNoteElement(note) {
  const noteDiv = document.createElement('div');
  noteDiv.className = `stickyNote column-${note.column}`;
  noteDiv.setAttribute('data-note-id', note.id);
  
  // Add priority badge (absolute positioned at top-left)
  if (note.priority) {
    const priorityBadge = createPriorityBadge(note.priority);
    noteDiv.appendChild(priorityBadge);
  }
  
  // Add delete button (absolute positioned at top-right)
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'deleteBtn';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  noteDiv.appendChild(deleteBtn);
  
  // Add main text
  const textP = document.createElement('p');
  textP.className = 'noteText';
  textP.textContent = note.text;
  noteDiv.appendChild(textP);
  
  // Add timestamp display for To Do column
  if (note.column === 'todo' && note.createdAt) {
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'noteTimestamp';
    timestampDiv.textContent = formatTimestamp(note.createdAt);
    noteDiv.appendChild(timestampDiv);
  }
  
  // Add timer display for In Progress column
  if (note.column === 'inprogress' && note.startedAt) {
    const timerDiv = document.createElement('div');
    timerDiv.className = 'timerDisplay';
    // Calculate elapsed time from startedAt timestamp
    const elapsedTime = Date.now() - note.startedAt;
    timerDiv.textContent = `⏱ ${formatElapsedTime(elapsedTime)}`;
    noteDiv.appendChild(timerDiv);
  }
  
  // Add time display for Done column
  if (note.column === 'done') {
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'completedTimeDisplay';
    timeDisplay.textContent = `Completed in ${formatCompletedTime(note.timeSpent)}`;
    noteDiv.appendChild(timeDisplay);
    
    // Add completion date
    if (note.completedAt) {
      const completedDateDiv = document.createElement('div');
      completedDateDiv.className = 'completedDate';
      completedDateDiv.textContent = `on ${formatTimestamp(note.completedAt)}`;
      noteDiv.appendChild(completedDateDiv);
    }
  }
  
  return noteDiv;
}

export function createPriorityBadge(priority) {
  const badge = document.createElement('span');
  badge.className = `priorityBadge priority-${priority}`;
  badge.setAttribute('data-priority', priority);
  
  // Display text label based on priority
  const labels = {
    high: 'HIGH',
    medium: 'MED',
    low: 'LOW'
  };
  
  badge.textContent = labels[priority] || 'MED';
  
  return badge;
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  
  // Format: Monday, Dec 1, 2025 at 2:30 PM
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

export function renderNotes(notesToRender) {
  const todoContainer = document.querySelector('#todo .notesContainer');
  const inprogressContainer = document.querySelector('#inprogress .notesContainer');
  const doneContainer = document.querySelector('#done .notesContainer');
  
  // clear all columns
  todoContainer.innerHTML = '';
  inprogressContainer.innerHTML = '';
  doneContainer.innerHTML = '';
  
  // Sort notes by priority (high > medium > low)
  const sortedNotes = sortNotesByPriority(notesToRender);
  
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
  
  initDragAndDrop();
}

function sortNotesByPriority(notesToSort) {
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  
  return [...notesToSort].sort((a, b) => {
    const priorityA = priorityOrder[a.priority] || 2;
    const priorityB = priorityOrder[b.priority] || 2;
    return priorityA - priorityB;
  });
}

export function updateEmptyState() {
  const emptyState = document.getElementById('emptyState');
  
  if (notes.length > 0) {
    emptyState.style.display = 'none';
  } else {
    emptyState.style.display = 'block';
  }
}

function showStorageWarning() {
  const warning = document.createElement('div');
  warning.className = 'storageWarning';
  warning.innerHTML = '<p><i class="fas fa-exclamation-triangle"></i> Warning: Your notes will not be saved.</p>';
  
  const container = document.querySelector('.container');
  container.insertBefore(warning, container.firstChild);
}

export function getNotes() {
  return notes;
}

export function setNotes(newNotes) {
  notes = newNotes;
}

/**
 * Initialize timers for all notes currently in progress
 */
function initializeTimers() {
  notes.forEach(note => {
    if (note.column === 'inprogress' && note.startedAt) {
      timerManager.startTimer(note.id, note.startedAt);
    }
  });
}

/**
 * Update all timer displays for notes in progress
 */
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

export function getTimerManager() {
  return timerManager;
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
