"use client";

import { useTheme } from "next-themes";

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    const activeTheme = (theme === "system" ? resolvedTheme : theme) ?? "light";
    const nextTheme = activeTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed bottom-4 right-4 z-50 h-11 w-11 rounded-full border border-slate-300 bg-background/95 text-xl text-foreground shadow-md backdrop-blur-sm transition hover:scale-105"
      aria-label="Cambiar tema claro u oscuro"
      title="Cambiar tema"
    >
      🌙
    </button>
  );
}