# Kanban Sticky Notes Board

A modern, feature-rich task management application built with vanilla HTML, CSS, and JavaScript. Organize and track your tasks across three columns using an intuitive drag-and-drop interface with automatic browser storage. The application features a sleek dark/light theme with cyberpunk aesthetics, real-time clock display, Google Calendar integration, and comprehensive time tracking.

**Current Version:** 3.0.0

**Live Demo:** [https://thechillbasu.github.io/Kanban-Sticky-Notes/](https://thechillbasu.github.io/Kanban-Sticky-Notes/)

## Features

### Task Management
- Drag-and-drop task organization across To Do, In Progress, and Done columns
- Priority levels (High, Medium, Low) with distinct color-coded badges
  - High: Red for urgent tasks
  - Medium: Orange for normal priority
  - Low: Blue for less urgent tasks
- Task descriptions with rich text support
- Due dates with color-coded urgency indicators (overdue, urgent, upcoming)
- Automatic sorting by priority within each column
- Comprehensive task details modal with all task information

### Time Tracking
- Automatic timer for tasks moved to In Progress column
- Real-time elapsed time display for active tasks (HH:MM:SS format)
- Real-world time tracking that continues even when browser is closed
- Persistent time tracking across page refreshes and sessions
- Accumulative time tracking when tasks move in and out of In Progress
- Completion time display for finished tasks in human-readable format
- Timer state preserved during all operations (add, edit, delete tasks)

### User Interface
- Modern dark/light theme toggle with cyberpunk neon aesthetics
- Live clock capsule displaying current time and date
- Responsive design optimized for desktop, tablet, and mobile devices
- Smooth animations and visual feedback for all interactions
- Custom styled scrollbars with color-coded accents
- Enhanced modal dialogs with improved scrolling behavior
- Empty state messages and helpful UI hints

### Google Calendar Integration
- View public holiday calendar in an embedded iframe
- Connect your Google Calendar account via OAuth 2.0 for personal events
- View upcoming calendar events in a side panel
- Read-only access to your primary calendar
- Event details including title, date, time, and location
- Improved iframe styling with glowing borders and hover effects
- Better visibility for event items in both dark and light modes

### Data Persistence
- Automatic localStorage persistence for all tasks and timer states
- Data migration support for backward compatibility with older versions
- Real-world timestamps persisted to track time even when browser is closed
- Storage availability detection with user warnings
- All task data stored locally in browser (no external servers)

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for local development server)

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd KanbanStickyNotes-SimpleCopy
```

2. Open the application in your browser:

Option 1: Direct file access
- Open `index.html` directly in your browser

Option 2: Local server (recommended)
```bash
python3 -m http.server 8000
```
Then navigate to `http://localhost:8000` in your browser

### Production Deployment

