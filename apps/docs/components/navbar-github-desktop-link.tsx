import {
	GithubNavMark,
	GithubStarsBadge,
	githubRepoUrl,
} from "./github-nav-mark";
import { NavLink } from "./nav-link";

interface NavbarGithubDesktopLinkProps {
	stars?: number | null;
}

export function NavbarGithubDesktopLink({
	stars,
}: NavbarGithubDesktopLinkProps) {
	return (
		<NavLink external href={githubRepoUrl}>
			<span className="inline-flex items-center justify-center gap-2 rounded-md border border-foreground/20 bg-background/70 px-2 py-1 backdrop-blur-lg md:px-1">
				<GithubNavMark className="text-foreground transition-transform duration-200 hover:scale-110" />
				{typeof stars === "number" && <GithubStarsBadge stars={stars} />}
			</span>
		</NavLink>
	);
}
