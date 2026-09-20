export const THEMES = [
  { id: "pink", name: "핑크", label: "핑크 · 로즈" },
  { id: "ivory", name: "아이보리", label: "아이보리 · 오렌지" },
  { id: "mint", name: "민트", label: "민트 · 청록" },
  { id: "sky", name: "하늘", label: "하늘 · 파랑" },
  { id: "lime", name: "라임", label: "라임 · 올리브" },
  { id: "gray", name: "그레이", label: "그레이 · 차콜" },
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
