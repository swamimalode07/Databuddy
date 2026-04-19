"use client";

import { cn } from "@/lib/utils";
import { Switch as BaseSwitch } from "@base-ui-components/react/switch";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type SwitchProps = ComponentPropsWithoutRef<typeof BaseSwitch.Root> & {
	label?: ReactNode;
	description?: ReactNode;
};

export function Switch({
	className,
	label,
	description,
	...rest
}: SwitchProps) {
	const control = (
		<BaseSwitch.Root
			className={cn(
				"inline-flex h-5 w-9 shrink-0 cursor-pointer select-none items-center rounded-full p-0.5",
				"bg-secondary",
				"transition-colors duration-(--duration-quick) ease-(--ease-smooth)",
				"data-checked:bg-primary",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
				"disabled:cursor-not-allowed disabled:opacity-50",
				!label && className
			)}
			{...rest}
		>
			<BaseSwitch.Thumb
				className={cn(
					"pointer-events-none block size-4 rounded-full bg-foreground shadow-xs",
					"transition-all duration-(--duration-quick) ease-(--ease-smooth)",
					"data-unchecked:translate-x-0",
					"data-checked:translate-x-4 data-checked:bg-primary-foreground"
				)}
			/>
		</BaseSwitch.Root>
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
