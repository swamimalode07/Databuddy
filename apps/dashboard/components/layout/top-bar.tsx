"use client";

import {
	createContext,
	type ReactNode,
	use,
	useEffect,
	useId,
	useRef,
	useState,
} from "react";
import { authClient } from "@databuddy/auth/client";
import { Avatar } from "@/components/ds/avatar";
import { Button } from "@/components/ds/button";
import { DropdownMenu } from "@/components/ds/dropdown-menu";
import { Skeleton } from "@databuddy/ui";
import { Tooltip } from "@databuddy/ui";
import {
	BugIcon,
	CalendarIcon,
	EnvelopeIcon,
	MagnifyingGlassIcon,
	MsgContentIcon,
} from "@databuddy/ui/icons";
import { useCommandSearchOpenAction } from "@/components/ui/command-search";
import { useRouter } from "next/navigation";
import { PendingInvitationsButton } from "./pending-invitations-button";
import { getInitials, ProfileDropdownContent } from "./profile-button-client";
import { SidebarTrigger } from "./sidebar-layout";

type SlotMap = Map<string, ReactNode>;
type Listener = () => void;

interface TopBarStore {
	getSlot: (name: string) => ReactNode;
	removeSlot: (name: string, id: string) => void;
	setSlot: (name: string, id: string, node: ReactNode) => void;
	subscribe: (listener: Listener) => () => void;
}

