require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");
const { initDb } = require("./models");
const seedData = require("./seed");
const { getSystemHealth } = require("./utils/systemHealth");

const itemRoutes = require("./routes/itemRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const visitorRoutes = require("./routes/visitorRoutes");

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || "*";
const corsOrigin = clientUrl === "*" ? true : clientUrl.split(",").map((s) => s.trim());

const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ["GET", "POST", "PUT", "DELETE"] },
});

app.set("io", io);
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api", itemRoutes);
app.use("/api", uploadRoutes);
app.use("/api", dashboardRoutes);
app.use("/api", visitorRoutes);

const frontendDist = path.join(__dirname, "../../frontend/dist");
const frontendIndex = path.join(frontendDist, "index.html");
if (fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDist));
  app.get(/.*/, (_req, res) => {
    res.sendFile(frontendIndex);
  });
}

io.on("connection", (socket) => {
  socket.emit("connected", { message: "Realtime connected" });
});

const start = async () => {
  await initDb();
  await seedData();
  const port = Number(process.env.PORT || 4000);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Backend listening on http://0.0.0.0:${port}`);

    setInterval(async () => {
      const health = await getSystemHealth();
      io.emit("system_health", health);
    }, 5000);
  });
};

start();
