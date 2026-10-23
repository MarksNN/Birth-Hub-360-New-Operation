import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}) => {
  const baseClasses = "bh-btn";
  const variantClass = `bh-btn--${variant}`;
  const sizeClass = `bh-btn--${size}`;
  const loadingClass = isLoading ? "bh-btn--loading" : "";

  return (
    <button
      className={`${baseClasses} ${variantClass} ${sizeClass} ${loadingClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? <span className="bh-spinner" aria-hidden="true" /> : null}
      <span className="bh-btn-content">{children}</span>
    </button>
  );
};
