"use client";

interface VelocityBarsProps {
	data: Array<{ minute: string; pageviews: number; events: number }>;
}

export function VelocityBars({ data }: VelocityBarsProps) {
	if (data.length === 0) {
		return null;
	}

	const max = Math.max(...data.map((d) => d.pageviews + d.events), 1);
	const barCount = data.length;

	return (
		<div className="flex h-full items-end gap-px">
			{data.map((d, i) => {
				const viewsHeight = (d.pageviews / max) * 100;
				const eventsHeight = (d.events / max) * 100;
				const isRecent = i >= barCount - 3;

				return (
					<div
						className="flex flex-1 flex-col justify-end"
						key={d.minute}
						title={`${d.pageviews} views, ${d.events} events`}
					>
						{eventsHeight > 0 && (
							<div
								className="w-full bg-[var(--chart-1)]"
								style={{
									height: `${eventsHeight}%`,
									opacity: isRecent ? 1 : 0.5,
								}}
							/>
						)}
						<div
							className="w-full bg-[var(--chart-4)]"
							style={{
								height: `${viewsHeight}%`,
								opacity: isRecent ? 1 : 0.5,
							}}
						/>
					</div>
				);
			})}
		</div>
	);
}
