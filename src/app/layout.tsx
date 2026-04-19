import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import DesktopStage from "@/components/layout/desktop-stage"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const geist = Geist({
	subsets: ["latin"],
	variable: "--font-sans",
})

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
})

export const viewport: Viewport = {
	themeColor: "#4f46e5",
}

export const metadata: Metadata = {
	title: "Mimica - Jogo de Mimica",
	description: "Jogo de mimica para grupos. Divirta-se com seus amigos!",
	manifest: "/manifest.json",
	openGraph: {
		title: "Mimica - Jogo de Mimica",
		description: "Jogo de mimica para grupos. Divirta-se com seus amigos!",
		type: "website",
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Mimica",
	},
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
	const locale = await getLocale()
	const messages = await getMessages()

	return (
		<html lang={locale} className={`${geist.variable} ${geistMono.variable}`}>
			<body className="min-h-screen bg-background antialiased">
				<NextIntlClientProvider messages={messages}>
					<DesktopStage>
						<main className="mx-auto max-w-[430px] min-h-screen md:rounded-3xl md:shadow-2xl md:my-8 md:min-h-[calc(100vh-4rem)] md:bg-white/80 md:backdrop-blur-sm md:border md:border-white/40 md:overflow-hidden dark:md:bg-zinc-900/70 dark:md:border-zinc-800/60">
							{children}
						</main>
					</DesktopStage>
					<Toaster />
				</NextIntlClientProvider>
			</body>
		</html>
	)
}
