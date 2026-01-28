import { Html, Head, Main, NextScript } from "next/document";

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const ADS_TEST_MODE = process.env.NEXT_PUBLIC_ADS_TEST_MODE === "true";

export default function Document() {
  const adSrc =
    ADS_ENABLED && ADSENSE_CLIENT
      ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
          ADSENSE_CLIENT
        )}`
      : "";

  return (
    <Html lang="en">
      <Head>
        {adSrc ? (
          <script
            async
            src={adSrc}
            crossOrigin="anonymous"
            data-adtest={ADS_TEST_MODE ? "on" : undefined}
          />
        ) : null}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
