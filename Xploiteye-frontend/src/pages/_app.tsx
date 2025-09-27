import type { AppProps } from "next/app"
import { useRouter } from "next/router"
import Header from "./header"
import Footer from "./footer"
import "../styles/globals.css"
import { AuthProvider } from "../auth/AuthContext"
import { Toaster } from "@/components/ui/toaster"

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter()
  
  // Check if current page is a dashboard, signin, or signup page
  const isDashboardPage = router.pathname.startsWith('/dashboard')
  const isAuthPage = router.pathname === '/signin' || router.pathname === '/signup'
  const showHeaderFooter = !isDashboardPage && !isAuthPage
  
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        {showHeaderFooter && <Header />}
        <main className={isDashboardPage || isAuthPage ? "" : "flex-grow"}>
          <Component {...pageProps} />
        </main>
        {showHeaderFooter && <Footer />}
        <Toaster />
      </div>
    </AuthProvider>
  )
}