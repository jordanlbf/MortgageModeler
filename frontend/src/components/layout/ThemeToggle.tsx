"use client";

import { useState } from "react";
import "./ThemeToggle.css";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <span className={`theme-label ${theme === "dark" ? "active" : ""}`}>DARK</span>
      <button
        className={`theme-switch ${theme === "light" ? "theme-switch--light" : ""}`}
        onClick={toggle}
        role="switch"
        aria-checked={theme === "light"}
        title="Toggle theme"
      >
        <span className="theme-knob" />
      </button>
      <span className={`theme-label ${theme === "light" ? "active" : ""}`}>LIGHT</span>
    </div>
  );
}
