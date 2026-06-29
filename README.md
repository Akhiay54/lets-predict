# FIFA Predict 2026 🏆

A premium World Cup 2026 prediction league app — dark mode, animated bracket, leaderboard, and multiplayer support. No cloud required.

## Quick Start

```bash
cd fifapredict
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## How to Play with 4-5 Friends

### Same WiFi (easiest)

1. Find your local IP: `ipconfig getifaddr en0` (Mac)
2. Everyone opens `http://192.168.x.x:3000` in their browser
3. Each person enters their name
4. One person creates a league (becomes owner)
5. Owner shares the **invite code** — friends click **Join League** and enter it
6. Everyone fills out their bracket
7. Owner sets official results at `/admin`
8. Leaderboard auto-updates

### Remote Friends (ngrok)

```bash
npx ngrok http 3000
```

Share the generated URL — anyone worldwide can join.

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Home | `/` | Dashboard / welcome screen |
| Bracket | `/bracket` | Fill out your 32-team bracket |
| Leaderboard | `/leaderboard` | Rankings with scoring breakdown |
| League | `/league` | Create or join a league |
| Admin | `/admin` | **Owner only** — set official results |
| Login | `/login` | Enter your name |

---

## Scoring System

| Round | Points per correct pick |
|-------|------------------------|
| Round of 32 | 3 pts |
| Round of 16 | 5 pts |
| Quarter Finals | 8 pts |
| Semi Finals | 12 pts |
| Final | 20 pts |
| Correct Champion | 30 pts |

**Tiebreaker**: Predict total goals in the Final. Closest to actual wins ties.

---

## Tech Stack

- **Next.js 15** + React 19 + TypeScript
- **Tailwind CSS v4** — dark-mode-first design
- **Framer Motion** — bracket animations, transitions
- **Zustand** — global state management
- **React Hook Form + Zod** — form validation
- **localStorage** — zero-config persistence

---

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Home / Dashboard
│   ├── bracket/      # Bracket editor
│   ├── leaderboard/  # Rankings
│   ├── league/       # League management
│   ├── admin/        # Official results (owner)
│   └── login/        # Name entry
├── components/
│   ├── bracket/      # BracketView, MatchCard, ChampionDisplay
│   ├── league/       # CreateLeagueModal, JoinLeagueModal, LeagueCard
│   ├── leaderboard/  # LeaderboardTable
│   ├── shared/       # Navbar, TeamFlag, PlayerAvatar, CountdownTimer
│   └── ui/           # Button, Card, Dialog, Select, Badge, Progress
├── lib/
│   ├── bracket.ts    # Winner propagation logic
│   ├── scoring.ts    # Points calculation & leaderboard
│   ├── storage.ts    # localStorage helpers
│   ├── constants.ts  # Teams, matches, scoring config
│   └── utils.ts      # cn, flags, formatting
├── store/
│   └── useAppStore.ts # Zustand store (all app state)
└── types/
    └── index.ts       # TypeScript interfaces
```
