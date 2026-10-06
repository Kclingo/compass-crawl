const STORAGE_KEY = 'compass-theme';

export function getStoredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(STORAGE_KEY, theme);
}

// Applies the saved (or system) theme without recording a choice of its own.
export function applyStoredTheme() {
  document.documentElement.classList.toggle('dark', getStoredTheme() === 'dark');
}