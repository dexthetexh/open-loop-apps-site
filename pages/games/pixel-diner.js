import Head from "next/head";
import Link from "next/link";
import { getPrevNextSlug } from "../../lib/games";

const CANONICAL_BASE = "https://openloopapps.com";

export default function PixelDinerPage() {
  const slug = "pixel-diner";
  const { prev, next } = getPrevNextSlug(slug);
  const iframeSrc = `/play/${slug}/index.html`;

  return (
    <>
      <Head>
        <title>{`Pixel Diner | Open Loop Apps`}</title>
        <meta name="description" content="Serve, upgrade, and survive the rush." />
        <link rel="canonical" href={`${CANONICAL_BASE}/games/${slug}`} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">Pixel Diner</h1>
          <p className="subtitle">Serve, upgrade, and survive the rush.</p>

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

        <div className="gameFrameWrap" role="region" aria-label="Pixel Diner game">
          <iframe
            className="gameFrame"
            src={iframeSrc}
            title="Pixel Diner"
            loading="eager"
            allow="fullscreen; gamepad; autoplay; vibration; accelerometer; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups"
          />
        </div>
      </main>
    </>
  );
}
