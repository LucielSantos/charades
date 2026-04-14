import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mimica - Jogo de Mimica",
  description: "Jogo de mimica para grupos. Divirta-se com seus amigos!",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-violet-100 antialiased">
        <NextIntlClientProvider messages={messages}>
          <main className="mx-auto max-w-[430px] min-h-screen">
            {children}
          </main>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
