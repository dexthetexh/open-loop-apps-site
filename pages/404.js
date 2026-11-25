import Link from "next/link";
import Seo from "../components/Seo";

export default function NotFound() {
  return (
    <>
      <Seo title="Page not found" path="/404" noindex />
      <section className="hero">
        <h1 className="h1">Lost the loop.</h1>
        <p className="lead">That page does not exist.</p>
        <div className="heroActions">
          <Link className="btn btnPrimary" href="/games">Browse games</Link>
          <Link className="btn btnGhost" href="/">Home</Link>
        </div>
      </section>
    </>
  );
}
