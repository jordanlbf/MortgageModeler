"use client";

import { useEffect, useState } from "react";
import "./ThemeToggle.css";

type Theme = "dark" | "coral";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("theme") as Theme) === "coral" ? "coral" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "coral" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <span className={`theme-label ${theme === "dark" ? "active" : ""}`}>GRAPHITE</span>
      <button
        className={`theme-switch ${theme === "coral" ? "theme-switch--coral" : ""}`}
        onClick={toggle}
        role="switch"
        aria-checked={theme === "coral"}
        title="Toggle theme"
      >
        <span className="theme-knob" />
      </button>
      <span className={`theme-label ${theme === "coral" ? "active" : ""}`}>CORAL</span>
    </div>
  );
}
