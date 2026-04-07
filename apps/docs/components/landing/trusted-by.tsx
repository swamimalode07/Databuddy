import Image from "next/image";

const industryLeaders = [
	{
		name: "Open (YC W24)",
		url: "https://open.cx",
		logo: "/social/opencx-black.svg",
		invert: true,
		description: "AI-Powered customer support platform",
	},
	{
		name: "Autumn (S25)",
		url: "https://useautumn.com",
		logo: "/social/autumn.svg",
		logoClass: "h-8 sm:h-10",
		invert: false,
		description: "Monetization infrastructure for developers",
	},
	{
		name: "Better Auth (YC X25)",
		url: "https://www.better-auth.com",
		logo: "/social/better-auth.svg",
		invert: true,
		description: "The #1 Authentication framework for TypeScript",
	},
	{
		name: "OpenCut",
		url: "https://opencut.app",
		logo: "/social/opencut.svg",
		invert: true,
		description: "Open source video editor",
	},
	{
		name: "Maza",
		url: "https://maza.vc",
		logo: "/social/maza.svg",
		description: "Venture Capital Fund",
	},
	{
		name: "Figurable",
		url: "https://figurable.ai",
		logo: "/social/figurable.svg",
		invert: true,
	},
];

interface LogoGroupProps {
	title: string;
}

const LogoGroup = ({ title }: LogoGroupProps) => {
	return (
		<div className="flex flex-col items-center border border-border bg-background/50 p-4">
			<h2 className="mb-4 text-center font-medium text-md text-muted-foreground">
				{title}
			</h2>

			<div className="grid w-full max-w-80 grid-cols-2 gap-x-2 gap-y-3">
				{industryLeaders.slice(0, 3).map((company, index) => (
					<a
						className="flex h-12 w-full items-center justify-center rounded-md"
						href={company.url}
						key={index}
						rel="noopener noreferrer"
						target="_blank"
					>
						<Image
							alt={company.name}
							className={`h-7 w-auto max-w-full object-contain ${
								company.invert ? "dark:invert" : ""
							}`}
							height={32}
							src={company.logo}
							width={120}
						/>
					</a>
				))}

				{/* 4th slot — "+N more" */}
				<div className="flex h-12 w-full items-center justify-center rounded-md px-2">
					<span className="text-base text-muted-foreground">
						+{industryLeaders.length - 3} more
					</span>
				</div>
			</div>
		</div>
	);
};

export const TrustedBy = () => {
	return (
		<div className="w-full">
			<div className="grid grid-cols-1 sm:grid-cols-3">
				<LogoGroup title="Customers from June" />
				<LogoGroup title="Customers from Pendo, Mixpanel, Amplitude" />
				<LogoGroup title="Migrated off others" />
			</div>
		</div>
	);
};

export default TrustedBy;
