# 🎭 Who's the Spy — Discord Party Game Bot

A Discord bot implementing the social deduction word game **Undercover** (similar to Spyfall / Who is the Spy). Players are secretly assigned words and must identify impostors through clue-giving and voting.

## 🎮 How It Works

### Roles
- **✅ Civilian** — Receives the common word. Majority of players.
- **🕵️ Undercover** — Receives a *similar but different* word. Must blend in.
- **👻 Mr. White** — Receives *no word*. Must bluff using context from others' clues.

### Game Flow
1. **Lobby** — Players join via button. Host starts when 4–12 players are ready.
2. **Role Assignment** — Roles & words are secretly DM'd to each player.
3. **Clue Phase** — In randomized order, each player submits a one-word/phrase clue via popup modal.
4. **Discussion** — 60-second open discussion (configurable).
5. **Voting** — All players vote simultaneously. Hidden tally until complete.
6. **Elimination** — Most-voted player is eliminated; role revealed.
   - If Mr. White is eliminated, they get one chance to guess the civilian word!
7. **Repeat** until Civilians eliminate all impostors, or impostors overtake Civilians.

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v20.6+ (LTS recommended)
- A Discord bot token ([Developer Portal](https://discord.com/developers/applications))

### Setup

```bash
# 1. Clone and install
git clone <your-repo-url>
cd undercover
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your bot token, client ID, and optional guild ID

# 3. Register slash commands
npm run deploy

# 4. Start the bot
npm run build
npm start
```

### Development
```bash
# Run directly with TypeScript (no build step)
npm run dev
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DISCORD_TOKEN` | ✅ | Your bot token |
| `CLIENT_ID` | ✅ | Application (client) ID |
| `GUILD_ID` | ❌ | Dev guild ID for instant command registration |

### Bot Permissions
When adding the bot to your server, ensure these permissions:
- Send Messages
- Embed Links
- Use Application Commands
- Read Message History

**OAuth2 Scopes:** `bot`, `applications.commands`

## 📝 Commands

| Command | Description |
|---|---|
| `/whosthespy start` | Create a lobby and start a new game |
| `/whosthespy status` | View current game phase, players, and round |
| `/whosthespy end` | Force-end the current game (host or admin) |

### In-Game Controls
- **Join/Leave** buttons in the lobby
- **Mr. White toggle** in lobby settings
- **Give Clue** button opens a popup modal on your turn
- **Vote** buttons to eliminate a player

## 🏗️ Architecture

```
src/
├── index.ts                  # Bot entry point
├── deploy.ts                 # Slash command registration
├── config.ts                 # Constants, colours, custom ID system
├── types.ts                  # TypeScript interfaces & enums
├── commands/
│   └── undercover.ts         # Slash command definition & routing
├── game/
│   ├── GameManager.ts        # In-memory game state storage
│   ├── PhaseRunner.ts        # Main game loop orchestrator
│   ├── RoleAssigner.ts       # Role distribution algorithm
│   └── WinChecker.ts         # Win condition evaluator
├── phases/
│   ├── LobbyPhase.ts         # Join/leave/start lobby
│   ├── CluePhase.ts          # Turn-by-turn clue via modals
│   ├── DiscussionPhase.ts    # Timed discussion countdown
│   ├── VotePhase.ts          # Simultaneous button voting
│   └── EliminationPhase.ts   # Role reveal + Mr. White guess
├── ui/
│   ├── embeds.ts             # All embed builders
│   ├── buttons.ts            # All button/action row builders
│   └── modals.ts             # Clue & guess modal builders
├── data/
│   └── wordPairs.ts          # 85 curated word pairs
└── utils/
    ├── shuffle.ts            # Fisher-Yates shuffle
    ├── timer.ts              # Cancellable timer utility
    └── dmSender.ts           # Safe DM with error handling
```

## 🎯 Role Distribution

| Players | Civilians | Undercover | Mr. White* |
|---------|-----------|------------|------------|
| 4       | 3         | 1          | 0          |
| 5       | 3         | 1          | 1          |
| 6       | 4         | 1          | 1          |
| 7       | 5         | 1          | 1          |
| 8       | 5         | 2          | 1          |
| 9       | 6         | 2          | 1          |
| 10      | 7         | 2          | 1          |
| 11      | 8         | 2          | 1          |
| 12      | 8         | 3          | 1          |

*\*Mr. White can be toggled off in lobby settings.*

## 🛠️ Tech Stack

- **TypeScript** with strict mode
- **discord.js v14** — Slash commands, buttons, modals, embeds
- **Node.js** — Runtime
- **In-memory state** — `Map<guildId, GameState>` (no database needed)

## 📦 Deployment

Runs standalone via `node dist/index.js`. Compatible with:
- **Railway** / **Render** — Set env vars in dashboard, use `npm run build && npm start`
- **EC2 / VPS** — Use PM2: `pm2 start dist/index.js --name whosthespy`
- **Docker Compose** — We provide a Dockerfile and docker-compose.yml. To run with Docker, make sure your `.env` is configured, then run:
  ```bash
  docker-compose up -d
  ```

## 📄 License

MIT
