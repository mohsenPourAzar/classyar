export function readAppearance() {
  const fonts = ["vazirmatn", "iran-sans", "parastoo"];
  let theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  let font = "vazirmatn";
  try {
    const savedTheme = localStorage.getItem("classyar-theme-v2");
    const savedFont = localStorage.getItem("classyar-font-v2");
    if (["light", "dark"].includes(savedTheme)) theme = savedTheme;
    if (fonts.includes(savedFont)) font = savedFont;
  } catch {}
  return { theme, font };
}

export function applyAppearance({ theme, font }) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.font = font;
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) color.content = theme === "dark" ? "#101827" : "#f5f7fc";
}

export const appearanceScript = `(${applyAppearance.toString()})((${readAppearance.toString()})());`;
