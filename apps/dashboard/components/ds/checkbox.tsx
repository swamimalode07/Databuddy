"use client";

import { cn } from "@/lib/utils";
import { Checkbox as BaseCheckbox } from "@base-ui-components/react/checkbox";
import { Check } from "@phosphor-icons/react/dist/ssr";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type CheckboxProps = ComponentPropsWithoutRef<typeof BaseCheckbox.Root> & {
	label?: ReactNode;
	description?: ReactNode;
};

export function Checkbox({
	className,
	label,
	description,
	...rest
}: CheckboxProps) {
	const control = (
		<BaseCheckbox.Root
			className={cn(
				"inline-flex size-4 shrink-0 cursor-pointer select-none items-center justify-center rounded-sm",
				"bg-secondary",
				"transition-all duration-(--duration-quick) ease-(--ease-smooth)",
				"data-checked:bg-primary data-checked:text-primary-foreground",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
				"disabled:cursor-not-allowed disabled:opacity-50",
				!label && className
			)}
			{...rest}
		>
			<BaseCheckbox.Indicator className="flex items-center justify-center text-current">
				<Check className="size-3" />
			</BaseCheckbox.Indicator>
		</BaseCheckbox.Root>
	);

	if (!label) {
		return control;
	}

	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: this is a control
		<label
			className={cn("group flex cursor-pointer select-none gap-2", className)}
		>
			<span className="flex h-5 items-center">{control}</span>
			<span className="flex flex-col gap-0.5">
				<span className="font-medium text-foreground text-xs">{label}</span>
				{description ? (
					<span className="text-[11px] text-muted-foreground">
						{description}
					</span>
				) : null}
			</span>
		</label>
	);
}
