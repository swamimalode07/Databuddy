"use client";

interface Session {
	country: string;
	current_page: string;
	device_type: string;
	last_seen: string;
	pages_viewed: number;
	session_id: string;
}

interface SessionListProps {
	sessions: Session[];
}

export function SessionList({ sessions }: SessionListProps) {
	if (sessions.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-[10px] text-foreground/40">
				No active sessions
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col gap-1 overflow-y-auto p-2">
			{sessions.map((s) => {
				const seconds = Math.floor(
					(Date.now() - new Date(s.last_seen).getTime()) / 1000,
				);
				const ago =
					seconds < 10
						? "just now"
						: seconds < 60
							? `${seconds}s ago`
							: `${Math.floor(seconds / 60)}m ago`;

				return (
					<div
						className="rounded border border-border/30 bg-background/50 px-2.5 py-2"
						key={s.session_id}
					>
						<div className="flex items-center gap-1.5">
							<span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-4)]" />
							<span className="min-w-0 flex-1 truncate text-[11px] font-bold text-foreground">
								{s.current_page || "/"}
							</span>
						</div>
						<div className="mt-1 flex items-center gap-2 text-[9px] text-foreground/50">
							<span>{s.country}</span>
							<span>·</span>
							<span>{s.device_type || "desktop"}</span>
							<span>·</span>
							<span>{s.pages_viewed} pages</span>
							<span>·</span>
							<span>{ago}</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}
