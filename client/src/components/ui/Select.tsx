import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { inputFieldClasses } from "./Input";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  inputSize?: "sm" | "md";
};

const paddingBySize = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5",
} as const;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", inputSize = "md", ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(inputFieldClasses, paddingBySize[inputSize], "bg-white", className)}
      {...props}
    />
  );
});
