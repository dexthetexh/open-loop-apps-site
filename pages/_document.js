import { Html, Head, Main, NextScript } from "next/document";
import { ADS, SITE } from "../lib/site";

export default function Document() {
  const adSrc =
    ADS.enabled && ADS.client
      ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADS.client)}`
      : "";

  return (
    <Html lang="en">
      <Head>
        <meta name="theme-color" content={SITE.themeColor} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        {adSrc ? (
          <script async src={adSrc} crossOrigin="anonymous" data-adtest={ADS.testMode ? "on" : undefined} />
        ) : null}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
