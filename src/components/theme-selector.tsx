"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
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

function layerPosition(button: HTMLButtonElement): CSSProperties {
  const rect = button.getBoundingClientRect();
  const width = Math.min(288, window.innerWidth - 24);
  const top = Math.max(12, rect.bottom + 10);
  return {
    width,
    top,
    left: Math.max(
      12,
      Math.min(rect.right - width, window.innerWidth - width - 12),
    ),
    maxHeight: Math.max(0, window.innerHeight - top - 12),
  };
}

export function ThemeSelector() {
  const theme = useSyncExternalStore(
    subscribe,
    currentTheme,
    () => DEFAULT_THEME,
  );
  const selected = THEMES.find((option) => option.id === theme)!;
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const initialFocus = useRef(0);
  const menuId = useId();
  const [position, setPosition] = useState<CSSProperties | null>(null);
  const open = position !== null;

  const closeMenu = useCallback((restoreFocus = true) => {
    setPosition(null);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
  }, []);

  function openMenu(index = 0) {
    if (!trigger.current) return;
    initialFocus.current = index;
    setPosition(layerPosition(trigger.current));
  }

  useEffect(() => {
    if (!open) return;
    menu.current
      ?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')
      [initialFocus.current]?.focus();
    function outside(event: Event) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target))
        closeMenu(false);
    }
    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeMenu();
    }
    function onResize() {
      if (trigger.current) setPosition(layerPosition(trigger.current));
    }
    function onScroll(event: Event) {
      if (
        !(event.target instanceof Node) ||
        !menu.current?.contains(event.target)
      )
        closeMenu(false);
    }
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", onEscape);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", onEscape);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, closeMenu]);

  function navigateMenu(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab") {
      closeMenu();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="menuitemradio"]',
      ),
    );
    const index = items.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
    items[next]?.focus();
  }

  return (
    <div className="theme-selector">
      <button
        ref={trigger}
        type="button"
        className="theme-trigger"
        aria-label={`색상 테마: ${selected.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          openMenu(event.key === "ArrowUp" ? THEMES.length - 1 : 0);
        }}
      >
        <span className="theme-trigger-swatch" aria-hidden="true" />
        <span>{selected.name}</span>
        <ChevronDown size={13} className="theme-chevron" aria-hidden="true" />
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={menuId}
            className="theme-layer"
            style={position}
            role="menu"
            aria-labelledby={`${menuId}-title`}
            onKeyDown={navigateMenu}
          >
            <p className="theme-layer-title" id={`${menuId}-title`}>
              테마 선택
            </p>
            {THEMES.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-label={option.label}
                aria-checked={theme === option.id}
                tabIndex={-1}
                className="theme-option"
                onClick={() => {
                  changeTheme(option.id);
                  closeMenu();
                }}
              >
                <span
                  className="theme-option-swatch theme-palette"
                  data-theme={option.id}
                  aria-hidden="true"
                >
                  <span>Aa</span>
                  <i />
                </span>
                <span className="theme-option-name">{option.label}</span>
                <span className="theme-option-check" aria-hidden="true">
                  {theme === option.id && <Check size={12} strokeWidth={2.5} />}
                </span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
