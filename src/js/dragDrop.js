// Drag and Drop Functionality
// 
// Implements HTML5 drag and drop API for moving task cards between columns.
// Handles drag start, drag over, drop, and drag end events. Automatically manages
// timer state when tasks move to/from "In Progress" column. Provides visual feedback
// during dragging with highlight effects on drop targets.

import { getNotes, setNotes, getTimerManager } from './main.js';
import { saveNotes } from './storage.js';

// Initialize drag and drop for all notes and columns
export function initDragAndDrop() {
  const allNotes = document.querySelectorAll('.stickyNote');
  
  // Make each note draggable
  allNotes.forEach(note => {
    note.setAttribute('draggable', 'true');
    note.addEventListener('dragstart', handleDragStart);
    note.addEventListener('dragend', handleDragEnd);
  });
  
  // Set up drop zones on columns
  const columns = document.querySelectorAll('.boardColumn');
  columns.forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
    column.addEventListener('dragleave', handleDragLeave);
  });
}

// Store note ID when drag starts
function handleDragStart(event) {
  const noteId = event.currentTarget.getAttribute('data-note-id');
  event.dataTransfer.setData('text/plain', noteId);
  event.currentTarget.classList.add('dragging');
}

// Allow drop by preventing default behavior
function handleDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add('dropTarget');
}

// Remove drop target styling when leaving column
function handleDragLeave(event) {
  if (event.currentTarget === event.target || !event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('dropTarget');
  }
}

// Handle note drop - update column and manage timers
function handleDrop(event) {
  event.preventDefault();
  
  const column = event.currentTarget;
  const newColumn = column.id;
  const noteId = parseInt(event.dataTransfer.getData('text/plain'));
  
  const notes = getNotes();
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex !== -1) {
    const note = notes[noteIndex];
    const oldColumn = note.column;
    note.column = newColumn;
    
    const timerManager = getTimerManager();
    
    // Start timer when moving to In Progress
    if (newColumn === 'inprogress' && oldColumn !== 'inprogress') {
      if (!note.startedAt) {
        note.startedAt = Date.now();
      }
      timerManager.startTimer(noteId, Date.now());
    }
    
    // Stop timer and save elapsed time when leaving In Progress
    if (oldColumn === 'inprogress' && newColumn !== 'inprogress') {
      const elapsedTime = timerManager.stopTimer(noteId);
      note.timeSpent = (note.timeSpent || 0) + elapsedTime;
      
      // Mark as completed if moving to Done
      if (newColumn === 'done') {
        note.completedAt = Date.now();
      }
    }
    
    saveNotes(notes);
    window.dispatchEvent(new CustomEvent('notesUpdated'));
  }
  
  column.classList.remove('dropTarget');
}

// Clean up styling when drag ends
function handleDragEnd(event) {
  event.currentTarget.classList.remove('dragging');
  
  const columns = document.querySelectorAll('.boardColumn');
  columns.forEach(column => column.classList.remove('dropTarget'));
}
