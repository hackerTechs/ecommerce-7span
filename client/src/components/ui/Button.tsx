import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../../utils/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "dangerSoft"
  | "dangerLink"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
  secondary:
    "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  danger: "bg-red-600 text-white hover:bg-red-700",
  dangerSoft: "text-red-600 hover:bg-red-50 border border-transparent",
  dangerLink: "border-0 bg-transparent text-red-600 shadow-none hover:text-red-800",
  outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-md",
  md: "px-4 py-2 text-sm rounded-lg font-medium",
  lg: "px-8 py-3 rounded-lg font-semibold",
};

export function buttonClassNames(options: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  const { variant = "primary", size = "md", fullWidth = false, className = "" } = options;
  return cn(
    "inline-flex items-center justify-center transition",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    type = "button",
    disabled,
    ...props
  },
  ref,
) {
  const isLinkStyle = variant === "dangerLink";

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center transition disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        !isLinkStyle && sizeClasses[size],
        isLinkStyle && "min-h-0 px-0 py-0 text-sm font-medium",
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
});
