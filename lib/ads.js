// Every ad location on the site. Each one is filled by its own env var
// (an AdSense ad unit id). Empty = that placement renders nothing.
// Env vars must be referenced literally so Next inlines them at build time.

export const SLOTS = {
  site_footer:    process.env.NEXT_PUBLIC_ADSENSE_SLOT_SITE_FOOTER || "",
  home_inline:    process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_INLINE || "",
  catalog_top:    process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATALOG_TOP || process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATALOG || "",
  catalog_bottom: process.env.NEXT_PUBLIC_ADSENSE_SLOT_CATALOG_BOTTOM || "",
  game_top:       process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME_TOP || "",
  game_bottom:    process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME_BOTTOM || process.env.NEXT_PUBLIC_ADSENSE_SLOT_GAME || "",
};

export const PLACEMENT_LABELS = {
  site_footer: "All pages · above footer",
  home_inline: "Home · after game grid",
  catalog_top: "Games catalog · top",
  catalog_bottom: "Games catalog · bottom",
  game_top: "Game page · above title",
  game_bottom: "Game page · after details",
};

/** `?adslots` in the URL outlines every placement, configured or not. */
export function isAdPreview() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).has("adslots");
}
