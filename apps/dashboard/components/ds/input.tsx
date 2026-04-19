"use client";

import { useFieldContext } from "@/components/ds/field";
import { cn } from "@/lib/utils";
import { Input as BaseInput } from "@base-ui-components/react/input";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type InputProps = Omit<ComponentPropsWithoutRef<typeof BaseInput>, "prefix"> & {
	prefix?: ReactNode;
	suffix?: ReactNode;
};

export function Input({ className, id, prefix, suffix, ...rest }: InputProps) {
	const field = useFieldContext();

	const ariaDescribedBy = field
		? [field.error && field.errorId, field.descriptionId]
				.filter(Boolean)
				.join(" ") || undefined
		: undefined;

	const errorRing =
		field?.error &&
		"ring-2 ring-destructive/60 focus-within:ring-destructive/60";

	if (prefix || suffix) {
		return (
			<div
				className={cn(
					"flex h-8 w-full items-center rounded-md bg-secondary",
					"transition-colors duration-(--duration-quick) ease-(--ease-smooth)",
					"focus-within:ring-2 focus-within:ring-ring/60",
					"has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
					errorRing,
					className
				)}
			>
				{prefix && (
					<span className="flex shrink-0 items-center self-stretch rounded-l-md bg-muted px-3 text-muted-foreground text-xs">
						{prefix}
					</span>
				)}
				<BaseInput
					aria-describedby={ariaDescribedBy}
					aria-invalid={field?.error || undefined}
					className="h-full min-w-0 flex-1 bg-transparent px-3 text-foreground text-xs placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed"
					id={id ?? field?.id}
					{...rest}
				/>
				{suffix && (
					<span className="flex shrink-0 items-center self-stretch rounded-r-md bg-muted px-3 text-muted-foreground text-xs">
						{suffix}
					</span>
				)}
			</div>
		);
	}

	return (
		<BaseInput
			aria-describedby={ariaDescribedBy}
			aria-invalid={field?.error || undefined}
			className={cn(
				"flex h-8 w-full rounded-md bg-secondary px-3 text-foreground text-xs",
				"placeholder:text-muted-foreground",
				"transition-colors duration-(--duration-quick) ease-(--ease-smooth)",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
				"disabled:cursor-not-allowed disabled:opacity-50",
				errorRing,
				className
			)}
			id={id ?? field?.id}
			{...rest}
		/>
	);
}
