import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  elevated = false,
  bordered = true,
  className = "",
  ...props
}) => {
  const elevatedClass = elevated ? "bh-card--elevated" : "";
  const borderClass = bordered ? "bh-card--bordered" : "";

  return (
    <div
      className={`bh-card ${elevatedClass} ${borderClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};
