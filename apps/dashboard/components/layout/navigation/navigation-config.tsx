import { GATED_FEATURES } from "@databuddy/shared/types/features";
import {
	BellIcon,
	BookOpenIcon,
	BoltLightningIcon as LightningIcon,
	BugIcon,
	ChartActivityIcon as PulseIcon,
	ChartPieIcon as ChartPieSliceIcon,
	CodeIcon,
	CreditCardIcon,
	CurrencyDollarIcon,
	EyeIcon,
	FileDownloadIcon as FileArrowDownIcon,
	FilterIcon as FunnelIcon,
	FlagIcon,
	GaugeIcon,
	GearIcon,
	GlobeIcon,
	GlobeSimpleIcon,
	HeartPulseIcon as HeartbeatIcon,
	HouseIcon,
	IdBadge2Icon as IdentificationBadgeIcon,
	LightbulbIcon,
	LinkIcon,
	LockIcon,
	MapPinIcon,
	MediaPlayIcon,
	MsgContentIcon,
	OpenExternalIcon as ArrowSquareOutIcon,
	ReceiptIcon,
	RobotIcon,
	RoadIcon,
	TargetIcon,
	TriangleWarningIcon as WarningIcon,
	UserIcon,
	UserSettingsIcon,
	Users3Icon as UsersThreeIcon,
	VolumeUpIcon,
} from "@/components/icons/nucleo";
import type { NavigationGroup, NavigationItem } from "./types";

export const createNavItem = (
	name: string,
	icon: NavigationItem["icon"],
	href: string,
	options: Partial<Omit<NavigationItem, "name" | "icon" | "href">> = {}
): NavigationItem => ({
	name,
	icon,
	href,
	rootLevel: true,
	...options,
});

export const mainNavigation: NavigationGroup[] = [
	{
		label: "Overview",
		items: [
			createNavItem("Home", HouseIcon, "/home"),
			createNavItem("Websites", GlobeIcon, "/websites"),
			createNavItem("Insights", LightbulbIcon, "/insights"),
		],
	},
	{
		label: "Observability",
		items: [
			createNavItem("Links", LinkIcon, "/links"),
			createNavItem("Custom Events", LightningIcon, "/events"),
		],
	},
	{
		label: "Monitoring",
		flag: "monitors",
		items: [
			createNavItem("All Monitors", HeartbeatIcon, "/monitors"),
			createNavItem("Status Pages", GlobeSimpleIcon, "/monitors/status-pages"),
		],
	},
	{
		label: "Resources",
		items: [
			createNavItem(
				"Documentation",
				BookOpenIcon,
				"https://databuddy.cc/docs",
				{
					external: true,
				}
			),
			createNavItem(
				"Video Guides",
				MediaPlayIcon,
				"https://youtube.com/@trydatabuddy",
				{ external: true }
			),
			createNavItem(
				"Roadmap",
				RoadIcon,
				"https://trello.com/b/SOUXD4wE/databuddy",
				{ external: true }
			),
			createNavItem(
				"Feedback",
				VolumeUpIcon,
				"https://databuddy.featurebase.app/",
				{ external: true }
			),
		],
	},
	{
		label: "",
		pinToBottom: true,
		items: [
			createNavItem("Settings", GearIcon, "/organizations/settings"),
			createNavItem("Billing", CreditCardIcon, "/billing"),
		],
	},
];

