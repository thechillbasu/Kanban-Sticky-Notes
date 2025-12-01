// ==========================================
// Theme management & Dark Mode system
// Implemented by Sarthak Sharma
// ==========================================

const THEME_STORAGE_KEY = "kanban-theme";

/**
 * Decide which theme should be active:
 * 1. If user chose before -> use stored
 * 2. Else follow system preference
 * 3. Fallback to light
 */
function getPreferredTheme() {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

/**
 * Apply theme to DOM (HTML + body) and update button UI
 */
function applyTheme(theme) {
  const isDark = theme === "dark";

  // Hook for CSS you wrote (body.dark-mode {...})
  document.body.classList.toggle("dark-mode", isDark);

  // Optional: keep html[data-theme] for future theming
  if (isDark) {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

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

/**
 * Persist theme choice and apply it
 */
function setTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

/**
 * Switch between light and dark
 */
function toggleTheme() {
  const current = getPreferredTheme();
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
}

/**
 * Initialise on page load
 */
document.addEventListener("DOMContentLoaded", () => {
  const initial = getPreferredTheme();
  applyTheme(initial);

  const btn = document.getElementById("themeToggle");
  if (btn) {
    btn.addEventListener("click", toggleTheme);
  }

  // Optional: react to system theme changes if user hasn't chosen manually
  if (window.matchMedia) {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (event) => {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        // user already chose; don't override
        return;
      }
      applyTheme(event.matches ? "dark" : "light");
    };

    if (media.addEventListener) {
      media.addEventListener("change", handleChange);
    } else if (media.addListener) {
      // older browsers
      media.addListener(handleChange);
    }
  }
});
