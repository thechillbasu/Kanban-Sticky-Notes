import { getNotes, setNotes, getTimerManager } from './main.js';
import { saveNotes } from './storage.js';

export function initDragAndDrop() {
  const allNotes = document.querySelectorAll('.stickyNote');
  
  allNotes.forEach(note => {
    note.setAttribute('draggable', 'true');
    note.addEventListener('dragstart', handleDragStart);
    note.addEventListener('dragend', handleDragEnd);
  });
  
  const columns = document.querySelectorAll('.boardColumn');
  columns.forEach(column => {
    column.addEventListener('dragover', handleDragOver);
    column.addEventListener('drop', handleDrop);
    column.addEventListener('dragleave', handleDragLeave);
  });
}

function handleDragStart(event) {
  const noteId = event.currentTarget.getAttribute('data-note-id');
  // store note id for drop event
  event.dataTransfer.setData('text/plain', noteId);
  event.currentTarget.classList.add('dragging');
}

function handleDragOver(event) {
  event.preventDefault(); // allow drop
  event.currentTarget.classList.add('dropTarget');
}

function handleDragLeave(event) {
  if (event.currentTarget === event.target || !event.currentTarget.contains(event.relatedTarget)) {
    event.currentTarget.classList.remove('dropTarget');
  }
}

function handleDrop(event) {
  event.preventDefault();
  
  const column = event.currentTarget;
  const newColumn = column.id;
  const noteId = parseInt(event.dataTransfer.getData('text/plain'));
  
  // update note data
  const notes = getNotes();
  const noteIndex = notes.findIndex(note => note.id === noteId);
  if (noteIndex !== -1) {
    const note = notes[noteIndex];
    const oldColumn = note.column;
    note.column = newColumn;
    
    // Timer management based on column transitions
    const timerManager = getTimerManager();
    
    // Start timer when moving to In Progress
    if (newColumn === 'inprogress' && oldColumn !== 'inprogress') {
      note.startedAt = Date.now();
      timerManager.startTimer(noteId, note.startedAt);
    }
    
    // Stop timer and record time when leaving In Progress
    if (oldColumn === 'inprogress' && newColumn !== 'inprogress') {
      const elapsedTime = timerManager.stopTimer(noteId);
      note.timeSpent = (note.timeSpent || 0) + elapsedTime;
      
      // Set completedAt if moving to Done
      if (newColumn === 'done') {
        note.completedAt = Date.now();
      }
    }
    
    saveNotes(notes);
    
    // Trigger re-render by dispatching custom event
    window.dispatchEvent(new CustomEvent('notesUpdated'));
  }
  
  column.classList.remove('dropTarget');
}

function handleDragEnd(event) {
  event.currentTarget.classList.remove('dragging');
  
  const columns = document.querySelectorAll('.boardColumn');
  columns.forEach(column => column.classList.remove('dropTarget'));
}
