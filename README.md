# NutriSnap

An AI-powered calorie and nutrition tracking mobile app. Take a photo of any meal and get instant nutritional analysis powered by OpenAI vision. Track your daily intake, set macro goals, and review weekly and monthly analytics.

---

## Features

- **Photo-based food analysis** — Snap a picture of your meal and the AI identifies each food item, estimates portion sizes, and calculates calories, protein, carbs, and fats
- **Daily tracking** — Log meals throughout the day and see your running totals vs. goals
- **Macro goals** — Set personalized daily targets for calories, protein, carbs, and fats
- **Analytics** — Weekly and monthly charts showing calorie trends and macro breakdowns
- **Health score** — AI rates each meal 1–10 based on nutritional quality
- **Dark theme** — Orange accent, inspired by CalAI

---

## Tech Stack

### Mobile App
| Tool | Purpose |
|---|---|
| [Expo](https://expo.dev) (SDK 54) | React Native framework |
| [expo-router](https://expo.github.io/router) | File-based navigation |
| [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | Camera and gallery access |
| [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) | Reading image data |
| [@tanstack/react-query](https://tanstack.com/query) | Server state and caching |
| [react-native-svg](https://github.com/software-mansion/react-native-svg) | Circular progress chart |
| [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) | Safe area handling |
| [@expo/vector-icons](https://docs.expo.dev/guides/icons/) | Feather icon set |
| [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | Tactile feedback |

### API Server
| Tool | Purpose |
|---|---|
| [Express 5](https://expressjs.com) | HTTP server |
| [OpenAI gpt-5.2](https://platform.openai.com) | Vision-based food analysis |
| [Drizzle ORM](https://orm.drizzle.team) | Database queries and migrations |
| [Zod](https://zod.dev) | Request validation |
| [Pino](https://getpino.io) | Structured logging |

### Database & Infrastructure
| Tool | Purpose |
|---|---|
| PostgreSQL | Persistent storage for meals, settings, analytics |
| pnpm workspaces | Monorepo package management |
| TypeScript | End-to-end type safety |

---

## Project Structure

```
nutrisnap/
├── artifacts/
│   ├── api-server/          # Express API (port 8080)
│   │   └── src/
│   │       ├── routes/      # meals, settings, analytics, health
│   │       └── app.ts       # Express app setup
│   └── calorie-tracker/     # Expo React Native app
│       ├── app/
│       │   ├── (tabs)/      # Home, Analytics, Settings tabs
│       │   ├── scan.tsx     # Camera/photo analysis screen
│       │   └── meal-result.tsx
│       └── components/      # CircularProgress, MacroCard, MealCard
├── lib/
│   ├── db/                  # Drizzle schema + migrations
│   └── integrations-openai-ai-server/   # OpenAI client wrapper
└── pnpm-workspace.yaml
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [pnpm](https://pnpm.io) 9+
- [Expo Go](https://expo.dev/go) app on your phone (iOS or Android)
- A Replit account (for managed OpenAI access and PostgreSQL)

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd nutrisnap
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section for details on each variable.

### 4. Set up the database

Push the Drizzle schema to your PostgreSQL database:

```bash
pnpm --filter @workspace/db run push
```

### 5. Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

The API will be available at `http://localhost:8080`.

### 6. Start the Expo app

```bash
pnpm --filter @workspace/calorie-tracker run dev
```

Scan the QR code with the Expo Go app on your phone, or press `w` to open the web version.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Yes | OpenAI proxy base URL (auto-provisioned on Replit) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Yes | OpenAI API key (auto-provisioned on Replit) |
| `EXPO_PUBLIC_DOMAIN` | Yes | Domain for the mobile app to reach the API (e.g. your Replit dev domain) |
| `NODE_ENV` | No | `development` or `production` (default: `development`) |
| `PORT` | No | API server port (default: `8080`) |
| `LOG_LEVEL` | No | Pino log level: `trace`, `debug`, `info`, `warn`, `error` (default: `info`) |

### OpenAI Access

This project uses Replit's managed OpenAI integration — no OpenAI account needed. The `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY` variables are provisioned automatically when running on Replit.

To use a self-hosted setup outside Replit, replace these with a valid OpenAI base URL and API key, and update the model in `artifacts/api-server/src/routes/meals.ts` to `gpt-4o` (which supports vision via the standard API).

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/meals/analyze` | Analyze a food photo (base64) with AI |
| `GET` | `/api/meals?date=YYYY-MM-DD` | Get meals for a specific date |
| `POST` | `/api/meals` | Save an analyzed meal |
| `DELETE` | `/api/meals/:id` | Delete a saved meal |
| `GET` | `/api/analytics/daily?date=YYYY-MM-DD` | Daily summary with goal progress |
| `GET` | `/api/analytics/weekly?startDate=YYYY-MM-DD` | Weekly calorie and macro averages |
| `GET` | `/api/analytics/monthly?year=YYYY&month=M` | Monthly calorie and macro averages |
| `GET` | `/api/settings` | Get user nutrition goals |
| `PUT` | `/api/settings` | Update nutrition goals |
| `GET` | `/api/health` | Health check |

---

## Development Notes

- The monorepo uses **pnpm workspaces** — always run commands from the root using `--filter`
- The mobile app communicates with the API via the `EXPO_PUBLIC_DOMAIN` env var; on Replit this is set automatically
- Database migrations are managed with Drizzle Kit — run `pnpm --filter @workspace/db run push` after any schema changes
- The API server rebuilds on every start (`pnpm run build && pnpm run start`) — for watch mode during development, modify the `dev` script to use `tsc --watch`

---

## License

MIT
