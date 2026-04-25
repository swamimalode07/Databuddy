"use client";

import { CircleNotchIcon } from "@/components/icons/nucleo";
import { cn } from "../../lib/utils";

export const Spinner = ({ className }: { className?: string }) => {
	return (
		<CircleNotchIcon
			className={cn("animate-spin text-muted-foreground", className)}
		/>
	);
};
