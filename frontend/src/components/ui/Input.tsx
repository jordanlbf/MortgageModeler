"use client";

import { forwardRef } from "react";

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md";
  suffix?: string;
}

const BASE_MD =
  "py-3.5 px-4 bg-transparent border border-default rounded-xl text-fg-primary font-[inherit] text-base font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-brand/40";

const BASE_SM =
  "flex-1 min-w-0 text-[13px] py-1.5 px-2.5 bg-transparent border border-default rounded-xl text-fg-primary font-[inherit] font-medium tabular-nums transition-[border-color] duration-200 focus:outline-none focus:border-brand/40";

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { size = "md", suffix, className, type = "text", ...rest },
  ref,
) {
  const base = size === "sm" ? BASE_SM : BASE_MD;
  const cls = [base, suffix ? "pr-10 w-full" : "", className ?? ""].filter(Boolean).join(" ");

  if (suffix) {
    return (
      <div className="relative">
        <input ref={ref} type={type} className={cls} {...rest} />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-medium text-fg-tertiary pointer-events-none">
          {suffix}
        </span>
      </div>
    );
  }

  return <input ref={ref} type={type} className={cls} {...rest} />;
});

export default Input;
