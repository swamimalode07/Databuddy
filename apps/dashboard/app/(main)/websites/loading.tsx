import { Skeleton } from "@/components/ui/skeleton";

export default function WebsitesLoading() {
	return (
		<div className="flex h-full flex-col">
			{/* Page header skeleton */}
			<div className="relative flex min-h-[88px] shrink-0 items-center justify-between gap-2 border-b p-3 sm:p-4">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<Skeleton className="size-11 shrink-0 rounded-lg" />
					<div className="min-w-0 flex-1 space-y-1.5">
						<Skeleton className="h-7 w-32 rounded" />
						<Skeleton className="h-4 w-56 rounded" />
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Skeleton className="size-9 rounded-md" />
					<Skeleton className="h-9 w-32 rounded-md" />
				</div>
			</div>

			{/* Grid skeleton */}
			<div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
				<div className="grid select-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{Array.from({ length: 6 }, (_, i) => (
						<div
							className="animate-pulse overflow-hidden rounded-xl border bg-card pt-0"
							key={i}
						>
							<div className="border-b bg-accent px-3 pt-4 pb-0">
								<Skeleton className="mx-auto h-24 w-full rounded sm:h-28" />
							</div>
							<div className="px-4 py-3">
								<div className="flex items-center gap-3">
									<Skeleton className="size-7 shrink-0 rounded" />
									<div className="flex min-w-0 flex-1 items-center justify-between gap-2">
										<div className="flex flex-col gap-1">
											<Skeleton className="h-3.5 w-24 rounded" />
											<Skeleton className="h-3 w-32 rounded" />
										</div>
										<div className="flex flex-col items-end gap-1">
											<Skeleton className="h-3 w-12 rounded" />
											<Skeleton className="h-2.5 w-8 rounded" />
										</div>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
