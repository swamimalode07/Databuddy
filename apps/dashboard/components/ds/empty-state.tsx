import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
	icon?: ReactNode;
	title: string;
	description?: string;
	action?: ReactNode;
};

export function EmptyState({
	className,
	icon,
	title,
	description,
	action,
	...rest
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-1 flex-col items-center justify-center gap-3 text-center",
				className
			)}
			{...rest}
		>
			{icon ? (
				<span className="text-muted-foreground [&>svg]:size-10">{icon}</span>
			) : null}
			<div className="flex flex-col gap-1">
				<p className="font-medium text-foreground text-sm">{title}</p>
				{description ? (
					<p className="max-w-xs text-muted-foreground text-sm">
						{description}
					</p>
				) : null}
			</div>
			{action ? <div className="pt-1">{action}</div> : null}
		</div>
	);
}
