export function readAppearance() {
  let theme = window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  try {
    const savedTheme = localStorage.getItem("classyar-theme-v2");
    if (["light", "dark"].includes(savedTheme)) theme = savedTheme;
  } catch {}
  return { theme };
}

export function applyAppearance({ theme }) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.font = "parastoo";
  const color = document.querySelector('meta[name="theme-color"]');
  if (color) color.content = theme === "dark" ? "#0b1220" : "#f6f8fc";
}

export const appearanceScript = `(${applyAppearance.toString()})((${readAppearance.toString()})());`;
