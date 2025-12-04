// Rendering and DOM Manipulation
// 
// Handles rendering of notes to the DOM, creating note elements, priority badges,
// and managing the visual display of the kanban board. Coordinates with drag-drop
// module to re-enable drag functionality after rendering.

import { initDragAndDrop } from './dragDrop.js';
import { formatTimestamp, formatDueDate } from './formatters.js';
import { formatElapsedTime, formatCompletedTime } from './timer.js';

// Create a task card DOM element
export function createNoteElement(note, timerManager) {
  const noteDiv = document.createElement('div');
  noteDiv.className = `stickyNote column${note.column.charAt(0).toUpperCase() + note.column.slice(1)}`;
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
  if (note.column === 'inprogress') {
    const timerDiv = document.createElement('div');
    timerDiv.className = 'timerDisplay';
    let elapsedTime = 0;
    
    if (timerManager && timerManager.isTimerActive(note.id)) {
      elapsedTime = timerManager.getElapsedTime(note.id);
    } else {
      // If timer is not active but task is in progress, show accumulated time
      elapsedTime = note.timeSpent || 0;
    }
    
    timerDiv.textContent = `⏱ ${formatElapsedTime(elapsedTime)}`;
    noteDiv.appendChild(timerDiv);
    
    // Add creation timestamp below timer
    if (note.createdAt) {
      const timestampDiv = document.createElement('div');
      timestampDiv.className = 'noteTimestamp';
      timestampDiv.textContent = formatTimestamp(note.createdAt);
      noteDiv.appendChild(timestampDiv);
    }
  }
  
  // Add completion info for Done column
  if (note.column === 'done') {
    const timeDisplay = document.createElement('div');
    timeDisplay.className = 'completedTimeDisplay';
    
    // Check if time was tracked
    if (note.timeSpent && note.timeSpent > 0) {
      timeDisplay.textContent = `Completed in ${formatCompletedTime(note.timeSpent)}`;
    } else {
      timeDisplay.textContent = 'Completed [Completion Time Not Tracked]';
    }
    
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
  const priorityClasses = { high: 'priorityHigh', medium: 'priorityMedium', low: 'priorityLow' };
  badge.className = `priorityBadge ${priorityClasses[priority] || 'priorityMedium'}`;
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

// Render all tasks to the board
export function renderNotes(notesToRender, timerManager) {
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
    const noteElement = createNoteElement(note, timerManager);
    
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
export function updateEmptyState(notesArray) {
  const emptyState = document.getElementById('emptyState');
  if (notesArray && notesArray.length > 0) {
    emptyState.style.display = 'none';
  } else {
    emptyState.style.display = 'block';
  }
}



