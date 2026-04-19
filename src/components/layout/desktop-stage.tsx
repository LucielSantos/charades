import type { ReactNode } from "react"
import AmbientTint from "./ambient-tint"

/**
 * DesktopStage
 *
 * Wraps the app content and renders a decorative ambient background
 * (Layer 0) that is only visible on desktop (md and up). Mobile is
 * untouched — the layer is `hidden` below the `md` breakpoint.
 *
 * Layer 0 is a fixed, full-viewport, non-interactive decorative layer
 * containing a base gradient plus four blurred "blobs" whose colors are
 * driven by CSS custom properties set by <AmbientTint /> (Layer 2).
 */
export default function DesktopStage({ children }: { children: ReactNode }) {
	return (
		<>
			{/* Layer 0 — Ambient background (desktop only, decorative) */}
			<div
				aria-hidden
				className="fixed inset-0 -z-10 hidden md:block pointer-events-none bg-gradient-to-br from-indigo-50 via-purple-50 to-violet-100 dark:from-zinc-950 dark:via-indigo-950 dark:to-zinc-900"
			>
				{/* Blob 1 — top-left, indigo-ish */}
				<div
					className="absolute top-[10%] left-[5%] w-[40vw] h-[40vw] rounded-full blur-3xl opacity-40 transition-[background-color] duration-700 animate-pulse [animation-delay:0ms] [animation-duration:8s]"
					style={{
						backgroundColor: "var(--ambient-blob-1, oklch(0.82 0.09 280))",
					}}
				/>
				{/* Blob 2 — bottom-right, violet-ish */}
				<div
					className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vw] rounded-full blur-3xl opacity-40 transition-[background-color] duration-700 animate-pulse [animation-delay:2000ms] [animation-duration:8s]"
					style={{
						backgroundColor: "var(--ambient-blob-2, oklch(0.82 0.09 310))",
					}}
				/>
				{/* Blob 3 — top-center, pink-ish */}
				<div
					className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[30vw] h-[30vw] rounded-full blur-3xl opacity-40 transition-[background-color] duration-700 animate-pulse [animation-delay:4000ms] [animation-duration:8s]"
					style={{
						backgroundColor: "var(--ambient-blob-3, oklch(0.87 0.06 350))",
					}}
				/>
				{/* Blob 4 — center-right, category accent (transparent by default) */}
				<div
					className="absolute top-1/2 right-[20%] -translate-y-1/2 w-[25vw] h-[25vw] rounded-full blur-3xl opacity-40 transition-[background-color] duration-700 animate-pulse [animation-delay:6000ms] [animation-duration:8s]"
					style={{
						backgroundColor: "var(--ambient-blob-category, transparent)",
					}}
				/>
			</div>

			{/* Layer 2 — Contextual tint (reads store, writes CSS vars on :root) */}
			<AmbientTint />

			{/* Layer 1 — App content (the 430px stage column lives inside) */}
			{children}
		</>
	)
}
