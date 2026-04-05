import { Skeleton } from "@/components/ui/skeleton";

export default function MainLoading() {
	return (
		<div className="flex h-full flex-col">
			{/* Page header skeleton */}
			<div className="relative flex min-h-[88px] shrink-0 items-center justify-between gap-2 border-b p-3 sm:p-4">
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<Skeleton className="size-11 shrink-0 rounded-lg" />
					<div className="min-w-0 flex-1 space-y-1.5">
						<Skeleton className="h-7 w-40 rounded" />
						<Skeleton className="h-4 w-64 rounded" />
					</div>
				</div>
			</div>

			{/* Content skeleton */}
			<div className="flex-1 space-y-4 overflow-y-auto p-3 sm:p-4 lg:p-6">
				<Skeleton className="h-10 w-full rounded" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Skeleton className="h-32 rounded-xl" />
					<Skeleton className="h-32 rounded-xl" />
					<Skeleton className="h-32 rounded-xl" />
				</div>
				<Skeleton className="h-64 w-full rounded-xl" />
			</div>
		</div>
	);
}
