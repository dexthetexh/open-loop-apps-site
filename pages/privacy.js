import Link from "next/link";
import Seo from "../components/Seo";
import { ADS, SITE } from "../lib/site";

export default function Privacy() {
  return (
    <>
      <Seo title="Privacy" path="/privacy" description="How Open Loop Apps handles data: no accounts, local saves, minimal logs." />
      <article className="prose">
        <h1 className="h1">Privacy</h1>
        <p className="muted">Last updated November 2026</p>

        <p>
          {SITE.name} hosts small browser games. There are no accounts and we do not ask for personal
          information.
        </p>

        <h2 className="h2">Game data</h2>
        <p>
          Scores, settings and progress are saved in your browser&apos;s local storage on your device. They
          are never sent to us. Clearing site data in your browser deletes them.
        </p>

        <h2 className="h2">Hosting and analytics</h2>
        <p>
          The site is served by Cloudflare. Like any web host, it processes standard request data (such as IP
          address and user agent) for security and performance. We use Cloudflare Web Analytics to count page
          views. It sets no cookies and does not track you across sites.
        </p>

        <h2 className="h2">Advertising</h2>
        {ADS.enabled ? (
          <p>
            Pages and games may show ads from Google AdSense. Inside games, ads appear only between rounds,
            never during play. Google and its partners may use cookies to serve and measure ads. You can manage
            ad personalization at{" "}
            <a href="https://adssettings.google.com" rel="noopener">adssettings.google.com</a>.
          </p>
        ) : (
          <p>The site currently shows no ads. This section will be updated before any are enabled.</p>
        )}

        <h2 className="h2">Children</h2>
        <p>We do not knowingly collect personal information from anyone, including children under 13.</p>

        <h2 className="h2">Contact</h2>
        <p>
          Questions: <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or the <Link href="/contact">contact page</Link>.
        </p>
      </article>
    </>
  );
}
