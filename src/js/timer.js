// Time Tracking System
// 
// Manages time tracking for tasks in the "In Progress" column. The TimerManager class
// tracks multiple active timers simultaneously, calculates elapsed time, and provides
// formatting functions. Supports accumulative time tracking across multiple sessions
// (time persists when moving tasks back to In Progress). Updates timer displays every second.

// Timer manager class for tracking multiple task timers
export class TimerManager {
  constructor() {
    this.activeTimers = new Map(); // Map of noteId -> startTime
    this.updateIntervalId = null; // Interval ID for update loop
  }

  // Start tracking time for a task
  startTimer(noteId, startedAt) {
    if (!noteId || !startedAt) {
      console.error('Invalid noteId or startedAt provided to startTimer');
      return;
    }
    
    this.activeTimers.set(noteId, startedAt);
  }

  // Stop timer and return elapsed time
  stopTimer(noteId) {
    if (!this.activeTimers.has(noteId)) {
      return 0;
    }
    
    const startedAt = this.activeTimers.get(noteId);
    const elapsedTime = Date.now() - startedAt;
    
    this.activeTimers.delete(noteId);
    
    return elapsedTime;
  }

  // Get current elapsed time for a task
  getElapsedTime(noteId, currentTime = Date.now()) {
    if (!this.activeTimers.has(noteId)) {
      return 0;
    }
    
    const startedAt = this.activeTimers.get(noteId);
    return currentTime - startedAt;
  }

  // Get the start time for a timer
  getTimerStartTime(noteId) {
    if (!this.activeTimers.has(noteId)) {
      return Date.now();
    }
    return this.activeTimers.get(noteId);
  }

  // Check if a timer is running for a task
  isTimerActive(noteId) {
    return this.activeTimers.has(noteId);
  }

  // Get all active timer IDs
  getActiveTimerIds() {
    return Array.from(this.activeTimers.keys());
  }

  // Clear all active timers
  clearAllTimers() {
    this.activeTimers.clear();
  }

  // Start the update loop that calls callback every second
  startUpdateLoop(updateCallback) {
    if (this.updateIntervalId) {
      return; // Already running
    }
    
    this.updateIntervalId = setInterval(() => {
      if (typeof updateCallback === 'function') {
        updateCallback();
      }
    }, 1000);
  }

  // Stop the update loop
  stopUpdateLoop() {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  // Pause all timers
  pauseAllTimers() {
    this.stopUpdateLoop();
  }

  // Resume all timers
  resumeAllTimers(updateCallback) {
    this.startUpdateLoop(updateCallback);
  }
}

// Format milliseconds to HH:MM:SS format
export function formatElapsedTime(milliseconds) {
  if (milliseconds < 0) {
    return '00:00:00';
  }
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  
  return `${hh}:${mm}:${ss}`;
}

// Format time in human-readable format for completed tasks
export function formatCompletedTime(milliseconds) {
  if (!milliseconds || milliseconds <= 0) {
    return 'No time tracked';
  }
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts = [];
  
  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  }
  
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);
  }
  
  return parts.join(' ');
}
