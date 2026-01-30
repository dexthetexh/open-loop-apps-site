// File: /pages/games/echokeys-scaletrainer.js
import Head from "next/head";
import Link from "next/link";
import { getPrevNextSlug } from "../../lib/games";

const CANONICAL_BASE = "https://openloopapps.com";

export default function EchoKeysScaleTrainerPage() {
  const slug = "echokeys-scaletrainer";
  const { prev, next } = getPrevNextSlug(slug);

  const canonical = `${CANONICAL_BASE}/games/${slug}`;
  const iframeSrc = `/play/${slug}/index.html`;

  return (
    <>
      <Head>
        <title>{`EchoKeys ScaleTrainer | Open Loop Apps`}</title>
        <meta name="description" content="Practice scales by pattern, tempo, and accuracy." />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">EchoKeys ScaleTrainer</h1>
          <p className="subtitle">Practice scales by pattern, tempo, and accuracy.</p>

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

        <div className="gameFrameWrap" role="region" aria-label="EchoKeys ScaleTrainer game">
          <iframe
            className="gameFrame"
            src={iframeSrc}
            title="EchoKeys ScaleTrainer"
            loading="eager"
            allow="fullscreen; gamepad; autoplay; vibration; accelerometer; gyroscope"
            sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms allow-modals allow-popups"
          />
        </div>

        <p className="smallNote" style={{ marginTop: 12 }}>
          Loaded from: <code>{iframeSrc}</code>
        </p>
      </main>
    </>
  );
}
