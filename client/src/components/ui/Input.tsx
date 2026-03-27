import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export const inputFieldClasses =
  "w-full rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-50";

export type InputSize = "sm" | "md";

const paddingBySize: Record<InputSize, string> = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2",
};

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  inputSize?: InputSize;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className = "", inputSize = "md", ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(inputFieldClasses, paddingBySize[inputSize], className)}
      {...props}
    />
  );
});
