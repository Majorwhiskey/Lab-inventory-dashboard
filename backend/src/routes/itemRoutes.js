const express = require("express");
const { Item } = require("../models");

const router = express.Router();

router.get("/items", async (_req, res) => {
  const items = await Item.findAll({ order: [["updatedAt", "DESC"]] });
  return res.json(items);
});

module.exports = router;
