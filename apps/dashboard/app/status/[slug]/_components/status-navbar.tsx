import { ThemeToggle } from "@/components/layout/theme-toggle";

export function StatusNavbar() {
	return (
		<div className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-lg">
			<nav className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4 sm:px-6">
				<p className="font-medium text-foreground text-sm tracking-tight">
					System Status
				</p>

				<ThemeToggle className="flex" />
			</nav>
		</div>
	);
}
