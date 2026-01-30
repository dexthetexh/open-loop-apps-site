import Head from "next/head";
import Link from "next/link";

const CANONICAL_BASE = "https://openloopapps.com";

// Hub ordering for placeholder pages (kept local; not part of WEB_GAMES)
const PLACEHOLDERS = ["idle-cyber-defense", "tap-escape-speedrun"];

function getPrevNextPlaceholder(slug) {
  const idx = PLACEHOLDERS.indexOf(slug);
  if (idx < 0 || PLACEHOLDERS.length === 0) return { prev: null, next: null };
  const len = PLACEHOLDERS.length;
  return {
    prev: PLACEHOLDERS[(idx - 1 + len) % len],
    next: PLACEHOLDERS[(idx + 1) % len],
  };
}

export default function TapEscapeSpeedrunPage() {
  const slug = "tap-escape-speedrun";
  const { prev, next } = getPrevNextPlaceholder(slug);
  const canonical = `${CANONICAL_BASE}/games/${slug}`;

  return (
    <>
      <Head>
        <title>{`Tap Escape Speedrun | Open Loop Apps`}</title>
        <meta
          name="description"
          content="Tap Escape Speedrun is an Android title. Store listing coming soon."
        />
        <link rel="canonical" href={canonical} />
      </Head>

      <main className="page">
        <header className="page-header">
          <h1 className="h1">Tap Escape Speedrun</h1>
          <p className="subtitle">
            Android app (placeholder). The Play Store listing will be linked here when live.
          </p>

          <div className="navRow" aria-label="Catalog navigation">
            <Link className="navGhost" href="/games">← Games</Link>

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

        <section className="panel" aria-label="Status">
          <h2 className="h2">Status</h2>
          <p className="cardText">
            Coming soon. This page exists for catalog completeness and indexing.
          </p>
          <p className="cardText">
            Next: Play Store link, screenshots, short feature list, and release notes.
          </p>

          <div className="navRow" aria-label="Actions">
            <span className="navGhost" aria-disabled="true">
              Play Store (soon)
            </span>
          </div>
        </section>
      </main>
    </>
  );
}
