"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage can be unavailable (e.g. private mode) — theme just
      // won't persist across reloads, which is fine.
    }
  }

  return (
    <button
      onClick={toggle}
      className="border border-line px-3 py-1.5 text-xs text-ink hover:bg-line/40 transition-colors"
      aria-label="Toggle color theme"
    >
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