export const websiteNavigation: NavigationGroup[] = [
	{
		back: { href: "/websites", label: "Websites" },
		label: "Web Analytics",
		items: [
			createNavItem("Dashboard", ChartPieSliceIcon, "", { rootLevel: false }),
			createNavItem("Audience", UsersThreeIcon, "/audience", {
				rootLevel: false,
			}),
			createNavItem("Web Vitals", GaugeIcon, "/vitals", {
				rootLevel: false,
				gatedFeature: GATED_FEATURES.WEB_VITALS,
			}),
			createNavItem("Geographic", MapPinIcon, "/map", {
				rootLevel: false,
				gatedFeature: GATED_FEATURES.GEOGRAPHIC,
			}),
			createNavItem("Error Tracking", BugIcon, "/errors", {
				rootLevel: false,
				gatedFeature: GATED_FEATURES.ERROR_TRACKING,
			}),
			createNavItem("Anomalies", WarningIcon, "/anomalies", {
				rootLevel: false,
				alpha: true,
				flag: "anomalies",
			}),
			createNavItem("Pulse", PulseIcon, "/pulse", {
				rootLevel: false,
				flag: "pulse",
				alpha: true,
			}),
		],
	},
	{
		label: "Product Analytics",
		items: [
			createNavItem("Users", IdentificationBadgeIcon, "/users", {
				rootLevel: false,
				gatedFeature: GATED_FEATURES.USERS,
			}),
			createNavItem("Funnels", FunnelIcon, "/funnels", {
				rootLevel: false,
				gatedFeature: GATED_FEATURES.FUNNELS,
			}),
			createNavItem("Goals", TargetIcon, "/goals", {
				rootLevel: false,
				gatedFeature: GATED_FEATURES.GOALS,
			}),
			createNavItem("Feature Flags", FlagIcon, "/flags", {
				alpha: true,
				rootLevel: false,
				gatedFeature: GATED_FEATURES.FEATURE_FLAGS,
			}),
			createNavItem("Revenue", CurrencyDollarIcon, "/revenue", {
				alpha: true,
				rootLevel: false,
				flag: "revenue",
			}),
			createNavItem("Databunny", RobotIcon, "/agent", {
				alpha: true,
				rootLevel: false,
			}),
		],
	},
	{
		label: "",
		pinToBottom: true,
		items: [
			createNavItem("General", GearIcon, "/settings/general", {
				rootLevel: false,
			}),
			createNavItem("Security", LockIcon, "/settings/security", {
				rootLevel: false,
			}),
			createNavItem("Transfer", ArrowSquareOutIcon, "/settings/transfer", {
				rootLevel: false,
			}),
			createNavItem("Data Export", FileArrowDownIcon, "/settings/export", {
				rootLevel: false,
			}),
			createNavItem("Setup", CodeIcon, "/settings/tracking", {
				rootLevel: false,
			}),
		],
	},
];

export const settingsNavigation: NavigationGroup[] = [
	{
		back: { href: "/home", label: "Home" },
		label: "Workspace",
		items: [
			createNavItem("General", GearIcon, "/organizations/settings"),
			createNavItem("Members", UserIcon, "/organizations/members"),
		],
	},
	{
		label: "Billing",
		items: [
			createNavItem("Overview", CreditCardIcon, "/billing"),
			createNavItem("Plans", CurrencyDollarIcon, "/billing/plans"),
			createNavItem("Invoices", ReceiptIcon, "/billing/history"),
		],
	},
	{
		label: "Account",
		items: [
			createNavItem("Profile", UserSettingsIcon, "/settings/account"),
			createNavItem("Appearance", EyeIcon, "/settings/appearance"),
			createNavItem("Notifications", BellIcon, "/settings/notifications"),
			createNavItem("Feedback & Credits", MsgContentIcon, "/feedback"),
		],
	},
];

const SETTINGS_PREFIXES = [
	"/organizations",
	"/billing",
	"/settings",
	"/feedback",
] as const;

export type NavContext = "main" | "settings" | "website";

const CONTEXT_DEPTH: Record<NavContext, number> = {
	main: 0,
	settings: 1,
	website: 1,
};

export function getNavContext(pathname: string): NavContext {
	if (pathname.startsWith("/websites/") || pathname.startsWith("/demo/")) {
		return "website";
	}
	if (SETTINGS_PREFIXES.some((p) => pathname.startsWith(p))) {
		return "settings";
	}
	return "main";
}

export function getNavigation(pathname: string): NavigationGroup[] {
	const ctx = getNavContext(pathname);
	if (ctx === "website") {
		return websiteNavigation;
	}
	if (ctx === "settings") {
		return settingsNavigation;
	}
	return mainNavigation;
}

export function getNavDirection(
	prev: NavContext,
	next: NavContext
): "left" | "right" | null {
	if (prev === next) {
		return null;
	}
	const prevDepth = CONTEXT_DEPTH[prev];
	const nextDepth = CONTEXT_DEPTH[next];
	return nextDepth > prevDepth ? "left" : "right";
}
