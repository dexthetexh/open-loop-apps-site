import Head from "next/head";
import { SITE, absoluteUrl } from "../lib/site";

export default function Seo({ title, description = SITE.description, path = "/", image = "/og.png", jsonLd, noindex }) {
  const fullTitle = title ? `${title} | ${SITE.name}` : `${SITE.name} | Free browser games`;
  const url = absoluteUrl(path);
  const img = absoluteUrl(image);
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex ? <meta name="robots" content="noindex" /> : null}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      {jsonLd ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      ) : null}
    </Head>
  );
}
