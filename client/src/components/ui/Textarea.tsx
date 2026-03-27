import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/cn";
import { inputFieldClasses } from "./Input";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  inputSize?: "sm" | "md";
};

const paddingBySize = {
  sm: "px-3 py-2 text-sm",
  md: "px-3 py-2",
} as const;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className = "", inputSize = "md", ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(inputFieldClasses, paddingBySize[inputSize], "resize-y min-h-[5rem]", className)}
      {...props}
    />
  );
});
