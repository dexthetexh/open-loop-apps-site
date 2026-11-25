import { useEffect, useRef } from "react";
import { ADS } from "../../lib/site";

/** Renders an AdSense unit only when ads are enabled AND a real slot id exists. */
export default function AdSlot({ slot }) {
  const id = ADS.slots[slot] || "";
  const ref = useRef(null);
  const active = ADS.enabled && ADS.client && id;

  useEffect(() => {
    if (!active || !ref.current || ref.current.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* blocked or not loaded yet */
    }
  }, [active]);

  if (!active) return null;
  return (
    <aside className="adSlot" aria-label="Advertisement">
      <div className="adLabel">Advertisement</div>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADS.client}
        data-ad-slot={id}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
