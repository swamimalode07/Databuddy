"use client";

import { cn } from "@/lib/utils";
import { useFieldContext } from "@/components/ds/field";
import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, id, ...rest }: TextareaProps) {
	const field = useFieldContext();

	return (
		<textarea
			aria-describedby={
				field
					? [field.error && field.errorId, field.descriptionId]
							.filter(Boolean)
							.join(" ") || undefined
					: undefined
			}
			aria-invalid={field?.error || undefined}
			className={cn(
				"flex min-h-20 w-full resize-y rounded-md bg-secondary px-3 py-2 text-foreground text-xs",
				"placeholder:text-muted-foreground",
				"transition-colors duration-(--duration-quick) ease-(--ease-smooth)",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
				"disabled:cursor-not-allowed disabled:opacity-50",
				field?.error &&
					"ring-2 ring-destructive/60 focus-visible:ring-destructive/60",
				className
			)}
			id={id ?? field?.id}
			{...rest}
		/>
	);
}
