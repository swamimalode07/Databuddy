"use client";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export interface FaqItem {
	question: string;
	answer: string;
}

interface FaqSectionProps {
	title?: string;
	subtitle?: string;
	items: FaqItem[];
	className?: string;
}

export function FaqSection({
	title = "Frequently asked questions",
	subtitle,
	items,
	className,
}: FaqSectionProps) {
	return (
		<div className={cn("mx-auto w-full max-w-5xl", className)}>
			<div className="flex flex-col gap-10 sm:flex-row sm:gap-16">
				{/* Left: sticky title block */}
				<div className="sm:sticky sm:top-8 sm:w-64 sm:shrink-0 sm:self-start">
					<h2 className="text-balance font-semibold text-2xl tracking-tight sm:text-4xl">
						{title}
					</h2>
					{subtitle ? (
						<p className="mt-2 text-pretty text-muted-foreground text-sm sm:text-base">
							{subtitle}
						</p>
					) : null}
				</div>

				{/* Right: accordion */}
				<Accordion className="w-full min-w-0" collapsible type="single">
					{items.map((faq) => (
						<AccordionItem
							className="accordion-item"
							key={faq.question}
							value={faq.question}
						>
							<AccordionTrigger className="px-5 py-4 text-left font-normal text-sm hover:no-underline sm:px-6 sm:py-5 sm:text-base">
								{faq.question}
							</AccordionTrigger>
							<AccordionContent className="px-5 pb-4 text-muted-foreground text-sm leading-relaxed sm:px-6 sm:pb-5">
								{faq.answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</div>
	);
}
