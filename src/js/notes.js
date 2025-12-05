// Notes Management - Core State and CRUD Operations
// 
// Manages the notes array state and provides functions for creating, reading,
// updating, and deleting tasks. Handles form submission and button click events
// for task operations. Coordinates with storage and timer modules.

import { saveNotes } from './storage.js';

let notes = []; // Array to store all tasks

// Getter for notes array
export function getNotes() {
  return notes;
}

// Setter for notes array
export function setNotes(newNotes) {
  notes = newNotes;
}

// Create and add a new task
export function addNote(text, column, priority = 'medium', description = '', dueDate = null, timerManager, renderCallback, updateEmptyStateCallback) {
  const now = Date.now();
  const newNote = {
    id: now, // Unique ID based on timestamp
    text: text,
    description: description,
    column: column,
    priority: priority,
    dueDate: dueDate,
    createdAt: now,
    lastEditedAt: null,
    startedAt: column === 'inprogress' ? now : null, // Track when task starts
    completedAt: column === 'done' ? now : null, // Set completedAt if adding directly to Done
    timeSpent: 0, // Accumulated time in milliseconds
    timerStartTime: column === 'inprogress' ? now : null, // Store actual timer start time
    inProgressSince: column === 'inprogress' ? now : null // Track when current In Progress session started
  };
  
  notes.push(newNote);
  
  // Start timer if adding directly to In Progress
  if (column === 'inprogress' && timerManager) {
    // Start timer from current time (no previous time spent)
    timerManager.startTimer(newNote.id, now);
  }
  
  saveNotes(notes);
  if (renderCallback) renderCallback(notes);
  if (updateEmptyStateCallback) updateEmptyStateCallback();
}

// Delete a task by ID
export function deleteNote(noteId, timerManager, renderCallback, updateEmptyStateCallback) {
  if (timerManager) {
    timerManager.stopTimer(noteId); // Stop timer if running
  }
  notes = notes.filter(note => note.id !== noteId);
  saveNotes(notes);
  if (renderCallback) renderCallback(notes);
  if (updateEmptyStateCallback) updateEmptyStateCallback();
}

// Update an existing note
export function updateNote(noteId, updates, renderCallback) {
  const noteIndex = notes.findIndex(n => n.id === noteId);
  if (noteIndex !== -1) {
    notes[noteIndex] = { ...notes[noteIndex], ...updates, lastEditedAt: Date.now() };
    saveNotes(notes);
    if (renderCallback) renderCallback(notes);
    return notes[noteIndex];
  }
  return null;
}

// Handle form submission for adding new tasks
export function handleFormSubmit(event, openTaskModalCallback) {
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
  if (openTaskModalCallback) {
    openTaskModalCallback(null, text, column, priority, null);
  }
  noteInput.value = '';
  prioritySelect.value = 'medium';
}

// Handle clicks on task cards (delete, edit, or view details)
export function handleButtonClick(event, notesArray, deleteNoteCallback, openTaskModalCallback, openTaskDetailsModalCallback) {
  // Handle delete button click
  const deleteBtn = event.target.closest('.deleteBtn');
  if (deleteBtn) {
    event.stopPropagation();
    const noteElement = deleteBtn.closest('.stickyNote');
    const noteId = parseInt(noteElement.getAttribute('data-note-id'));
    if (deleteNoteCallback) {
      deleteNoteCallback(noteId);
    }
    return;
  }
  
  // Handle edit button click
  const editBtn = event.target.closest('.editBtn');
  if (editBtn) {
    event.stopPropagation();
    const noteElement = editBtn.closest('.stickyNote');
    const noteId = parseInt(noteElement.getAttribute('data-note-id'));
    const note = notesArray.find(n => n.id === noteId);
    if (note && openTaskModalCallback) {
      openTaskModalCallback(note);
    }
    return;
  }
  
  // Handle click on card itself to view details
  const noteCard = event.target.closest('.stickyNote');
  if (noteCard && !event.target.closest('.editBtn, .deleteBtn, .priorityBadge')) {
    const noteId = parseInt(noteCard.getAttribute('data-note-id'));
    const note = notesArray.find(n => n.id === noteId);
    if (note && openTaskDetailsModalCallback) {
      openTaskDetailsModalCallback(note);
    }
    return;
  }
}

