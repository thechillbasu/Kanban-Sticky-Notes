/**
 * TimerManager class for tracking time spent on in-progress notes
 */
export class TimerManager {
  constructor() {
    // Store active timers: Map<noteId, startTime>
    this.activeTimers = new Map();
    // Interval ID for the update loop
    this.updateIntervalId = null;
  }

  /**
   * Start a timer for a note
   * @param {number} noteId - The ID of the note
   * @param {number} startedAt - The timestamp when the note was started
   */
  startTimer(noteId, startedAt) {
    if (!noteId || !startedAt) {
      console.error('Invalid noteId or startedAt provided to startTimer');
      return;
    }
    
    this.activeTimers.set(noteId, startedAt);
  }

  /**
   * Stop a timer for a note and return the elapsed time
   * @param {number} noteId - The ID of the note
   * @returns {number} - The elapsed time in milliseconds
   */
  stopTimer(noteId) {
    if (!this.activeTimers.has(noteId)) {
      return 0;
    }
    
    const startedAt = this.activeTimers.get(noteId);
    const elapsedTime = Date.now() - startedAt;
    
    this.activeTimers.delete(noteId);
    
    return elapsedTime;
  }

  /**
   * Get the elapsed time for a note
   * @param {number} noteId - The ID of the note
   * @param {number} currentTime - Optional current time (defaults to Date.now())
   * @returns {number} - The elapsed time in milliseconds
   */
  getElapsedTime(noteId, currentTime = Date.now()) {
    if (!this.activeTimers.has(noteId)) {
      return 0;
    }
    
    const startedAt = this.activeTimers.get(noteId);
    return currentTime - startedAt;
  }

  /**
   * Check if a timer is active for a note
   * @param {number} noteId - The ID of the note
   * @returns {boolean}
   */
  isTimerActive(noteId) {
    return this.activeTimers.has(noteId);
  }

  /**
   * Get all active timer IDs
   * @returns {Array<number>}
   */
  getActiveTimerIds() {
    return Array.from(this.activeTimers.keys());
  }

  /**
   * Clear all timers
   */
  clearAllTimers() {
    this.activeTimers.clear();
  }

  /**
   * Start the update loop that calls the provided callback every second
   * @param {Function} updateCallback - Function to call on each update
   */
  startUpdateLoop(updateCallback) {
    if (this.updateIntervalId) {
      // Already running
      return;
    }
    
    this.updateIntervalId = setInterval(() => {
      if (typeof updateCallback === 'function') {
        updateCallback();
      }
    }, 1000); // Update every second
  }

  /**
   * Stop the update loop
   */
  stopUpdateLoop() {
    if (this.updateIntervalId) {
      clearInterval(this.updateIntervalId);
      this.updateIntervalId = null;
    }
  }

  /**
   * Pause all timers (for page visibility changes)
   */
  pauseAllTimers() {
    this.stopUpdateLoop();
  }

  /**
   * Resume all timers (for page visibility changes)
   * @param {Function} updateCallback - Function to call on each update
   */
  resumeAllTimers(updateCallback) {
    this.startUpdateLoop(updateCallback);
  }
}

/**
 * Format elapsed time in milliseconds to HH:MM:SS format
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time string (HH:MM:SS)
 */
export function formatElapsedTime(milliseconds) {
  if (milliseconds < 0) {
    return '00:00:00';
  }
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // Pad with zeros
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  
  return `${hh}:${mm}:${ss}`;
}

/**
 * Format time spent for completed tasks in the Done column
 * @param {number} milliseconds - Time in milliseconds
 * @returns {string} - Formatted time string for Done column
 */
export function formatCompletedTime(milliseconds) {
  // Handle zero or invalid time
  if (!milliseconds || milliseconds <= 0) {
    return 'No time tracked';
  }
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  // Build readable format
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
