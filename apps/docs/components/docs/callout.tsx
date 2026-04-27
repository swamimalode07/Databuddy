import {
	CheckCircleIcon,
	InfoIcon,
	LightbulbIcon,
	WarningCircleIcon,
	XCircleIcon,
} from "@databuddy/ui/icons";
import { cn } from "@databuddy/ui";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

const calloutVariants = cva(
	"my-4 flex items-start gap-3 rounded-lg border border-border/60 border-l-4 bg-card p-4 text-card-foreground",
	{
		variants: {
			type: {
				info: "border-l-blue-500",
				success: "border-l-green-500",
				warn: "border-l-yellow-500",
				error: "border-l-red-500",
				tip: "border-l-purple-500",
				note: "border-l-border",
			},
		},
		defaultVariants: {
			type: "info",
		},
	}
);

const iconVariants = cva("mt-0.5 size-5 shrink-0", {
	variants: {
		type: {
			info: "text-blue-500",
			success: "text-green-500",
			warn: "text-yellow-500",
			error: "text-red-500",
			tip: "text-purple-500",
			note: "text-muted-foreground",
		},
	},
	defaultVariants: {
		type: "info",
	},
});

const iconMap = {
	info: InfoIcon,
	success: CheckCircleIcon,
	warn: WarningCircleIcon,
	error: XCircleIcon,
	tip: LightbulbIcon,
	note: InfoIcon,
};

interface CalloutProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof calloutVariants> {
	title?: string;
}

function Callout({
	className,
	type = "info",
	title,
	children,
	...props
}: CalloutProps) {
	const Icon = iconMap[type as keyof typeof iconMap] || iconMap.info;

	return (
		<div
			className={cn(calloutVariants({ type }), className)}
			role="alert"
			{...props}
		>
			<Icon className={cn(iconVariants({ type }))} weight="duotone" />
			<div className="min-w-0 flex-1">
				{title && (
					<div className="mb-1 font-semibold text-foreground text-sm">
						{title}
					</div>
				)}
				<div className="text-muted-foreground text-sm [&_p]:leading-relaxed">
					{children}
				</div>
			</div>
		</div>
	);
}

export { Callout };
