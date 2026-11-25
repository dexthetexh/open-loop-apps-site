import Seo from "../components/Seo";
import { SITE } from "../lib/site";

export default function Contact() {
  return (
    <>
      <Seo title="Contact" path="/contact" description="Support, feedback and business inquiries for Open Loop Apps." />
      <article className="prose">
        <h1 className="h1">Contact</h1>
        <p>Support, feedback and business inquiries.</p>
        <p>
          <a className="btn btnPrimary" href={`mailto:${SITE.email}`}>{SITE.email}</a>
        </p>
        <h2 className="h2">For bug reports, include</h2>
        <ul className="list">
          <li>Which game</li>
          <li>Device and browser</li>
          <li>What you expected and what happened</li>
          <li>A screenshot if you can</li>
        </ul>
      </article>
    </>
  );
}
