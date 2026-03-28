"use client";

import { ArrowLeftIcon } from "@phosphor-icons/react";

export function NotFoundGoBackButton() {
	return (
		<button
			className="group inline-flex items-center justify-center gap-2 rounded border border-border bg-foreground/5 px-5 py-2 font-medium text-foreground text-sm backdrop-blur-sm transition-colors hover:bg-foreground/10 active:scale-[0.98]"
			onClick={() => window.history.back()}
			type="button"
		>
			<ArrowLeftIcon
				className="size-3.5 transition-transform group-hover:-translate-x-0.5"
				weight="fill"
			/>
			Go back
		</button>
	);
}
