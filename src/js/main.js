// Main Application Logic - Orchestration Module
// 
// Core module that orchestrates the entire kanban board application.
// Coordinates between notes, rendering, modals, storage, drag-drop, and timer modules.
// Initializes the app and sets up event listeners. Manages timer updates.

import { loadNotes, saveNotes, isStorageAvailable } from './storage.js';
import { initDragAndDrop } from './dragDrop.js';
import { TimerManager, formatElapsedTime } from './timer.js';
import { openGooglePanel, closeGooglePanel } from './headerWidgets.js';
import { ensureGoogleAuth, fetchAndDisplayEvents } from './googleCalendar.js';
import { getNotes, setNotes, addNote, deleteNote, updateNote, handleFormSubmit, handleButtonClick } from './notes.js';
import { renderNotes, updateEmptyState } from './rendering.js';
import { openTaskModal, openTaskDetailsModal } from './modals.js';

let notes = []; // Array to store all tasks
let timerManager = new TimerManager(); // Manages time tracking for in-progress tasks

// Initialize the application
export function init() {
  notes = loadNotes();
  setNotes(notes);
  
  // Start timers for tasks already in progress BEFORE rendering
  initializeTimers();
  timerManager.startUpdateLoop(updateTimerDisplays);
  
  // Now render with timers already running
  renderNotes(notes, timerManager);
  updateEmptyState(notes);
  
  // Show warning if localStorage is not available
  if (!isStorageAvailable()) {
    showStorageWarning();
  }
  
  // Attach event listeners
  document.getElementById('addNoteForm').addEventListener('submit', (e) => {
    handleFormSubmit(e, (note, text, column, priority, dueDate) => {
      openTaskModal(note, text, column, priority, dueDate, handleTaskSave);
    });
  });
  
  document.querySelector('.board').addEventListener('click', (e) => {
    handleButtonClick(
      e,
      notes,
      (noteId) => handleDeleteNote(noteId),
      (note) => openTaskModal(note, null, null, null, null, handleTaskSave),
      (note) => openTaskDetailsModal(note, getTimerManager, (note) => openTaskModal(note, null, null, null, null, handleTaskSave), handleDeleteNote)
    );
  });
  
  // Calendar panel view management
  const calendarPanel = document.getElementById('googleCalendarPanel');
  const iframeContainer = document.getElementById('googleCalendarIframeContainer');
  const eventsContainer = document.getElementById('googleEventsListContainer');

  function showCalendarPanel(view) {
    if (!calendarPanel) return;
    
    const container = calendarPanel.querySelector('.googleCalendarPanelContainer');
    if (container) {
      container.classList.remove('closing');
    }
    
    const titleElement = document.getElementById('googleCalendarPanelTitle');
    if (titleElement) {
      titleElement.textContent = view === 'events' ? 'My Events' : 'Google Calendar';
    }
    
    calendarPanel.classList.remove('hidden');
    
    if (iframeContainer) {
      iframeContainer.classList.toggle('hidden', view !== 'iframe');
    }
    
    if (eventsContainer) {
      eventsContainer.classList.toggle('hidden', view !== 'events');
    }
  }

  // Wire up live clock click handler - shows iframe
  const clockWidget = document.getElementById('clockWidget');
  if (clockWidget) {
    clockWidget.addEventListener('click', () => {
      showCalendarPanel('iframe');
    });
    clockWidget.style.cursor = 'pointer';
  }
  
  // Wire up My Events button - shows events with OAuth
  const myEventsBtn = document.getElementById('myEventsBtn');
  if (myEventsBtn) {
    myEventsBtn.addEventListener('click', async () => {
      try {
        await ensureGoogleAuth();
        showCalendarPanel('events');
        fetchAndDisplayEvents();
      } catch (e) {
        console.error('Google auth failed', e);
        alert('Failed to authenticate with Google Calendar. Please try again.');
      }
    });
  }
  
  
  // Close calendar panel on backdrop click
  if (calendarPanel) {
    calendarPanel.addEventListener('click', (e) => {
      if (e.target.classList.contains('googleCalendarPanelBackdrop')) {
        closeGooglePanel();
      }
    });
  }
  
  
  // Wire up calendar panel close button
  const closePanelBtn = document.getElementById('closeGooglePanelBtn');
  if (closePanelBtn) {
    closePanelBtn.addEventListener('click', closeGooglePanel);
  }
  
  // Close panel on backdrop click
  const panel = document.getElementById('googleCalendarPanel');
  if (panel) {
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        closeGooglePanel();
      }
    });
  }
  
  // Listen for updates from drag and drop
  window.addEventListener('notesUpdated', () => {
    notes = loadNotes();
    setNotes(notes);
    // Re-initialize timers BEFORE rendering to prevent flicker
    initializeTimers();
    renderNotes(notes, timerManager);
  });
}

// Handle task save from modal
function handleTaskSave(note, newText, newDescription, newPriority, newDueDate, taskColumn) {
  if (note) {
    // Update existing note
    updateNote(note.id, {
      text: newText,
      description: newDescription,
      priority: newPriority,
      dueDate: newDueDate
    }, () => {
      notes = getNotes();
      // Re-initialize timers BEFORE rendering to prevent flicker
      initializeTimers();
      renderNotes(notes, timerManager);
      updateEmptyState(notes);
    });
  } else {
    // Create new note
    addNote(newText, taskColumn, newPriority, newDescription, newDueDate, timerManager, () => {
      notes = getNotes();
      // Re-initialize timers BEFORE rendering to prevent flicker
      initializeTimers();
      renderNotes(notes, timerManager);
      updateEmptyState(notes);
    }, () => {
      updateEmptyState(notes);
    });
  }
}

// Handle note deletion
function handleDeleteNote(noteId) {
  deleteNote(noteId, timerManager, () => {
    notes = getNotes();
    // Re-initialize timers BEFORE rendering to prevent flicker
    initializeTimers();
    renderNotes(notes, timerManager);
    updateEmptyState(notes);
  }, () => {
    updateEmptyState(notes);
  });
}

// Start timers for all tasks in progress
function initializeTimers() {
  // Clear all existing timers first
  timerManager.clearAllTimers();
  
  notes.forEach(note => {
    if (note.column === 'inprogress') {
      // Calculate actual elapsed time including time when browser was closed
      let totalElapsedTime = note.timeSpent || 0;
      
      if (note.inProgressSince) {
        // Add time since task entered In Progress (even if browser was closed)
        const currentSessionTime = Date.now() - note.inProgressSince;
        totalElapsedTime += currentSessionTime;
      }
      
      // Set adjusted start time for timer display
      const adjustedStartTime = Date.now() - totalElapsedTime;
      note.timerStartTime = adjustedStartTime;
      
      // Set first started timestamp if not already set
      if (!note.startedAt) {
        note.startedAt = note.inProgressSince || Date.now();
      }
      
      // Ensure inProgressSince is set (for backward compatibility)
      if (!note.inProgressSince) {
        note.inProgressSince = Date.now();
      }
      
      timerManager.startTimer(note.id, adjustedStartTime);
    }
  });
  
  // Save notes to persist any updates
  saveNotes(notes);
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

// Display warning if localStorage is not available
function showStorageWarning() {
  const warning = document.createElement('div');
  warning.className = 'storageWarning';
  warning.innerHTML =
    '<p><i class="fas fa-exclamation-triangle"></i> Warning: Your notes will not be saved.</p>';
  const container = document.querySelector('.container');
  container.insertBefore(warning, container.firstChild);
}

// Re-export notes functions for other modules that need them
export { getNotes, setNotes } from './notes.js';

// Initialize app when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}
