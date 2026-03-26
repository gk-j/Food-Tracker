# Workspace

## Overview

NutriSnap — AI-powered calorie and nutrition tracking mobile app. Users photograph their meals and AI automatically extracts food items, calories, protein, carbs, and fats. Includes analytics with weekly/monthly charts and a dark-themed UI inspired by CalAI.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Mobile**: Expo (React Native) with Expo Router
- **AI**: OpenAI GPT-5.2 vision for food image analysis (via Replit AI Integrations)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── calorie-tracker/    # Expo React Native mobile app
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   └── integrations-openai-ai-server/ # OpenAI AI integration (server)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Features

- **Home screen**: Daily calorie & macro ring charts, meal history with swipe-to-delete
- **Food Scanner**: Camera/gallery image upload → AI analysis → nutritional breakdown
- **Meal Result**: Shows detected food items, calories, protein, carbs, fats, health score (1-10)
- **Analytics**: Weekly/monthly bar charts, average macros, macro breakdown pie
- **Settings**: Configurable daily goals for calories, protein, carbs, fats

## API Endpoints

- `GET /api/healthz` — Health check
- `POST /api/meals/analyze` — Analyze food image with GPT-5.2 vision
- `GET /api/meals?date=YYYY-MM-DD` — Get meals for date
- `POST /api/meals` — Log a meal
- `DELETE /api/meals/:id` — Delete a meal
- `GET /api/analytics/daily?date=` — Daily summary
- `GET /api/analytics/weekly?startDate=` — Weekly data
- `GET /api/analytics/monthly?year=&month=` — Monthly data
- `GET /api/settings` — Get user goals
- `PUT /api/settings` — Update user goals

## Database Schema

- `meals` — meal records with food items (jsonb), totals, image URL
- `user_settings` — daily macro/calorie goals

## Colors

Dark theme with:
- Background: #0A0A0A
- Accent (calories): #FF6B35 (orange)
- Protein: #E84393 (pink)
- Carbs: #F59E0B (amber)
- Fats: #3B82F6 (blue)
