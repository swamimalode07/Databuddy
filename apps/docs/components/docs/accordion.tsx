import type * as React from "react";
import { Card, cn } from "@databuddy/ui";
import { Accordion as BaseAccordion } from "@/components/ui/accordion";

export {
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

function Accordion({
	className,
	...props
}: React.ComponentProps<typeof BaseAccordion>) {
	return (
		<BaseAccordion className={cn("w-full space-y-2", className)} {...props} />
	);
}

// Accordions wrapper component
interface AccordionsProps extends React.ComponentProps<"div"> {
	collapsible?: boolean;
	type?: "single" | "multiple";
}

function Accordions({
	className,
	type = "single",
	collapsible = true,
	children,
	...props
}: AccordionsProps) {
	return (
		<Card
			className={cn("my-4 border-border/60 bg-card p-4", className)}
			{...props}
		>
			<Accordion collapsible={collapsible} type={type}>
				{children}
			</Accordion>
		</Card>
	);
}

export { Accordion, Accordions };
