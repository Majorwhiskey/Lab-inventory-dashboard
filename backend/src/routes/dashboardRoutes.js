const express = require("express");
const { Item, ActivityLog } = require("../models");
const { getSystemHealth } = require("../utils/systemHealth");

const router = express.Router();

router.get("/dashboard", async (_req, res) => {
  const items = await Item.findAll();
  const categorySet = new Set(items.map((i) => i.category).filter(Boolean));
  const recentActivity = await ActivityLog.findAll({
    order: [["createdAt", "DESC"]],
    limit: 10,
  });

  return res.json({
    totalItems: items.length,
    categoriesCount: categorySet.size,
    recentActivity,
  });
});

router.get("/activity", async (_req, res) => {
  const logs = await ActivityLog.findAll({
    order: [["createdAt", "DESC"]],
    limit: 50,
  });
  return res.json(logs);
});

router.get("/system-health", async (_req, res) => {
  const health = await getSystemHealth();
  return res.json(health);
});

module.exports = router;
