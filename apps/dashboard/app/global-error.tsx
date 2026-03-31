"use client";

/**
 * Root error boundary — must define its own <html> and <body> and cannot rely on
 * the root layout. Avoid `next/error` here: it expects Pages Router context and
 * breaks prerender (useContext) during `next build`.
 */
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html className="dark" lang="en">
			<body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 font-sans text-foreground antialiased">
				<h1 className="text-balance font-medium text-lg">
					Something went wrong
				</h1>
				{error.digest ? (
					<p className="text-pretty text-muted-foreground text-sm tabular-nums">
						{error.digest}
					</p>
				) : null}
				<button
					className="rounded border border-border bg-card px-4 py-2 text-sm"
					onClick={() => reset()}
					type="button"
				>
					Try again
				</button>
			</body>
		</html>
	);
}