The application is deployed on GitHub Pages and accessible at:
[https://thechillbasu.github.io/Kanban-Sticky-Notes/](https://thechillbasu.github.io/Kanban-Sticky-Notes/)

## Project Structure

```
KanbanStickyNotes-SimpleCopy/
├── index.html                     # Main HTML entry point
├── src/
│   ├── css/                       # Modular CSS files
│   │   ├── variables.css          # Design tokens and CSS variables
│   │   ├── base.css               # Base styles and global layout
│   │   ├── headerBase.css         # Header container and components
│   │   ├── headerCalendar.css     # Google Calendar integration styles
│   │   ├── headerThemes.css       # Light mode theme overrides
│   │   ├── headerResponsive.css   # Responsive media queries
│   │   ├── form.css               # Task creation form styles
│   │   ├── board.css              # Kanban board layout with custom scrollbars
│   │   ├── cards.css              # Task card styles and interactions
│   │   ├── priority.css           # Priority badge styles
│   │   ├── modalBase.css          # Base modal styles with custom scrollbars
│   │   ├── detailsViewerModal.css # Task details viewer modal
│   │   ├── detailsEditorModal.css # Task editor modal
│   │   └── utilities.css          # Utility classes and helpers
│   └── js/                        # JavaScript modules
│       ├── main.js                # Application orchestration
│       ├── notes.js               # Notes state and CRUD operations
│       ├── rendering.js           # DOM rendering and element creation
│       ├── modals.js              # Modal dialogs management
│       ├── formatters.js          # Date and time formatting utilities
│       ├── storage.js             # localStorage management
│       ├── dragDrop.js            # Drag and drop functionality
│       ├── timer.js               # Time tracking system
│       ├── theme.js               # Theme switching
│       ├── headerWidgets.js       # Live clock widget
│       └── googleCalendar.js      # Google Calendar OAuth integration
├── package.json
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## How to Use

### Creating Tasks
1. Enter task text in the input field at the top
2. Select a priority level (High, Medium, or Low)
3. Choose the initial column (To Do, In Progress, or Done)
4. Click "Add Note" to open the task editor modal
5. Add optional description and due date
6. Click "Add Task" to create the task

### Managing Tasks
- **Move Tasks**: Click and drag any task card between columns
- **Edit Task**: Click the edit icon (pencil) on any task card
- **View Details**: Click anywhere on a task card to view full details
- **Delete Task**: Click the delete icon (trash) on any task card

### Time Tracking
- Tasks automatically start tracking time when moved to In Progress
- The timer displays elapsed time in real-time (HH:MM:SS format)
- Time tracking continues even when browser is closed (tracks real-world time)
- Time accumulates across multiple sessions and persists through page refreshes
- Timer continues accurately even when adding, editing, or deleting other tasks
- Completed tasks show total time spent in a human-readable format (e.g., "2 hours 15 minutes 30 seconds")

### Google Calendar
1. Click the live clock widget to view the public holiday calendar
2. Click "My Events" button in the header to connect your personal calendar
3. Authorize the application to access your calendar (OAuth 2.0)
4. View your upcoming events with title, date, time, and location
5. Switch between holiday calendar iframe and personal events list

### Theme Switching
- Click the theme toggle button in the header to switch between dark and light modes
- Your preference is automatically saved and persists across sessions

## Technical Details

### Architecture
The application follows a modular architecture with clear separation of concerns:
- **State Management**: Centralized notes state in `notes.js`
- **Rendering**: DOM manipulation isolated in `rendering.js`
- **Modals**: Dialog management in `modals.js`
- **Formatting**: Date/time utilities in `formatters.js`
- **Orchestration**: Main application logic in `main.js`
- **Time Tracking**: TimerManager class in `timer.js` with persistent state
- **Storage**: localStorage operations with migration in `storage.js`
- **Drag & Drop**: HTML5 drag-and-drop API in `dragDrop.js`
- **Theme**: Dark/light mode switching in `theme.js`
- **Event-Driven**: Custom events for cross-module communication

### Browser Compatibility
Works in all modern browsers that support:
- HTML5 Drag and Drop API
- ES6 Modules
- localStorage API
- CSS Grid and Flexbox
- CSS Custom Properties (CSS Variables)

### Storage
All task data is stored locally in the browser's localStorage, including:
- Task details (text, description, priority, due date)
- Time tracking data (timeSpent, inProgressSince, timerStartTime)
- Task metadata (createdAt, lastEditedAt, startedAt, completedAt)

No data is sent to external servers except when using Google Calendar integration (which requires explicit user authorization). The application works completely offline once loaded.

## Development

### Running Tests
```bash
npm test
```

### Code Style
- JavaScript: camelCase for variables and functions, PascalCase for classes
- CSS: camelCase for class names (e.g., `.appHeader`, `.taskCard`, `.priorityBadge`)
- CSS Variables: kebab-case with double dashes (e.g., `--priority-high`, `--bg-card`)
- Comments: File headers and concise single-line comments
- Consistent 2-space indentation throughout
- ES6+ features (arrow functions, template literals, destructuring)

## License

This project is open source and available for educational use. See the LICENSE file for details.

## Contributing

Contributions are welcome. Please ensure your code follows the existing style guidelines and includes appropriate comments.
