# Arena Master - Esports Tournament Management System

Arena Master is a clean, modern, and beginner-friendly web application for managing esports tournaments (specifically structured around popular formats like Battlegrounds Mobile India (BGMI) or Free Fire). 

This project features a fully dynamic Single-Page Application (SPA) dashboard styled with a premium dark-mode esports theme, a Node.js + Express REST API backend, and a relational MySQL database pool.

---

## 🚀 Key Features

- **Admin Authentication**: Secure login portal with password hashing (`bcryptjs`) and JWT session verification.
- **Dynamic Stats Aggregator**: Summary cards counting tournaments, approved rosters, registered players, and live match counters in real time.
- **Roster & Team Management**: Public registration queues, admin approval triggers, tactical role assignments (IGL, Support, Assaulter), and tournament slot allocations.
- **Live Match Scoring**: Schedule upcoming faceoffs, update scores on the fly for live arenas, and select game winners.
- **Recalculating Standings (Points Table)**: Auto-calculation of wins, losses, kills, and points based on completed matches (1 Kill = 1 Point, Win Bonus = +10 Points).
- **Search & Filters**: Multi-criteria filters on matches (by game, status, tournament), teams (status and keywords), and players.
- **CSV Data Exporter**: Simple formatted CSV sheet downloads for team listings and match history.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla ES6 JavaScript (Modular structure), Tailwind CSS v4 (Official `@tailwindcss/browser` Play CSS-First CDN).
- **Backend**: Node.js + Express.js.
- **Database**: MySQL (using promise-based `mysql2` client library).
- **Authentication**: JWT (JSON Web Tokens).

---

## 📂 Project Structure

```text
/
├── package.json             # Node dependencies and running scripts
├── server.js                # Express server entry point & static folder serving
├── .env.example             # Environment config template
├── schema.sql               # Database tables setup and sample seed data
├── config/
│   └── db.js                # Promise-based MySQL connection pool
├── middleware/
│   └── auth.js              # JWT Admin verification middleware
├── controllers/
│   ├── authController.js    # Login authentication logic
│   ├── dashboardController.js# Counts and stats aggregation
│   ├── tournamentController.js# Tournament CRUD
│   ├── teamController.js    # Team approval, registration, and tournament mapping
│   ├── playerController.js  # Player details and team mapping
│   └── matchController.js   # Match scoring, scheduling, and standings calculation
├── routes/
│   ├── authRoutes.js
│   ├── dashboardRoutes.js
│   ├── tournamentRoutes.js
│   ├── teamRoutes.js
│   ├── playerRoutes.js
│   └── matchRoutes.js
└── public/                  # Frontend single-page shell (served by server.js)
    ├── login.html           # Admin access portal
    ├── index.html           # Main SPA dashboard shell & dialog modals
    ├── css/
    │   └── styles.css       # Core custom animations, scrollbars, and glows
    └── js/
        ├── app.js           # Core router, auth guards, CSV exports, dialog actions
        ├── dashboard.js     # Stats loader, live matches, and quick approvals
        ├── tournaments.js   # Tournament grids, form operations, and deletes
        ├── teams.js         # Teams rosters and tournament allocations
        ├── players.js       # Player lists and additions
        ├── matches.js       # Faceoff scheduler and score modifier
        └── leaderboard.js   # Standings and points calculation tables
```

---

## ⚙️ Quick Start Installation

Follow these steps to run Arena Master locally on your system:

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and [MySQL Server](https://dev.mysql.com/downloads/installer/) installed and running.

### 2. Prepare Environment Configuration
Rename `.env.example` to `.env` and fill in your local MySQL details:
```bash
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=esports_db
JWT_SECRET=esports_tournament_manager_super_key_123
```

### 3. Setup MySQL Database
Open your MySQL shell or terminal, connect to your server, and create the database:
```sql
CREATE DATABASE esports_db;
```
Import the `schema.sql` file (which creates all tables and seeds it with realistic team rosters, completed matches, and leaderboards):
```bash
mysql -u root -p esports_db < schema.sql
```
*(If you are using a GUI client like phpMyAdmin, MySQL Workbench, or DBeaver, simply copy the contents of `schema.sql` and run them inside a SQL Query editor).*

### 4. Run the Application
In your project directory, execute the following commands to install packages and launch the server:
```bash
# Install node packages (done automatically if running workspace commands)
npm install

# Start the Express server
npm start
```
On success, you will see the console log:
```text
=================================================
 Esports Tournament Manager Server Started
 Local Server: http://localhost:3000
=================================================
Database connected successfully as ID 12
```

Open **`http://localhost:3000`** in your browser to view the application!

---

## 🔐 Credentials & Testing

- To unlock administrative features (creating tournaments, registering matches, entering scores, approving/rejecting teams, editing rosters), click on **Admin Portal Login** at the bottom of the sidebar.
- **Username**: `admin`
- **Password**: `admin123`

---

## 💡 Developer Guidelines
- All calculations for wins, losses, matches played, and points are computed dynamically from completed matches to prevent database desynchronization. If you edit or delete a match, the leaderboard will automatically adjust the scores.
- Standard HTML `<dialog>` elements are utilized for modals with the modern `closedby="any"` attribute. A custom bounds-checking click event is integrated as a fallback to ensure light-dismiss functions on Safari.
- Custom CSS uses native Tailwind CSS v4 styling structure.
