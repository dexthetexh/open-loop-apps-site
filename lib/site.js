export const SITE = {
  name: "Open Loop Apps",
  url: "https://openloopapps.com",
  description:
    "Free browser games with clear loops: no accounts, no installs, progress saved on your device.",
  email: "contact@openloopapps.com",
  themeColor: "#050b16",
};

export const ADS = {
  enabled: process.env.NEXT_PUBLIC_ADS_ENABLED === "true",
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "",
  testMode: process.env.NEXT_PUBLIC_ADS_TEST_MODE === "true",
  // Real ad unit IDs only. Empty means the slot renders nothing.
  slots: {
    catalog: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATALOG || "",
    game: process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME || "",
  },
};

export function absoluteUrl(path = "/") {
  // Pages are exported as folders, so canonical URLs end with a slash
  const p = /\.[a-z0-9]+$/i.test(path) || path.endsWith("/") ? path : `${path}/`;
  return new URL(p, SITE.url).toString();
}
