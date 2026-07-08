# CodeArena (Codeverse)

CodeArena is an interactive, real-time competitive coding platform where developers can battle each other in coding challenges, earn XP, level up their rank, and track their daily coding activity.

## 🚀 Features

- **Real-time Matchmaking**: Compete against other players in live coding battles via WebSockets (Socket.IO).
- **Gamification**: Earn XP, coins, and climb the ranks from Bronze upwards as you win matches.
- **Activity Heatmap**: Track your daily coding submissions and progress similar to GitHub's contribution graph.
- **LeetCode Integration**: Verify your problem-solving skills seamlessly by linking your LeetCode profile.
- **In-browser IDE**: Powerful code editor powered by Monaco Editor.
- **AI Integration**: Features Google GenAI for dynamic interactions and insights.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with Vite
- **Styling**: Styled-components
- **Editor**: Monaco Editor
- **Routing**: React Router
- **Real-time**: Socket.IO Client

### Backend
- **Server**: Node.js & Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.IO
- **Authentication**: JWT & bcryptjs
- **AI**: Google GenAI SDK

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL

### 1. Clone the repository
```bash
git clone https://github.com/Gag-an/CodeArena.git
cd CodeArena
```

### 2. Backend Setup
```bash
cd backend
npm install
```
- Create a `.env` file in the `backend` directory based on your configuration. You will need:
  - `DATABASE_URL` (PostgreSQL connection string)
  - `JWT_SECRET`
  - Other required API keys
- Run database migrations:
```bash
npx prisma db push
```
- Start the development server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```

The frontend will usually be accessible at `http://localhost:5173/` and the backend at `http://localhost:3000/` (depending on your env configuration).

## 📄 License
ISC
