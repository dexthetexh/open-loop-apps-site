# Open Loop Apps Website

This simple web application provides a home for **Idle Cyber Defense** and **Tap Escape Speedrun**—two Android games created as part of the Open Loop Apps project.  It’s built with [Next.js](https://nextjs.org/) and can be deployed directly to [Vercel](https://vercel.com/).

## Running locally

1. **Install dependencies:** Make sure you have Node.js (>= 16) installed. In the project root run:

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run dev
   ```

   Your application should now be running at `http://localhost:3000`.

## Deploying to Vercel

1. Sign in to Vercel and create a new project. When prompted, import this Git repository.
2. Set up the project with the `open-loop-apps` directory as the root.
3. Vercel will detect the Next.js framework automatically; no additional configuration is needed.
4. Deploy! Vercel will install dependencies, build the site and host it at your chosen domain.

## Structure

- `pages/index.js` – The home page introducing the Open Loop Apps project.
- `pages/games/index.js` – Lists available games with brief descriptions and links.
- `pages/games/idle-cyber-defense.js` – Product page for Idle Cyber Defense summarising the idle strategy game and linking to the Play Store.
- `pages/games/tap-escape-speedrun.js` – Product page for Tap Escape Speedrun, a reflex‑based tapping game.
- `components/Navbar.js` and `components/Footer.js` – Reusable navigation and footer components.

## Licence

This project is provided for educational purposes and does not include any proprietary code or assets from the original games.  It’s licensed under the MIT licence; see `LICENSE` for details.