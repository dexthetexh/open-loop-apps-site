import { useEffect, useRef, useState } from "react";
import { ADS } from "../../lib/site";
import { SLOTS, PLACEMENT_LABELS, isAdPreview } from "../../lib/ads";

/**
 * One AdSense display unit. Renders only when ads are enabled and the
 * placement has a real ad unit id. With `?adslots` in the URL it draws an
 * outline instead, so every location can be reviewed before ids exist.
 */
export default function AdSlot({ placement }) {
  const id = SLOTS[placement] || "";
  const live = ADS.enabled && Boolean(ADS.client) && Boolean(id);
  const ref = useRef(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => setPreview(isAdPreview()), []);

  useEffect(() => {
    if (!live || preview || !ref.current || ref.current.getAttribute("data-adsbygoogle-status")) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      /* blocked or script not loaded yet */
    }
  }, [live, preview]);

  if (preview) {
    return (
      <aside className="adSlot adPreview" data-placement={placement}>
        <strong>Ad slot: {placement}</strong>
        <span>{PLACEMENT_LABELS[placement]}</span>
        <span className={live ? "ok" : "warn"}>
          {id ? `unit ${id}` : "no ad unit id"} · ads {ADS.enabled ? "on" : "off"}
          {ADS.testMode ? " · test mode" : ""}
        </span>
      </aside>
    );
  }

  if (!live) return null;
  return (
    <aside className="adSlot" aria-label="Advertisement" data-placement={placement}>
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
