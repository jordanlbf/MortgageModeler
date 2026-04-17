"use client";

import { useSyncExternalStore } from "react";
import "./ThemeToggle.css";

type Theme = "dark" | "arctic";

const THEME_EVENT = "theme-change";

function subscribe(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): Theme {
  return (localStorage.getItem("theme") as Theme) === "arctic" ? "arctic" : "dark";
}

function getServerSnapshot(): Theme {
  return "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    applyTheme(theme === "dark" ? "arctic" : "dark");
  };

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <span className={`theme-label ${theme === "dark" ? "active" : ""}`}>GRAPHITE</span>
      <button
        className={`theme-switch ${theme === "arctic" ? "theme-switch--arctic" : ""}`}
        onClick={toggle}
        role="switch"
        aria-checked={theme === "arctic"}
        title="Toggle theme"
      >
        <span className="theme-knob" />
      </button>
      <span className={`theme-label ${theme === "arctic" ? "active" : ""}`}>ARCTIC</span>
    </div>
  );
}
