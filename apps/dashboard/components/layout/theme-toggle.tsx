"use client";

import { MonitorIcon, MoonIcon, SunIcon } from "@phosphor-icons/react/dist/ssr";
import { useTheme } from "next-themes";
import { Button } from "@/components/ds/button";
import { Tooltip } from "@/components/ds/tooltip";
import { cn } from "@/lib/utils";

interface ThemeTogglerProps {
	className?: string;
	tooltip?: boolean;
}

export function ThemeToggle({ className, tooltip = false }: ThemeTogglerProps) {
	const { theme, setTheme } = useTheme();
	const currentTheme = theme ?? "system";

	const switchTheme = () => {
		const nextTheme =
			currentTheme === "system"
				? "light"
				: currentTheme === "light"
					? "dark"
					: "system";

		if (!("startViewTransition" in document)) {
			setTheme(nextTheme);
			return;
		}

		document.startViewTransition(() => {
			setTheme(nextTheme);
		});
	};

	const getThemeLabel = () => {
		switch (currentTheme) {
			case "light":
				return "Light mode";
			case "dark":
				return "Dark mode";
			case "system":
				return "System theme";
			default:
				return "Toggle theme";
		}
	};

	const getNextThemeLabel = () => {
		const nextTheme =
			currentTheme === "system"
				? "light"
				: currentTheme === "light"
					? "dark"
					: "system";
		switch (nextTheme) {
			case "light":
				return "Switch to light";
			case "dark":
				return "Switch to dark";
			case "system":
				return "Switch to system";
			default:
				return "Toggle theme";
		}
	};

	const button = (
		<Button
			aria-label="Toggle theme"
			className={cn("relative hidden size-8 p-0 md:flex", className)}
			onClick={switchTheme}
			suppressHydrationWarning
			variant="ghost"
		>
			<SunIcon
				className={cn(
					"size-5 transition-all duration-300",
					currentTheme === "light" ? "rotate-0 scale-100" : "-rotate-90 scale-0"
				)}
				suppressHydrationWarning
				weight="duotone"
			/>
			<MoonIcon
				className={cn(
					"absolute size-5 transition-all duration-300",
					currentTheme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-0"
				)}
				suppressHydrationWarning
				weight="duotone"
			/>
			<MonitorIcon
				className={cn(
					"absolute size-5 transition-all duration-300",
					currentTheme === "system" ? "rotate-0 scale-100" : "rotate-90 scale-0"
				)}
				suppressHydrationWarning
				weight="duotone"
			/>
			<span className="sr-only">Toggle theme</span>
		</Button>
	);

	if (tooltip) {
		return (
			<Tooltip
				content={`${getThemeLabel()} · ${getNextThemeLabel()}`}
				delay={500}
				side="right"
			>
				{button}
			</Tooltip>
		);
	}

	return button;
}
