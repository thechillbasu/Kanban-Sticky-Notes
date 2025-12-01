let notes = [];
let activeTimers = {}; // For continuous timers on "In Progress" notes

function init() {
  notes = loadNotes() || [];

  // Normalize old notes so they work with new fields
  notes = notes.map(note => ({
    id: note.id,
    text: note.text,
    column: note.column || 'todo',
    priority: note.priority || 'low',
    createdAt: note.createdAt || new Date().toLocaleString(),
    startTime: note.startTime || null,
    totalTime: note.totalTime || null
  }));

  saveNotes(notes); // save normalized structure

  renderNotes(notes);
  updateEmptyState();

  if (!isStorageAvailable()) {
    showStorageWarning();
  }

  document.getElementById('addNoteForm')
    .addEventListener('submit', handleFormSubmit);

  // Event delegation for delete buttons
  document.querySelector('.board')
    .addEventListener('click', handleDeleteClick);
}

function handleFormSubmit(event) {
  event.preventDefault();

  const noteInput = document.getElementById('noteText');
  const columnSelect = document.getElementById('columnSelect');
  const prioritySelect = document.getElementById('prioritySelect'); // optional

  const text = noteInput.value.trim();
  const column = columnSelect.value;
  const priority = prioritySelect ? prioritySelect.value : 'low';

  if (text.length === 0) {
    noteInput.classList.add('invalidInput');
    setTimeout(() => noteInput.classList.remove('invalidInput'), 500);
    return;
  }

  addNote(text, column, priority);
  noteInput.value = '';
}

function addNote(text, column, priority) {
  const timestamp = new Date().toLocaleString();

  const newNote = {
    id: Date.now(),               // unique id
    text: text,
    column: column,
    priority: priority,
    createdAt: timestamp,
    startTime: null,              // when it enters In Progress
    totalTime: null               // final total time in seconds when Done
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

    // stop timer if running
    if (activeTimers[noteId]) {
      clearInterval(activeTimers[noteId]);
      delete activeTimers[noteId];
    }

    deleteNote(noteId);
  }
}

function deleteNote(noteId) {
  notes = notes.filter(note => note.id !== noteId);
  saveNotes(notes);
  renderNotes(notes);
  updateEmptyState();
}

function createNoteElement(note) {
  const noteDiv = document.createElement('div');
  noteDiv.className = 'stickyNote priority-' + (note.priority || 'low');
  noteDiv.setAttribute('data-note-id', note.id);

  // Note text
  const textP = document.createElement('p');
  textP.className = 'noteText';
  textP.textContent = note.text;

  // Created timestamp
  const timeP = document.createElement('small');
  timeP.className = 'timestamp';
  timeP.textContent = 'Created: ' + (note.createdAt || '');
  timeP.style.display = 'block';
  timeP.style.fontSize = '10px';
  timeP.style.opacity = '0.7';

  // Timer display (for In Progress / Done)
  const timerP = document.createElement('small');
  timerP.className = 'timer';
  timerP.style.display = 'block';
  timerP.style.fontSize = '10px';
  timerP.style.opacity = '0.8';

  if (note.column === 'done' && note.totalTime) {
    timerP.textContent = 'Total Time: ' + formatTime(note.totalTime);
  } else if (note.column === 'inprogress' && note.startTime) {
    const seconds = (Date.now() - note.startTime) / 1000;
    timerP.textContent = 'In Progress: ' + formatTime(seconds);
  } else {
    timerP.textContent = '';
  }

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'deleteBtn';
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';

  noteDiv.appendChild(textP);
  noteDiv.appendChild(timeP);
  noteDiv.appendChild(timerP);
  noteDiv.appendChild(deleteBtn);

  return noteDiv;
}

function renderNotes(notesToRender) {
  const todoContainer = document.querySelector('#todo .notesContainer');
  const inprogressContainer = document.querySelector('#inprogress .notesContainer');
  const doneContainer = document.querySelector('#done .notesContainer');

  // clear existing
  todoContainer.innerHTML = '';
  inprogressContainer.innerHTML = '';
  doneContainer.innerHTML = '';

  // stop all running timers before re-render
  Object.keys(activeTimers).forEach(id => {
    clearInterval(activeTimers[id]);
    delete activeTimers[id];
  });

  notesToRender.forEach(note => {
    const noteElement = createNoteElement(note);

    if (note.column === 'todo') {
      todoContainer.appendChild(noteElement);
    } else if (note.column === 'inprogress') {
      inprogressContainer.appendChild(noteElement);

      // if no start time yet, set it now
      if (!note.startTime) {
        note.startTime = Date.now();
        saveNotes(notes);
      }

      // start continuous timer
      startLiveTimer(note.id);

    } else if (note.column === 'done') {
      // stop timer if any
      if (activeTimers[note.id]) {
        clearInterval(activeTimers[note.id]);
        delete activeTimers[note.id];
      }

      // compute total time if not already recorded
      if (!note.totalTime && note.startTime) {
        note.totalTime = Math.floor((Date.now() - note.startTime) / 1000);
        saveNotes(notes);
      }

      doneContainer.appendChild(noteElement);
    }
  });

  initDragAndDrop(); // re-enable drag/drop after DOM updated
}

// Start continuous timer for a note in "In Progress"
function startLiveTimer(noteId) {
  if (activeTimers[noteId]) return; // already running

  activeTimers[noteId] = setInterval(() => {
    const note = notes.find(n => n.id === noteId);
    if (!note || note.column !== 'inprogress' || !note.startTime) {
      clearInterval(activeTimers[noteId]);
      delete activeTimers[noteId];
      return;
    }

    const seconds = (Date.now() - note.startTime) / 1000;
    updateTimerDisplay(noteId, seconds);
  }, 1000);
}

function updateTimerDisplay(noteId, seconds) {
  const timerElement = document.querySelector(
    `[data-note-id="${noteId}"] .timer`
  );
  if (timerElement) {
    timerElement.textContent = 'In Progress: ' + formatTime(seconds);
  }
}

function formatTime(seconds) {
  seconds = Math.floor(seconds);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function updateEmptyState() {
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
  warning.innerHTML =
    '<p><i class="fas fa-exclamation-triangle"></i> Warning: Your notes will not be saved.</p>';

  const container = document.querySelector('.container');
  container.insertBefore(warning, container.firstChild);
}

document.addEventListener('DOMContentLoaded', init);
