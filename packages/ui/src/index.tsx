import * as React from "react";

type ClassNameProps = {
  className?: string;
};

export function cn(...parts: Array<string | undefined | false | null>) {
  return parts.filter(Boolean).join(" ");
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
  },
) {
  const { className, variant = "primary", ...rest } = props;
  return (
    <button
      className={cn("ui-button", `ui-button-${variant}`, className)}
      {...rest}
    />
  );
}

export function Card(
  props: React.HTMLAttributes<HTMLDivElement> & ClassNameProps,
) {
  return <div {...props} className={cn("ui-card", props.className)} />;
}

export function Field(
  props: React.LabelHTMLAttributes<HTMLLabelElement> & ClassNameProps,
) {
  return <label {...props} className={cn("ui-field", props.className)} />;
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & ClassNameProps,
) {
  return <input {...props} className={cn("ui-input", props.className)} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & ClassNameProps,
) {
  return <textarea {...props} className={cn("ui-textarea", props.className)} />;
}
