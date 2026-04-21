# Lab Inventory Dashboard — Raspberry Pi Template

A plug-and-play lab inventory dashboard you can self-host on a Raspberry Pi in minutes. Drop in your Excel sheet, swap the logo and name, and it's ready to serve your whole office over LAN — no cloud, no subscriptions.

## What you get

- Searchable, sortable inventory table
- Dashboard with item counts by category
- Activity log of recent changes
- One-click Excel export
- Real-time updates via WebSocket (all viewers see changes instantly)
- Dark tactical UI — works great on a wall-mounted screen

**Tech stack:** React + Vite + Tailwind CSS · Node.js + Express + SQLite + Socket.IO

---

## Customise for your lab (3 steps)

### 1. Add your logo

Drop your logo file into `frontend/public/` and update the two references in the source:

```
frontend/src/components/Layout.jsx      ← header logo
frontend/src/components/WelcomeGate.jsx ← login screen logo
```

Replace the `<span className="material-symbols-outlined ...">inventory_2</span>` icon with:

```jsx
<img src="/your-logo.png" alt="Your Lab" className="h-9 w-9 object-contain" />
```

### 2. Set your lab name

In the same two files above, change `"LAB INVENTORY"` and `"Management System"` to whatever you like.

### 3. Upload your inventory Excel

Your spreadsheet should have these columns:

| Column | Description |
|---|---|
| `PART No / DESCRIPTION` | Item name |
| `QTY` | Quantity (numbers, ranges like `3+2`, or `∞`) |
| `location` | Room / rack / shelf |
| `Placement` | Optional secondary location detail |

Save it as `inventory_update.xlsx` in the project root, then run:

```bash
cd backend
node import-excel.js
```

The dashboard auto-categorizes items by name (resistors, cables, tools, etc.). To re-run categorization after edits:

```bash
node categorize.js
```

That's it — your inventory is live.

---

## Deploy on Raspberry Pi

### 1. Copy project to Pi

```bash
rsync -avz --exclude node_modules --exclude "*.db" \
  /path/to/lab-inventory/ \
  pi@<PI_IP>:/home/pi/lab-inventory/
```

### 2. Install Node.js on Pi

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt-get install -y nodejs
```

### 3. Install dependencies

```bash
cd /home/pi/lab-inventory/backend && npm install
cd /home/pi/lab-inventory/frontend && npm install
```

### 4. Configure environment

`backend/.env`
```env
PORT=4000
CLIENT_URL=http://<PI_IP>:4000
```

`frontend/.env`
```env
VITE_API_URL=http://<PI_IP>:4000/api
VITE_SOCKET_URL=http://<PI_IP>:4000
```

### 5. Build and start

```bash
cd /home/pi/lab-inventory/frontend && npm run build
cd /home/pi/lab-inventory/backend && npm run start
```

Open `http://<PI_IP>:4000` from any device on the same network.

### 6. Keep it running with PM2

```bash
sudo npm install -g pm2
cd /home/pi/lab-inventory/backend
pm2 start src/server.js --name lab-inventory
pm2 save
pm2 startup
```

Run the printed `pm2 startup` command once, then test with `sudo reboot`.

---

## Local development

```bash
# Backend
cd backend && cp .env.example .env && npm install && npm run dev

# Frontend (separate terminal)
cd frontend && cp .env.example .env && npm install && npm run dev
```

Set `CLIENT_URL=http://localhost:5173` in `backend/.env` for local Vite dev.  
Open `http://localhost:5173`.

---

## API reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/items` | List all items |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/activity` | Activity log |
| GET | `/api/export` | Download inventory as `.xlsx` |

---

## Database schema (SQLite)

**Items** — `id`, `name`, `quantity`, `location`, `category`, `lastUpdated`

**ActivityLogs** — `id`, `action`, `details`, `userName`
