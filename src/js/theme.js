// Theme Management System
// 
// Handles dark/light mode theme switching with automatic persistence to localStorage.
// Detects system theme preference on first visit and allows manual override.
// Updates UI elements (icons, labels) when theme changes. Listens for system theme
// changes and auto-switches if user hasn't manually selected a theme.

const THEME_STORAGE_KEY = "kanban-theme";

// Get user's preferred theme from storage or system preference
function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  
  // Check system preference
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  
  return "light";
}

// Apply theme to the page and update UI
function applyTheme(theme) {
  const isDark = theme === "dark";
  
  // Toggle dark mode class on body
  document.body.classList.toggle("dark-mode", isDark);
  
  // Set data attribute for additional styling
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  
  // Update theme toggle button
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  
  const icon = btn.querySelector("i");
  const label = btn.querySelector(".theme-toggle__label");
  
  if (icon) {
    icon.className = isDark ? "fas fa-sun" : "fas fa-moon";
  }
  if (label) {
    label.textContent = isDark ? "Light mode" : "Dark mode";
  }
}

// Save theme preference and apply it
function setTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

// Toggle between light and dark themes
function toggleTheme() {
  const current = getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
}

// Initialize theme on page load
document.addEventListener("DOMContentLoaded", () => {
  const initial = getPreferredTheme();
  applyTheme(initial);
  
  // Attach click handler to theme toggle button
  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", toggleTheme);
  }
  
  // Listen for system theme changes
  if (window.matchMedia) {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (event) => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      // Only auto-switch if user hasn't manually chosen a theme
      if (stored === "light" || stored === "dark") {
        return;
      }
      applyTheme(event.matches ? "dark" : "light");
    };
    
    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else if (media.addListener) {
      media.addListener(handleChange);
    }
  }
});
