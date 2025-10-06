import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* SVG favicon */}
        <link rel="icon" type="image/svg+xml" href="/images/eye.svg" />
        {/* Optional PNG fallback (if you ever add one) */}
        <link rel="alternate icon" href="/images/eye.png" />
        {/* Theme color for browser UI (adjust if needed) */}
        <meta name="theme-color" content="#000000" />
      </Head>
      <body className="dark">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
