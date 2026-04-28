import Image from "next/image";

const companies = [
	{
		name: "Open",
		badge: "YC W24",
		url: "https://open.cx",
		logo: "/social/opencx-black.svg",
		invert: true,
	},
	{
		name: "Autumn",
		badge: "YC S25",
		url: "https://useautumn.com",
		logo: "/social/autumn.svg",
	},
	{
		name: "Better Auth",
		badge: "YC X25",
		url: "https://www.better-auth.com",
		logo: "/social/better-auth.svg",
		invert: true,
	},
	{
		name: "OpenCut",
		url: "https://opencut.app",
		logo: "/social/opencut.svg",
		invert: true,
	},
	{
		name: "Maza",
		url: "https://maza.vc",
		logo: "/social/maza.svg",
	},
	{
		name: "Figurable",
		url: "https://figurable.ai",
		logo: "/social/figurable.svg",
		invert: true,
	},
];

export function TrustedBy() {
	return (
		<div className="w-full py-12">
			<p className="mb-8 text-center text-muted-foreground text-sm uppercase tracking-wide">
				Trusted by teams that switched from PostHog, GA4, Plausible, Fathom, and
				others
			</p>
			<div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
				{companies.map((company) => (
					<a
						className="group flex items-center gap-2.5 transition-colors hover:text-foreground"
						href={company.url}
						key={company.name}
						rel="noopener noreferrer"
						target="_blank"
					>
						<Image
							alt={company.name}
							className={`h-6 w-auto object-contain sm:h-7 ${company.invert ? "invert" : ""}`}
							height={28}
							src={company.logo}
							width={120}
						/>
						{company.badge && (
							<span className="rounded bg-white/10 px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground leading-none">
								{company.badge}
							</span>
						)}
					</a>
				))}
			</div>
		</div>
	);
}

export default TrustedBy;
