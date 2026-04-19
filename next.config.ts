import withPWAInit from "@ducanh2912/next-pwa"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})

const nextConfig: NextConfig = {
  allowedDevOrigins: ['4605-177-129-25-177.ngrok-free.app'],
}

export default withPWA(withNextIntl(nextConfig))
