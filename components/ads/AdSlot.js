import { useEffect, useRef } from "react";

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export default function AdSlot({
  slot,
  className,
  label = "Advertisement",
  style,
  disabled = false,
}) {
  const insRef = useRef(null);

  useEffect(() => {
    if (!ADS_ENABLED || !CLIENT || !slot || disabled) return;

    const el = insRef.current;
    if (!el) return;

    if (el.getAttribute("data-adsbygoogle-status")) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // ad blockers / script timing — safe to ignore
    }
  }, [slot, disabled]);

  if (!ADS_ENABLED || !CLIENT || !slot || disabled) return null;

  return (
    <div className={className} style={style}>
      <div className="ad-label">{label}</div>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
