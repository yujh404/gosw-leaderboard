"use client";

import { useSyncExternalStore } from "react";
import { Palette } from "lucide-react";
import {
  DEFAULT_THEME,
  isTheme,
  THEMES,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

const themeChanged = "gosw-theme-change";

function currentTheme(): Theme {
  const value = document.documentElement.dataset.theme;
  return isTheme(value) ? value : DEFAULT_THEME;
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (
      event.storageArea !== localStorage ||
      (event.key !== THEME_STORAGE_KEY && event.key !== null)
    )
      return;
    document.documentElement.dataset.theme = isTheme(event.newValue)
      ? event.newValue
      : DEFAULT_THEME;
    onChange();
  }
  window.addEventListener(themeChanged, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(themeChanged, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function changeTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be disabled; the selected theme still works for this page.
  }
  window.dispatchEvent(new Event(themeChanged));
}

export function ThemeSelector() {
  const theme = useSyncExternalStore(
    subscribe,
    currentTheme,
    () => DEFAULT_THEME,
  );
  return (
    <label className="theme-selector">
      <Palette size={15} aria-hidden="true" />
      <select
        aria-label="색상 테마"
        value={theme}
        onChange={(event) => {
          if (isTheme(event.target.value)) changeTheme(event.target.value);
        }}
      >
        {THEMES.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