function createTopBarStore(): TopBarStore {
	const slots: Record<string, SlotMap> = {};
	const listeners = new Set<Listener>();

	function notify() {
		for (const l of listeners) {
			l();
		}
	}

	return {
		getSlot(name: string) {
			const map = slots[name];
			if (!map || map.size === 0) {
				return null;
			}
			return Array.from(map.values()).at(-1) ?? null;
		},
		setSlot(name: string, id: string, node: ReactNode) {
			if (!slots[name]) {
				slots[name] = new Map();
			}
			slots[name].set(id, node);
			notify();
		},
		removeSlot(name: string, id: string) {
			slots[name]?.delete(id);
			if (slots[name]?.size === 0) {
				delete slots[name];
			}
			notify();
		},
		subscribe(listener: Listener) {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
	};
}

const TopBarStoreContext = createContext<TopBarStore | null>(null);

function useStore() {
	const store = use(TopBarStoreContext);
	if (!store) {
		throw new Error("TopBar slot must be used within TopBarProvider");
	}
	return store;
}

function useStoreSlot(name: string): ReactNode {
	const store = useStore();
	const [, forceUpdate] = useState(0);

	useEffect(() => store.subscribe(() => forceUpdate((n) => n + 1)), [store]);

	return store.getSlot(name);
}

function useTopBarSlot(name: string, content: ReactNode) {
	const store = useStore();
	const id = useId();
	const contentRef = useRef(content);
	contentRef.current = content;

	useEffect(() => {
		store.setSlot(name, id, contentRef.current);
		return () => store.removeSlot(name, id);
	}, [store, name, id]);

	useEffect(() => {
		store.setSlot(name, id, content);
	}, [store, name, id, content]);
}

function TopBarTitle({ children }: { children: ReactNode }) {
	useTopBarSlot("title", children);
	return null;
}

function TopBarActions({ children }: { children: ReactNode }) {
	useTopBarSlot("actions", children);
	return null;
}

interface BreadcrumbItem {
	href?: string;
	label: string;
}

function TopBarBreadcrumbs({
	items,
	icon,
}: {
	icon?: ReactNode;
	items: BreadcrumbItem[];
}) {
	const content = (
		<nav aria-label="breadcrumb" className="flex items-center gap-2">
			{icon && (
				<span className="flex size-6 items-center justify-center rounded bg-secondary text-muted-foreground">
					{icon}
				</span>
			)}
			<ol className="flex items-center gap-1.5">
				{items.map((item, i) => {
					const isLast = i === items.length - 1;
					return (
						<li className="flex items-center gap-1.5" key={item.label}>
							{i > 0 && <span className="text-muted-foreground/40">/</span>}
							{isLast || !item.href ? (
								<span className="font-semibold text-foreground text-sm">
									{item.label}
								</span>
							) : (
								<a
									className="text-muted-foreground text-sm hover:text-foreground"
									href={item.href}
								>
									{item.label}
								</a>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
	useTopBarSlot("title", content);
	return null;
}

export function TopBarProvider({ children }: { children: ReactNode }) {
	const storeRef = useRef<TopBarStore | null>(null);
	if (!storeRef.current) {
		storeRef.current = createTopBarStore();
	}

	return (
		<TopBarStoreContext value={storeRef.current}>{children}</TopBarStoreContext>
	);
}

function HelpMenu() {
	const router = useRouter();

	return (
		<DropdownMenu>
			<DropdownMenu.Trigger
				aria-label="Help & feedback"
				className="flex size-8 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
				render={<button type="button" />}
			>
				<MsgContentIcon className="size-4 shrink-0" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end" className="w-48">
				<DropdownMenu.Item onClick={() => router.push("/feedback")}>
					<MsgContentIcon className="size-4 shrink-0" />
					Feedback
				</DropdownMenu.Item>
				<DropdownMenu.Item
					onClick={() => window.open("mailto:support@databuddy.cc", "_self")}
				>
					<EnvelopeIcon className="size-4 shrink-0" />
					Contact Us
				</DropdownMenu.Item>
				<DropdownMenu.Item
					onClick={() =>
						window.open(
							"https://github.com/databuddy-analytics/Databuddy/issues",
							"_blank"
						)
					}
				>
					<BugIcon className="size-4 shrink-0" />
					Report a Bug
				</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item
					onClick={() =>
						window.open("https://cal.com/databuddy/demo", "_blank")
					}
				>
					<CalendarIcon className="size-4 shrink-0" />
					Book a Meeting
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu>
	);
}

function TopBarUserButton() {
	const { data: session, isPending } = authClient.useSession();
	const user = session?.user ?? null;
	const [isOpen, setIsOpen] = useState(false);

	if (isPending) {
		return <Skeleton className="size-7 shrink-0 rounded-full" />;
	}

	if (!user) {
		return null;
	}

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<Tooltip content={user.email ?? "Account"} side="bottom">
				<DropdownMenu.Trigger
					aria-label="Profile menu"
					className="flex size-7 items-center justify-center rounded-full hover:opacity-80"
					render={<button type="button" />}
				>
					<Avatar
						alt={user.name || "User"}
						className="size-7"
						fallback={getInitials(user.name, user.email)}
						src={user.image || undefined}
					/>
				</DropdownMenu.Trigger>
			</Tooltip>
			<ProfileDropdownContent
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				user={user}
			/>
		</DropdownMenu>
	);
}

export function TopBar() {
	const titleContent = useStoreSlot("title");
	const actionsContent = useStoreSlot("actions");
	const [hasMounted, setHasMounted] = useState(false);
	const openSearch = useCommandSearchOpenAction();

	useEffect(() => {
		setHasMounted(true);
	}, []);

	return (
		<header className="sticky top-0 z-40 hidden h-12 shrink-0 items-center border-sidebar-border/50 border-b bg-sidebar md:flex">
			<div className="flex h-full w-full items-center gap-3 px-3">
				<SidebarTrigger />

				<div className="flex min-w-0 flex-1 items-center gap-2">
					{hasMounted ? titleContent : null}
				</div>

				<div className="flex items-center gap-2">
					{hasMounted ? actionsContent : null}
				</div>

				<div className="flex items-center gap-1.5">
					<Button
						aria-label="Search"
						className="h-8 gap-2 px-3 text-muted-foreground"
						onClick={() => openSearch()}
						variant="secondary"
					>
						<MagnifyingGlassIcon className="size-4" />
						<span className="text-xs">Search…</span>
						<kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
							⌘K
						</kbd>
					</Button>
					<HelpMenu />
					{hasMounted && <PendingInvitationsButton />}
					{hasMounted && <TopBarUserButton />}
				</div>
			</div>
		</header>
	);
}

TopBar.Title = TopBarTitle;
TopBar.Actions = TopBarActions;
TopBar.Breadcrumbs = TopBarBreadcrumbs;
