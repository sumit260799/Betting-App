# 🏏 APL 2026 - Acceleron Premier League Betting Application

A full-stack, real-time sports betting application built for the **Acceleron Premier League (APL 2026)** tournament using **React 19**, **Tailwind CSS v4**, **Node.js**, **Express.js**, and **PostgreSQL**.

---

## 🌟 Key Features

1. **Email ID + OTP Authentication**:
   - Secure login using email and 6-digit OTP stored in PostgreSQL with 10-minute expiry.
   - 1-click quick login for real tournament players (Tanmoy, Subhadip, Prosenjit, Sourav D, Santanu, Manisha).
   - JWT session management with auto-credited ₹1,000 wallet balance for new players.

2. **🚫 Strict Anti-Hedging Rule (Dual-Team Prohibition)**:
   - **Enforced at both Database and UI levels**: A player **cannot bet on both teams in a single match** (e.g. In Match 1: Strikers vs Super XI, if you bet on Strikers, you cannot place a bet on Super XI).
   - If attempted, the backend database transaction immediately rejects with HTTP 400: `Forbidden: You have already placed an active bet on the opposing team in this match. You cannot bet on both teams in the same match!`
   - The UI disables the opposing team option with an informative warning banner.

3. **Tournament Lifecycle & Phases**:
   - **Phase 1: League Stage (5 Teams)**: All 5 teams compete across 5 matches (6 overs per match). Players can place stage winner bets or individual match bets.
   - **Phase 2: Semi-Finals (4 Teams)**: Top 4 teams qualify from league standings; 1 team is eliminated. Betting re-opens for the 4 qualified teams.
   - **Phase 3: Grand Final (2 Finalists)**: 2 winners advance to the 10-overs Grand Final. Betting re-opens for the 2 finalist teams.
   - **Champion Settle**: Crown champion, calculate pari-mutuel payouts, credit winners, and trigger celebratory confetti.

4. **Dynamic Pari-Mutuel Odds Engine**:
   - Dynamic real-time calculation: $\text{Odds} = \frac{\text{Total Pot}}{\text{Team Total Bet}}$.
   - Winners receive their stake back plus their proportionate share of the losing pool upon match result declaration.

5. **Official Real Data from APL 2026**:
   - 5 Real Teams: Acceleron Mavericks, Acceleron Knight Riders, Acceleron Strikers, Acceleron Super XI, Acceleron Predator.
   - Real player rosters, jersey sizes (`XXL`, `XL`, `L`, `M`, `S`), and jersey numbers.
   - Strict enforcement of female participation rule (minimum 2 female players, mandatory 1 over bowling, 1 over batting, 1 over fielding).
   - Real schedule times and official playing rules.

6. **Organizer Admin Console**:
   - Protected with admin passcode (`admin2026`).
   - One-click Emergency "STOP ALL BETTING" switch.
   - Individual match betting gates ("Lock Bet" / "Unlock Bet") to stop bets when matches start.
   - Match score recorder: settles match bets and updates the live Points Table.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, Tailwind CSS v4 (`@tailwindcss/vite`), `lucide-react`, `canvas-confetti`, Vite 8.
- **Backend**: Node.js, Express.js, JWT, CORS, Dotenv.
- **Database**: PostgreSQL 19 (`pg` connection pool with row-level locking & ACID transactions).

---

## 🚀 How to Run

### 1. Database & Backend Setup
Ensure PostgreSQL is running on port `5433` (or update `.env` to match your local PostgreSQL configuration):
```bash
# Seed initial tables, teams, players, and fixtures
npm run db:seed

# Start the Express backend server (runs on http://localhost:5000)
npm run server
```

### 2. Frontend Development Server
In a separate terminal:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Production Build
```bash
npm run build
```
*(Builds and lints cleanly with 0 errors).*
