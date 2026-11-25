import Link from "next/link";
import { useRouter } from "next/router";
import { SITE } from "../lib/site";
import AdSlot from "./ads/AdSlot";

const NAV = [
  { href: "/games", label: "Games" },
  { href: "/privacy", label: "Privacy", hideSm: true },
  { href: "/contact", label: "Contact" },
];

export default function Layout({ children }) {
  const { pathname } = useRouter();
  const isActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <header className="siteHeader">
        <div className="wrap siteHeaderInner">
          <Link href="/" className="brand" aria-label={`${SITE.name} home`}>
            <img src="/icon.svg" alt="" width="28" height="28" />
            <span>{SITE.name}</span>
          </Link>
          <nav aria-label="Primary">
            <ul className="navList">
              {NAV.map((n) => (
                <li key={n.href} className={n.hideSm ? "navHideSm" : undefined}>
                  <Link href={n.href} aria-current={isActive(n.href) ? "page" : undefined}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" className="wrap main">
        {children}
        {pathname !== "/404" ? <AdSlot placement="site_footer" /> : null}
      </main>

      <footer className="siteFooter">
        <div className="wrap siteFooterInner">
          <span>© {new Date().getFullYear()} {SITE.name}</span>
          <nav className="footLinks" aria-label="Footer">
            <Link href="/games">Games</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
