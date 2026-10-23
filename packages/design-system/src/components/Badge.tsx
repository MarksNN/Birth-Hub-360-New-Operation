import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "info" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "info",
  size = "md",
  className = "",
  ...props
}) => {
  return (
    <span
      className={`bh-badge bh-badge--${variant} bh-badge--${size} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};
