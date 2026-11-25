import Link from "next/link";

export default function GameCard({ game }) {
  const androidOnly = !game.platforms.web;
  return (
    <Link href={`/games/${game.slug}`} className="card" style={{ "--accent": game.accent }}>
      <div className="cardTop">
        <span className="cardGlyph" aria-hidden="true">{game.title.charAt(0)}</span>
        <span className="tag">{game.genre}</span>
      </div>
      <h3 className="cardTitle">{game.title}</h3>
      <p className="cardText">{game.tagline}</p>
      <span className="cardCta">
        {androidOnly ? "Android · coming soon" : "Play in browser →"}
      </span>
    </Link>
  );
}
