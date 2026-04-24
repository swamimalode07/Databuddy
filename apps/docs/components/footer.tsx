"use client";

import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Wordmark } from "./landing/wordmark";
import { LogoContent } from "./logo";
import { NewsletterForm } from "./newsletter-form";
import { GDPRIcon } from "./icons/gdpr";
import { CCPAIcon } from "./icons/ccpa";
import { SciFiButton } from "./landing/scifi-btn";

export function Footer() {
	return (
		<footer className="border-border border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="mx-auto flex max-w-360 flex-col gap-8 px-4 pt-10 sm:px-6 lg:px-8">
				{/* CTA Section */}
				<div
					className="relative flex h-70 w-full items-start rounded-lg bg-center bg-cover md:h-80"
					style={{
						backgroundImage: "url('/brand/gradients/cta-bg.png')",
					}}
				>
					<Image
						alt="logo"
						className="pointer-events-none absolute top-1/2 right-16 hidden -translate-y-1/2 opacity-80 lg:block"
						height={180}
						src="/brand/logomark/white.svg"
						width={180}
					/>
					<div className="max-w-5xl px-8 pt-8 sm:px-16 md:pt-16">
						<h2 className="mb-2 text-left font-medium text-2xl leading-tight sm:text-4xl">
							All the analytics you need. One click away
						</h2>

						<p className="mb-6 text-lg text-muted-foreground">
							Events, errors, and feature flags in a single privacy-first
							script.
						</p>
						<div className="flex gap-4">
							<SciFiButton asChild>
								<a href="https://app.databuddy.cc/login">START FREE</a>
							</SciFiButton>

							<SciFiButton asChild>
								<Link href="/contact">CONTACT US</Link>
							</SciFiButton>
						</div>
					</div>
				</div>
				<div className="mb-10 flex flex-col items-start justify-between gap-4 rounded-lg border border-border bg-card/30 p-5 sm:flex-row sm:items-center sm:p-6">
					<div className="space-y-1">
						<p className="font-medium text-2xl text-foreground">
							Get product updates
						</p>
						<p className="text-base text-muted-foreground">
							New features, tips, and privacy-first analytics insights. No spam.
						</p>
					</div>
					<div className="w-full sm:w-auto">
						<NewsletterForm />
					</div>
				</div>

				<div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-4">
					<div className="col-span-2 space-y-4 md:col-span-1">
						<LogoContent />
					</div>

					<div className="space-y-4">
						<h3 className="font-semibold text-sm">Product</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/docs"
								>
									Docs
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/pricing"
								>
									Pricing
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/calculator"
								>
									Cookie cost calculator
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/compare"
								>
									Compare
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/changelog"
								>
									Changelog
								</Link>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h3 className="font-semibold text-sm">Company</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/blog"
								>
									Blog
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/manifesto"
								>
									Manifesto
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/careers"
								>
									Careers
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/contact"
								>
									Contact
								</Link>
							</li>
						</ul>
					</div>

					<div className="space-y-4">
						<h3 className="font-semibold text-sm">Connect</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="mailto:support@databuddy.cc"
								>
									Email
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="https://discord.gg/JTk7a38tCZ"
									rel="noopener"
									target="_blank"
								>
									Discord
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="https://x.com/trydatabuddy"
									rel="noopener"
									target="_blank"
								>
									X
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="https://github.com/databuddy-analytics/Databuddy"
									rel="noopener"
									target="_blank"
								>
									GitHub
								</Link>
							</li>
						</ul>
					</div>

					<div className="order-5 col-span-2 space-y-4 sm:order-none sm:col-span-1">
						<h3 className="font-semibold text-sm">Newsletter</h3>
						<p className="text-muted-foreground text-sm">
							Get the latest analytics insights, product updates, and tips.
						</p>
						<NewsletterForm />
					</div>

					{/* Legal — mobile only, paired with Newsletter in the 2-col grid */}
					<div className="order-4 space-y-4 sm:hidden">
						<h3 className="font-semibold text-sm">Legal</h3>
						<ul className="space-y-2 text-sm">
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/privacy"
								>
									Privacy
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/terms"
								>
									Terms
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/dpa"
								>
									DPA
								</Link>
							</li>
							<li>
								<Link
									className="text-muted-foreground hover:text-foreground"
									href="/data-policy"
								>
									Data Policy
								</Link>
							</li>
						</ul>
					</div>

					{/* Bottom bar — mobile: copyright + theme toggle full width */}
					<div className="order-6 col-span-2 flex items-center justify-between pb-8 sm:hidden">
						<p className="text-muted-foreground/70 text-xs">
							© {new Date().getFullYear()} Databuddy
						</p>
						<ThemeToggle />
					</div>

					{/* Bottom bar — desktop only */}
					<div className="col-span-1 hidden items-center pt-6 pb-8 sm:flex">
						<p className="text-muted-foreground/70 text-sm">
							© {new Date().getFullYear()} Databuddy
						</p>
					</div>
					<div className="col-span-4 hidden items-center gap-4 pt-6 pb-8 sm:flex">
						<div className="flex items-center gap-4 whitespace-nowrap">
							<Link
								aria-label="CCPA Compliance"
								className="text-foreground transition-colors hover:text-muted-foreground"
								href="/"
							>
								<CCPAIcon className="size-9" />
							</Link>
							<Link
								aria-label="GDPR Compliance"
								className="text-foreground transition-colors hover:text-muted-foreground"
								href="/"
							>
								<GDPRIcon className="size-11" />
							</Link>
						</div>
						<div className="flex flex-wrap items-center gap-4">
							<Link
								className="text-muted-foreground/70 text-xs hover:text-muted-foreground sm:text-sm"
								href="/privacy"
							>
								Privacy
							</Link>
							<Link
								className="text-muted-foreground/60 text-sm hover:text-muted-foreground"
								href="/data-policy"
							>
								Data Policy
							</Link>
							<Link
								className="text-muted-foreground/60 text-sm hover:text-muted-foreground"
								href="/dpa"
							>
								DPA
							</Link>
							<Link
								className="text-muted-foreground/60 text-sm hover:text-muted-foreground"
								href="/terms"
							>
								Terms
							</Link>
						</div>
						<div className="ml-auto">
							<ThemeToggle />
						</div>
					</div>
				</div>

				{/* Copyright Row */}
				<div className="mt-4 flex flex-row flex-col items-start justify-between gap-4 border-border border-t pt-4">
					<p className="text-muted-foreground text-sm sm:text-base">
						© {new Date().getFullYear()} Databuddy
					</p>
					<div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
						<p className="text-muted-foreground text-sm sm:text-base">
							Privacy-first analytics
						</p>
					</div>
				</div>
				<Wordmark />
			</div>
		</footer>
	);
}
