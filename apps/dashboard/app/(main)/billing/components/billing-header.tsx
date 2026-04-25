"use client";

import { usePathname } from "next/navigation";
import { TopBar } from "@/components/layout/top-bar";

const PAGE_TITLES: Record<string, string> = {
	"/billing": "Billing Overview",
	"/billing/plans": "Plans",
	"/billing/history": "Invoices",
};

export function BillingHeader() {
	const pathname = usePathname();
	const title = PAGE_TITLES[pathname] ?? "Billing";

	return (
		<TopBar.Title>
			<h1 className="font-semibold text-sm">{title}</h1>
		</TopBar.Title>
	);
}
