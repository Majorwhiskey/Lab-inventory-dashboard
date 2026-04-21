require("dotenv").config();
const XLSX = require("xlsx");
const path = require("path");
const { initDb } = require("./src/models");
const { Item } = require("./src/models");

const FILE = path.resolve(__dirname, "../lab_audit.xlsx");

const parseQty = (raw) => {
  const str = String(raw || "").replace(/[^0-9.]/g, "");
  const n = parseInt(str, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

(async () => {
  await initDb();

  const wb = XLSX.readFile(FILE);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = String(row["Name"] || "").trim();
    if (!name) {
      skipped++;
      continue;
    }

    const quantity = parseQty(row["Quantity"]);
    const location =
      String(row["Location (Rack / Drawer / Closet)"] || "").trim() || "Unassigned";

    const existing = await Item.findOne({ where: { name, location } });
    if (existing) {
      await existing.update({ quantity, lastUpdated: new Date() });
      updated++;
    } else {
      await Item.create({ name, quantity, location, category: null, lastUpdated: new Date() });
      created++;
    }
  }

  console.log(`Done. ${created} created, ${updated} updated, ${skipped} skipped.`);
  console.log(`Total items in DB: ${await Item.count()}`);
  process.exit(0);
})();
