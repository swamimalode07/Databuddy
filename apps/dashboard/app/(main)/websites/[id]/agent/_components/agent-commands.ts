import type { AgentCommand } from "./agent-atoms";

export const AGENT_COMMANDS: AgentCommand[] = [
	{
		id: "analyze-traffic",
		command: "/analyze",
		title: "Analyze traffic patterns",
		description: "Deep dive into your traffic data and trends",
		keywords: ["analyze", "traffic", "patterns", "trends", "visitors"],
	},
	{
		id: "analyze-sources",
		command: "/analyze",
		title: "Analyze traffic sources",
		description: "Break down traffic by source and medium",
		keywords: ["analyze", "sources", "referrers", "channels", "medium"],
	},
	{
		id: "analyze-conversions",
		command: "/analyze",
		title: "Analyze conversion funnel",
		description: "Identify drop-offs in your conversion funnel",
		keywords: ["analyze", "conversions", "funnel", "drop-off", "goals"],
	},
	{
		id: "report-weekly",
		command: "/report",
		title: "Generate weekly report",
		description: "Create a comprehensive weekly analytics report",
		keywords: ["report", "weekly", "summary", "overview"],
	},
	{
		id: "report-monthly",
		command: "/report",
		title: "Generate monthly report",
		description: "Create a detailed monthly performance report",
		keywords: ["report", "monthly", "summary", "performance"],
	},
	{
		id: "chart-traffic",
		command: "/chart",
		title: "Create traffic chart",
		description: "Visualize traffic trends over time",
		keywords: ["chart", "traffic", "visualization", "graph", "trend"],
	},
	{
		id: "chart-sources",
		command: "/chart",
		title: "Create sources breakdown",
		description: "Pie chart of traffic sources",
		keywords: ["chart", "sources", "pie", "breakdown"],
	},
	{
		id: "show-top-pages",
		command: "/show",
		title: "Show top pages",
		description: "Display your most visited pages",
		keywords: ["show", "top", "pages", "popular", "views"],
	},
	{
		id: "show-events",
		command: "/show",
		title: "Show recent events",
		description: "Display recent tracked events",
		keywords: ["show", "events", "recent", "actions", "tracking"],
	},
	{
		id: "show-sessions",
		command: "/show",
		title: "Show active sessions",
		description: "Display currently active user sessions",
		keywords: ["show", "sessions", "active", "users", "live"],
	},
	{
		id: "find-anomalies",
		command: "/find",
		title: "Find traffic anomalies",
		description: "Detect unusual patterns in your data",
		keywords: ["find", "anomalies", "unusual", "spikes", "drops"],
	},
	{
		id: "find-insights",
		command: "/find",
		title: "Find actionable insights",
		description: "Discover opportunities to improve",
		keywords: [
			"find",
			"insights",
			"opportunities",
			"improve",
			"recommendations",
		],
	},
	{
		id: "compare-periods",
		command: "/compare",
		title: "Compare time periods",
		description: "Compare metrics between two time periods",
		keywords: ["compare", "periods", "before", "after", "change"],
	},
];

export function filterCommands(query: string): AgentCommand[] {
	const normalized = query.toLowerCase().trim();
	if (!normalized) {
		return AGENT_COMMANDS;
	}
	return AGENT_COMMANDS.filter(
		(cmd) =>
			cmd.command.toLowerCase().includes(normalized) ||
			cmd.title.toLowerCase().includes(normalized) ||
			cmd.description.toLowerCase().includes(normalized) ||
			cmd.keywords.some((kw) => kw.includes(normalized))
	);
}
