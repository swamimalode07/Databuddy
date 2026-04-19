"use client";

import { cn } from "@/lib/utils";
import { Popover as BasePopover } from "@base-ui-components/react/popover";
import type { ComponentPropsWithoutRef } from "react";

function Root(props: ComponentPropsWithoutRef<typeof BasePopover.Root>) {
	return <BasePopover.Root {...props} />;
}

function Trigger({
	className,
	...rest
}: ComponentPropsWithoutRef<typeof BasePopover.Trigger>) {
	return (
		<BasePopover.Trigger
			className={cn("cursor-pointer", className)}
			{...rest}
		/>
	);
}

function Content({
	className,
	children,
	side = "bottom",
	...rest
}: ComponentPropsWithoutRef<typeof BasePopover.Popup> & {
	side?: ComponentPropsWithoutRef<typeof BasePopover.Positioner>["side"];
}) {
	return (
		<BasePopover.Portal>
			<BasePopover.Positioner className="z-50" side={side} sideOffset={6}>
				<BasePopover.Popup
					className={cn(
						"w-72 rounded-lg border border-border/60 bg-popover p-4",
						"transition-all duration-(--duration-quick) ease-(--ease-smooth)",
						"data-starting-style:scale-95 data-starting-style:opacity-0",
						"data-ending-style:scale-95 data-ending-style:opacity-0",
						"origin-(--transform-origin)",
						className
					)}
					{...rest}
				>
					{children}
				</BasePopover.Popup>
			</BasePopover.Positioner>
		</BasePopover.Portal>
	);
}

function Title({
	className,
	...rest
}: ComponentPropsWithoutRef<typeof BasePopover.Title>) {
	return (
		<BasePopover.Title
			className={cn("font-semibold text-foreground text-xs", className)}
			{...rest}
		/>
	);
}

function Description({
	className,
	...rest
}: ComponentPropsWithoutRef<typeof BasePopover.Description>) {
	return (
		<BasePopover.Description
			className={cn("text-[11px] text-muted-foreground", className)}
			{...rest}
		/>
	);
}

function Close(props: ComponentPropsWithoutRef<typeof BasePopover.Close>) {
	return <BasePopover.Close {...props} />;
}

export const Popover = Object.assign(Root, {
	Trigger,
	Content,
	Title,
	Description,
	Close,
});
