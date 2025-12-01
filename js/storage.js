export const STORAGE_KEY = 'kanbanNotes';

export function isStorageAvailable() {
  // check if localStorage works (fails in private mode)
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (e) {
    return false;
  }
}

export function migrateNote(note) {
  // Add missing fields with default values for backward compatibility
  return {
    id: note.id,
    text: note.text,
    column: note.column,
    priority: note.priority || 'medium',
    createdAt: note.createdAt || Date.now(),
    startedAt: note.startedAt || null,
    completedAt: note.completedAt || null,
    timeSpent: note.timeSpent || 0
  };
}

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
    
    // Migrate notes to add missing fields
    const migratedNotes = notes.map(migrateNote);
    
    // Save migrated data back to storage
    if (migratedNotes.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedNotes));
    }
    
    return migratedNotes;
  } catch (e) {
    return [];
  }
}

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
