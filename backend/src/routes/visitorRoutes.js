const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();
const dataDir = path.join(__dirname, "../../data");
const dataFile = path.join(dataDir, "visitorNames.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}), "utf8");
}

function readStore() {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(dataFile, "utf8"));
  } catch {
    return {};
  }
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2), "utf8");
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

router.get("/visitor-name", (req, res) => {
  const ip = getClientIp(req);
  const store = readStore();
  const name = store[ip] || null;
  return res.json({ name });
});

router.post("/visitor-name", (req, res) => {
  const ip = getClientIp(req);
  const name = String(req.body?.name || "").trim();
  if (!name) return res.status(400).json({ message: "Name is required" });

  const store = readStore();
  store[ip] = name;
  writeStore(store);
  return res.json({ ok: true, name });
});

module.exports = router;
