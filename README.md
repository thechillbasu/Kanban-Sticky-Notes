# Kanban Sticky Notes Board

A modern task management app built with vanilla HTML, CSS, and JavaScript. Organize tasks across three columns using drag-and-drop sticky notes with automatic browser storage.

## Features

- Drag-and-drop task management across To Do, In Progress, and Done columns
- Priority levels (High, Medium, Low) with visual indicators
- Task descriptions and due dates with color-coded alerts
- Time tracking for tasks in progress
- Dark/Light theme toggle
- Responsive design for desktop, tablet, and mobile
- Automatic localStorage persistence

## Getting Started

Open `public/index.html` in your browser or run a local server:

```bash
python3 -m http.server 8000
```

Then navigate to `http://localhost:8000/public/`

## Project Structure

```
kanban-board/
├── public/
│   └── index.html           # Main HTML entry point
├── src/
│   ├── css/                 # Modular CSS files
│   │   ├── variables.css    # Design tokens
│   │   ├── base.css         # Base styles
│   │   ├── header.css       # Header component
│   │   ├── form.css         # Form styles
│   │   ├── board.css        # Kanban board layout
│   │   ├── cards.css        # Task card styles
│   │   ├── priority.css     # Priority badges
│   │   ├── modalBase.css    # Modal base styles
│   │   ├── detailsViewerModal.css
│   │   ├── detailsEditorModal.css
│   │   └── utilities.css    # Utility classes
│   └── js/                  # JavaScript modules
│       ├── main.js          # Core app logic
│       ├── storage.js       # localStorage management
│       ├── dragDrop.js      # Drag and drop
│       ├── timer.js         # Time tracking
│       ├── theme.js         # Theme switching
│       └── liveCapsule.js   # Live clock
├── package.json
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## How to Use

1. **Add Task**: Enter text, select priority and column, click "Add Note"
2. **Move Tasks**: Drag and drop between columns
3. **Edit Task**: Click the edit icon or click on the card
4. **Delete Task**: Click the trash icon
5. **View Details**: Click on any task card to see full details
6. **Toggle Theme**: Click the theme button in the header

## Browser Support

Works in all modern browsers supporting HTML5, ES6, localStorage, and CSS Grid/Flexbox.

## License

Open source and available for educational use.
