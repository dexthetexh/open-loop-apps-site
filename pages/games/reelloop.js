// File: /pages/games/reelloop.js
import Head from "next/head";
import Link from "next/link";
import AdSlot from "../../components/ads/AdSlot";
import { getPrevNextSlug } from "../../lib/games";

const CANONICAL_BASE = "https://openloopapps.com";

export default function ReelLoopPage() {
  const slug = "reelloop";
  const { prev, next } = getPrevNextSlug(slug);

  const title = "ReelLoop";
  const desc = "Cozy trophy fishing with crisp haptics.";
  const canonical = `${CANONICAL_BASE}/games/${slug}`;
  const iframeSrc = `/play/${slug}/index.html`;

  return (
    <>
      <Head>
        <title>{`${title} | Open Loop Apps`}</title>
        <meta name="description" content={desc} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0"
        />
        <meta name="theme-color" content="#020617" />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">{title}</h1>
          <p className="subtitle">{desc}</p>

          <div className="navRow" aria-label="Game navigation">
            <Link className="navGhost" href="/games">← Games</Link>
            <span className="navSep">·</span>
            <Link className="navPrimary" href={`/play/${slug}`}>Play →</Link>

            {prev && (
              <>
                <span className="navSep">·</span>
                <Link href={`/games/${prev}`}>← Prev</Link>
              </>
            )}

            {next && (
              <>
                <span className="navSep">·</span>
                <Link href={`/games/${next}`}>Next →</Link>
              </>
            )}
          </div>
        </header>

        {/* Ads are allowed on wrapper pages (/games/*) only */}
        <AdSlot slot="1234567890" className="ad-slot" />

        <div className="gameFrameWrap phoneFrame" role="region" aria-label={`${title} game`}>
          <iframe
            className="gameFrame"
            src={iframeSrc}
            title={title}
            loading="eager"
            allow="fullscreen; gamepad; autoplay; vibration; accelerometer; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups"
          />
        </div>

        <AdSlot slot="2345678901" className="ad-slot" />

        <p className="smallNote" style={{ marginTop: 12 }}>
          Loaded from: <code>{iframeSrc}</code>
        </p>
      </main>
    </>
  );
}
