import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADS_ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

type Props = {
  slot: string;
  label?: string;
  className?: string;
};

export default function AdSlot({ slot, label = "Advertisement", className }: Props) {
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!ADS_ENABLED || !CLIENT || !slot) return;
    if (!insRef.current) return;

    // Prevent double-push during hydration
    if (insRef.current.getAttribute("data-adsbygoogle-status")) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // adblock / script delay – safe to ignore
    }
  }, [slot]);

  if (!ADS_ENABLED) return null;

  return (
    <div className={className}>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: 6 }}>
        {label}
      </div>
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
