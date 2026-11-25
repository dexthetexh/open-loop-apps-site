import { useRef, useState, useEffect } from "react";
import { playPath } from "../lib/games";

export default function GameEmbed({ game }) {
  const wrapRef = useRef(null);
  const [canFs, setCanFs] = useState(false);
  const src = playPath(game.slug);

  useEffect(() => {
    setCanFs(Boolean(document.fullscreenEnabled || document.webkitFullscreenEnabled));
  }, []);

  const goFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };

  return (
    <section aria-label={`${game.title} game`}>
      <div ref={wrapRef} className={`frameWrap frame-${game.frame}`}>
        <iframe
          className="frame"
          src={src}
          title={game.title}
          allow="fullscreen; gamepad; autoplay; accelerometer; gyroscope"
        />
      </div>
      <div className="frameActions">
        {canFs ? (
          <button type="button" className="btn" onClick={goFullscreen}>
            Fullscreen
          </button>
        ) : null}
        <a className="btn btnGhost" href={src}>
          Open standalone ↗
        </a>
      </div>
    </section>
  );
}
