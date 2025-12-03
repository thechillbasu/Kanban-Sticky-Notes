// Local Storage Management
// 
// Handles all localStorage operations for persisting kanban notes in the browser.
// Provides functions to save and load notes, check storage availability, and
// migrate old note data to ensure backward compatibility when new fields are added.
// All data is stored as JSON in the browser's localStorage.

export const STORAGE_KEY = 'kanbanNotes';

// Check if localStorage is available in the browser
export function isStorageAvailable() {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (e) {
    return false;
  }
}

// Add missing fields to old notes for backward compatibility
export function migrateNote(note) {
  return {
    id: note.id,
    text: note.text,
    description: note.description || '',
    column: note.column,
    priority: note.priority || 'medium',
    dueDate: note.dueDate || null,
    createdAt: note.createdAt || Date.now(),
    lastEditedAt: note.lastEditedAt || null,
    startedAt: note.startedAt || null,
    completedAt: note.completedAt || null,
    timeSpent: note.timeSpent || 0
  };
}

// Load notes from localStorage
export function loadNotes() {
  if (!isStorageAvailable()) {
    return [];
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    
    if (!data) {
      return [];
    }
    
    const notes = JSON.parse(data);
    if (!Array.isArray(notes)) {
      return [];
    }
    
    // Migrate notes to ensure all fields exist
    const migratedNotes = notes.map(migrateNote);
    
    // Save migrated data back
    if (migratedNotes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedNotes));
    }
    
    return migratedNotes;
  } catch (e) {
    return [];
  }
}

// Save notes to localStorage
export function saveNotes(notes) {
  if (!isStorageAvailable()) {
    return false;
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    return true;
  } catch (e) {
    alert('Could not save notes. Storage might be full.');
    return false;
  }
}
