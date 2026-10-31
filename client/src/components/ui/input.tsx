import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const fieldClassName =
  "min-h-12 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-muted shadow-sm transition focus:border-focus focus:outline-none focus:ring-4 focus:ring-focus/10 disabled:cursor-not-allowed disabled:bg-sand/60 disabled:text-muted";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClassName, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClassName, "min-h-32 resize-y", className)} {...props} />;
}
