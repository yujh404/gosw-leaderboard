export const THEMES = [
  { id: "pink", label: "핑크 · 로즈" },
  { id: "ivory", label: "아이보리 · 오렌지" },
  { id: "mint", label: "민트 · 청록" },
  { id: "sky", label: "하늘 · 파랑" },
  { id: "lime", label: "라임 · 올리브" },
  { id: "gray", label: "그레이 · 차콜" },
] as const;

export type Theme = (typeof THEMES)[number]["id"];
export const DEFAULT_THEME: Theme = "pink";
export const THEME_STORAGE_KEY = "gosw-theme-v1";

export function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme.id === value);
}

// Only validated theme IDs from local preferences reach the HTML attribute.
export const themeInitScript = `(() => {
  let theme = ${JSON.stringify(DEFAULT_THEME)};
  try {
    const saved = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (${JSON.stringify(THEMES.map((theme) => theme.id))}.includes(saved)) theme = saved;
  } catch {}
  document.documentElement.dataset.theme = theme;
})();`;
