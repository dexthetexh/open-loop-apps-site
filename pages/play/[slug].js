// File: /pages/play/[slug].js
const SLUGS = [
  "echokeys",
  "echokeys-scaletrainer",
  "flappy-bird",
  "pixel-diner",
  "idle-cyber-defense",
  "tap-escape-speedrun",
];

export async function getStaticPaths() {
  return {
    paths: SLUGS.map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}

export async function getStaticProps({ params }) {
  return {
    redirect: {
      destination: `/games/${params.slug}`,
      permanent: true,
    },
  };
}

export default function PlayRedirect() {
  return null;
}
