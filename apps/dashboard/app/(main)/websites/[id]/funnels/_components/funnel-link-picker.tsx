"use client";

import { CaretUpDownIcon } from "@phosphor-icons/react/dist/ssr/CaretUpDown";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { LinkIcon } from "@phosphor-icons/react/dist/ssr/Link";
import { useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useLinks } from "@/hooks/use-links";
import { cn } from "@/lib/utils";

interface FunnelLinkPickerProps {
	selectedLinkId: string | null;
	onLinkChangeAction: (linkId: string | null) => void;
}

export function FunnelLinkPicker({
	selectedLinkId,
	onLinkChangeAction,
}: FunnelLinkPickerProps) {
	const [open, setOpen] = useState(false);
	const { links, isLoading } = useLinks();

	const selectedLink = selectedLinkId
		? links.find((l) => l.id === selectedLinkId)
		: null;

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<button
					aria-expanded={open}
					aria-label="Select a link"
					className={cn(
						"flex h-8 items-center gap-2 rounded border px-3 text-sm transition-colors",
						selectedLink
							? "border-chart-2 bg-chart-2/10 text-chart-2"
							: "border-border bg-card text-muted-foreground hover:bg-secondary/50"
					)}
					role="combobox"
					type="button"
				>
					<LinkIcon className="size-3.5" weight="duotone" />
					<span className="max-w-[160px] truncate">
						{selectedLink
							? selectedLink.name || selectedLink.slug
							: "Filter by link"}
					</span>
					<CaretUpDownIcon className="size-3.5 opacity-50" weight="fill" />
				</button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[260px] p-0">
				<Command>
					<CommandInput placeholder="Search links..." />
					<CommandList>
						<CommandEmpty>
							{isLoading ? "Loading links..." : "No links found"}
						</CommandEmpty>
						<CommandGroup>
							{selectedLinkId && (
								<CommandItem
									onSelect={() => {
										onLinkChangeAction(null);
										setOpen(false);
									}}
								>
									<span className="text-muted-foreground">Clear filter</span>
								</CommandItem>
							)}
							{links.map((link) => (
								<CommandItem
									key={link.id}
									onSelect={() => {
										onLinkChangeAction(
											link.id === selectedLinkId ? null : link.id
										);
										setOpen(false);
									}}
								>
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="truncate text-sm">
											{link.name || link.slug}
										</span>
										<span className="truncate text-muted-foreground text-xs">
											/{link.slug}
										</span>
									</div>
									{link.id === selectedLinkId && (
										<CheckIcon className="size-4 text-chart-2" weight="bold" />
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
