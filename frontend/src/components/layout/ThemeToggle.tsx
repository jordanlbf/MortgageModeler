"use client";

import { useEffect, useState } from "react";
import "./ThemeToggle.css";

type Theme = "dark" | "indigo";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("theme") as Theme) === "indigo" ? "indigo" : "dark";
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
    const next: Theme = theme === "dark" ? "indigo" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <span className={`theme-label ${theme === "dark" ? "active" : ""}`}>GRAPHITE</span>
      <button
        className={`theme-switch ${theme === "indigo" ? "theme-switch--indigo" : ""}`}
        onClick={toggle}
        role="switch"
        aria-checked={theme === "indigo"}
        title="Toggle theme"
      >
        <span className="theme-knob" />
      </button>
      <span className={`theme-label ${theme === "indigo" ? "active" : ""}`}>INDIGO</span>
    </div>
  );
}
