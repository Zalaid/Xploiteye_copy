// src/pages/_app.tsx
import type { AppProps } from "next/app"
import { useRouter } from "next/router"
import Head from "next/head"
import Header from "./header"
import Footer from "./footer"
import "../styles/globals.css"
import { AuthProvider } from "../auth/AuthContext"
import { Toaster } from "@/components/ui/toaster"

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Page visibility logic
  const isDashboardPage = router.pathname.startsWith("/dashboard")
  const isAuthPage = router.pathname === "/signin" || router.pathname === "/signup"
  const showHeaderFooter = !isDashboardPage && !isAuthPage

  return (
    <AuthProvider>
      <>
        {/* Global Head — applies to all pages */}
        <Head>
          <title>XploitEye</title>
          <meta
            name="description"
            content="AI-powered cybersecurity platform for automated Red & Blue teaming."
          />
          <link rel="icon" type="image/svg+xml" href="/imags/eye.svg" />
          <link rel="alternate icon" href="/imags/eye.png" />
        </Head>

        {/* Layout */}
        <div className="flex flex-col min-h-screen">
          {showHeaderFooter && <Header />}
          <main className={isDashboardPage || isAuthPage ? "" : "flex-grow"}>
            <Component {...pageProps} />
          </main>
          {showHeaderFooter && <Footer />}
          <Toaster />
        </div>
      </>
    </AuthProvider>
  )
}
