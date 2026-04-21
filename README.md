# Lab Inventory Management System

Public, read-only lab inventory viewer with real-time updates, search, sort, and Excel export. Data is managed by repo contributors directly via backend scripts.

## Features

- Browse all inventory items in a searchable, sortable table
- Dashboard with total items and category counts
- Activity log showing recent changes
- Export inventory to Excel
- Real-time updates via WebSocket (changes appear instantly for all viewers)
- Dark mode toggle

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS + Socket.IO Client
- **Backend:** Node.js + Express + Sequelize + SQLite + Socket.IO

## Setup (Local Development)

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

For local dev with Vite, set:

```env
PORT=4000
CLIENT_URL=http://localhost:5173
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173` — no login needed.

## Raspberry Pi (Office LAN, Single Port)

Run the app on Raspberry Pi and serve frontend + backend from one URL.

### 1) Copy project to Pi

```bash
rsync -avz --exclude node_modules --exclude "*.db" \
  /path/to/lab-inventory/ \
  pi@<PI_IP>:/home/pi/lab-inventory/
```

### 2) Install Node.js + dependencies on Pi

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs

cd /home/pi/lab-inventory/backend && npm install
cd /home/pi/lab-inventory/frontend && npm install
```

### 3) Configure env on Pi

`/home/pi/lab-inventory/backend/.env`

```env
PORT=4000
CLIENT_URL=http://<PI_IP>:4000
```

`/home/pi/lab-inventory/frontend/.env`

```env
VITE_API_URL=http://<PI_IP>:4000/api
VITE_SOCKET_URL=http://<PI_IP>:4000
```

### 4) Build frontend and run backend

```bash
cd /home/pi/lab-inventory/frontend && npm run build
cd /home/pi/lab-inventory/backend && npm run start
```

Then open:

`http://<PI_IP>:4000`

### 5) Keep app running with PM2 (recommended)

```bash
sudo npm install -g pm2
cd /home/pi/lab-inventory/backend
pm2 start src/server.js --name lab-inventory
pm2 save
pm2 startup
```

Run the printed `pm2 startup` command once, then reboot test:

```bash
sudo reboot
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/items` | List all items |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/activity` | Activity log |
| GET | `/api/export` | Export inventory as `.xlsx` |

## Managing Inventory (for contributors)

Inventory is updated via backend scripts, not through the web UI.

**Import from Excel:**

```bash
cd backend
node import-excel.js
```

**Re-categorize items:**

```bash
cd backend
node categorize.js
```

## Database Schema (SQLite)

**Items** — `id`, `name`, `quantity`, `location`, `category`, `lastUpdated`

**ActivityLogs** — `id`, `action`, `details`, `userName`

## LAN Access

1. `hostname -I` to get host IP
2. Build frontend (`cd frontend && npm run build`)
3. Set `CLIENT_URL=http://<IP>:4000` in `backend/.env`
4. Start backend (`cd backend && npm run start`)
5. Colleagues open `http://<IP>:4000`
 