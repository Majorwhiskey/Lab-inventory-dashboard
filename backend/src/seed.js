const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { Item } = require("./models");

const PROJECT_ROOT = path.resolve(__dirname, "../..");

/** Prefer update file, then legacy March file. Override with INVENTORY_EXCEL_PATH=/absolute/path.xlsx */
function resolveExcelPath() {
  const envPath = process.env.INVENTORY_EXCEL_PATH;
  if (envPath && fs.existsSync(envPath)) return path.resolve(envPath);

  const updatePath = path.join(PROJECT_ROOT, "inventory_update.xlsx");
  if (fs.existsSync(updatePath)) return updatePath;

  const legacyPath = path.join(PROJECT_ROOT, "lab_audit.xlsx");
  if (fs.existsSync(legacyPath)) return legacyPath;

  return updatePath;
}

const parseQty = (raw) => {
  const str = String(raw || "").trim();
  if (!str || str === "—" || str === "∞") return 0;
  if (str.includes("+")) {
    return str.split("+").reduce((sum, part) => {
      const n = parseInt(part.replace(/[^0-9]/g, ""), 10);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }
  const n = parseInt(str.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const categoryRules = [
  [/resistor/i, "Passive Components"],
  [/capacitor/i, "Passive Components"],
  [/diode/i, "Passive Components"],
  [/fuse/i, "Passive Components"],
  [/inductor/i, "Passive Components"],
  [/ldr/i, "Passive Components"],
  [/regulator|L7805/i, "Passive Components"],
  [/transistor/i, "Passive Components"],
  [/led\b/i, "Active Components"],
  [/buzzer/i, "Active Components"],
  [/dc motor/i, "Active Components"],
  [/slip ring/i, "Active Components"],
  [/raspberry pi/i, "Single-Board Computers"],
  [/arduino/i, "Microcontrollers"],
  [/stm32/i, "Microcontrollers"],
  [/jetson/i, "Single-Board Computers"],
  [/mac mini/i, "Computers"],
  [/macbook/i, "Computers"],
  [/dell monitor/i, "Computers"],
  [/lora|wifi.*ble|ethernet module|W5500|ENC28J60/i, "Communication Modules"],
  [/gps module/i, "Communication Modules"],
  [/rtk/i, "Communication Modules"],
  [/respeaker/i, "Audio Equipment"],
  [/microphone|recorder|pcm/i, "Audio Equipment"],
  [/headset|skullcandy|skullsaint/i, "Audio Equipment"],
  [/usb.*ttl|cp2102/i, "Modules & Breakouts"],
  [/logic level/i, "Modules & Breakouts"],
  [/buck converter|lm2596/i, "Modules & Breakouts"],
  [/max4466/i, "Modules & Breakouts"],
  [/usb.*breakout/i, "Modules & Breakouts"],
  [/fpc\b/i, "Modules & Breakouts"],
  [/header|berg strip|idc|pin.*header/i, "Connectors & Headers"],
  [/connector|terminal block|screw terminal/i, "Connectors & Headers"],
  [/jst|molex|housing/i, "Connectors & Headers"],
  [/dc jack/i, "Connectors & Headers"],
  [/mic terminal/i, "Connectors & Headers"],
  [/through.hole.*pin/i, "Connectors & Headers"],
  [/jumper|connecting wire|single strand/i, "Wires & Cables"],
  [/lace connector/i, "Wires & Cables"],
  [/lan cable/i, "Networking & Fiber"],
  [/patch cord|pigtail/i, "Networking & Fiber"],
  [/cat.?[5-8]|rj45|ethernet.*connector|cable splitter/i, "Networking & Fiber"],
  [/coupler|fiber|of fiber|ofc|optical|visual fault/i, "Networking & Fiber"],
  [/onu\b|poe|10.port.*switch/i, "Networking & Fiber"],
  [/cable scanner/i, "Networking & Fiber"],
  [/tp.link/i, "Networking & Fiber"],
  [/data cable.*pin/i, "Wires & Cables"],
  [/wire\b|2.core wire/i, "Wires & Cables"],
  [/shrink wrap/i, "Wires & Cables"],
  [/usb.*cable|usb.*otg|type.*c.*cable|data cable/i, "Cables & Adapters"],
  [/hdmi|hdtv/i, "Cables & Adapters"],
  [/adapter|charger|dock/i, "Power & Charging"],
  [/li.po|battery|balance charger|imax/i, "Power & Charging"],
  [/power plate/i, "Power & Charging"],
  [/solar panel/i, "Power & Charging"],
  [/poe splitter/i, "Networking & Fiber"],
  [/converter.*6a|switch housing/i, "Electrical Fittings"],
  [/3.pin socket|3.pin top/i, "Electrical Fittings"],
  [/breadboard/i, "Prototyping"],
  [/lattice/i, "Prototyping"],
  [/crimping box/i, "Prototyping"],
  [/drone|propeller|fpv|radio master|vr goggles.*drone/i, "Drone Equipment"],
  [/antenna connector/i, "Drone Equipment"],
  [/camera|arducam/i, "Cameras & Imaging"],
  [/solder/i, "Soldering & Repair"],
  [/glue gun|glue stick|hot gun/i, "Soldering & Repair"],
  [/finishing tool/i, "Soldering & Repair"],
  [/multimeter/i, "Test & Measurement"],
  [/label printer/i, "Office Equipment"],
  [/drill|hacksaw|screw driver|allen key|file\b|blade cutter/i, "Hand Tools"],
  [/crimping tool/i, "Hand Tools"],
  [/wire cutter|wire plier|wire stripper|scissors/i, "Hand Tools"],
  [/pick tweezers/i, "Hand Tools"],
  [/sds drill/i, "Hand Tools"],
  [/toolbox/i, "Hand Tools"],
  [/clamp/i, "Hand Tools"],
  [/vacuum cleaner|cleaning set|duster/i, "Cleaning & Maintenance"],
  [/distilled water/i, "Cleaning & Maintenance"],
  [/case box|carry box|acrylic case|raspberry case/i, "Storage & Enclosures"],
  [/box cap/i, "Storage & Enclosures"],
  [/polycarbonate gel/i, "Storage & Enclosures"],
  [/tape|tisco|zip tie/i, "Office Supplies"],
  [/marker/i, "Office Supplies"],
  [/tape dispenser/i, "Office Supplies"],
  [/plastic wrapper|transparent clip|washer|disc|nut/i, "Office Supplies"],
  [/document|paperwork/i, "Documents"],
  [/keyboard|mouse/i, "Peripherals"],
  [/sd card/i, "Storage Media"],
  [/heat sink/i, "Cooling"],
  [/fan|cooling/i, "Cooling"],
  [/pipette/i, "Lab Consumables"],
  [/ethanol/i, "Lab Consumables"],
  [/microscope slide/i, "Lab Consumables"],
  [/pin\b/i, "Connectors & Headers"],
];

function categorize(name) {
  for (const [regex, category] of categoryRules) {
    if (regex.test(name)) return category;
  }
  return "General";
}

/** New sheet format: `location` + Placement column (header may include spaces). */
function getExcelPlacement(row) {
  if (row[" Placement "] !== undefined && String(row[" Placement "]).trim() !== "") {
    return String(row[" Placement "]).trim();
  }
  if (row.Placement !== undefined) return String(row.Placement).trim();
  for (const key of Object.keys(row)) {
    if (key.trim().toLowerCase() === "placement") {
      return String(row[key] || "").trim();
    }
  }
  return "";
}

/** Supports inventory_update.xlsx (PART No / DESCRIPTION, QTY, location, Placement) or legacy March sheet. */
function rowToItem(row) {
  const newName = String(row["PART No / DESCRIPTION"] || "").trim();
  if (newName) {
    const rawQty = row["QTY"];
    const rawStr = rawQty === undefined || rawQty === null ? "" : String(rawQty).trim();
    const quantity = parseQty(rawStr || String(rawQty));
    const quantityDisplay =
      rawStr || (rawQty !== undefined && rawQty !== null ? String(rawQty) : "0");
    const loc = String(row.location || "").trim();
    const place = getExcelPlacement(row);
    const location = [loc, place].filter(Boolean).join(" — ") || "Unassigned";
    return {
      name: newName,
      quantity,
      quantityDisplay: quantityDisplay || "0",
      location,
      category: categorize(newName),
      lastUpdated: new Date(),
    };
  }

  const legacyName = String(row["Name"] || "").trim();
  if (!legacyName) return null;

  const rawQty = String(row["Quantity"] || "").trim();
  const quantity = parseQty(rawQty);
  const quantityDisplay = rawQty || "0";
  const location =
    String(row["Location (Rack / Drawer / Closet)"] || "").trim() || "Unassigned";

  return {
    name: legacyName,
    quantity,
    quantityDisplay,
    location,
    category: categorize(legacyName),
    lastUpdated: new Date(),
  };
}

/** Extra lab items — upserted by exact name. */
const MANUAL_ITEMS = [
  {
    name: "6 pin connectors",
    quantity: 10,
    quantityDisplay: "10",
    location: "IoT Dept. — Rack 1 – Drawer 4",
    category: "Connectors & Headers",
  },
  {
    name: "Buzzers",
    quantity: 5,
    quantityDisplay: "5",
    location: "IoT Dept. — Component Box 1",
    category: "Active Components",
  },
  {
    name: "High Torque Servos",
    quantity: 5,
    quantityDisplay: "5",
    location: "IoT Dept. — comp. box1",
    category: "Drone Equipment",
  },
  {
    name: "Normal Servos",
    quantity: 5,
    quantityDisplay: "5",
    location: "IoT Dept. — comp. box1",
    category: "Drone Equipment",
  },
  {
    name: "GPS 6M Neo",
    quantity: 5,
    quantityDisplay: "5",
    location: "IoT Dept. — White Rack",
    category: "Communication Modules",
  },
  {
    name: "Gyro 2-axis",
    quantity: 3,
    quantityDisplay: "3",
    location: "IoT Dept. — comp. box1",
    category: "Modules & Breakouts",
  },
  {
    name: "BMP180 Barometer",
    quantity: 3,
    quantityDisplay: "3",
    location: "IoT Dept. — comp. box1",
    category: "Modules & Breakouts",
  },
  {
    name: "Gyro 3-axis",
    quantity: 4,
    quantityDisplay: "4",
    location: "IoT Dept. — comp. box1",
    category: "Modules & Breakouts",
  },
  {
    name: "9-axis Gyro",
    quantity: 1,
    quantityDisplay: "1",
    location: "IoT Dept. — White Rack",
    category: "Modules & Breakouts",
  },
  {
    name: "Metallic Tripods",
    quantity: 4,
    quantityDisplay: "4",
    location: "IoT Dept. — Big Rack",
    category: "Cameras & Imaging",
  },
  {
    name: "Plastic Tripods",
    quantity: 2,
    quantityDisplay: "2",
    location: "IoT Dept. — Big Rack",
    category: "Cameras & Imaging",
  },
];

async function ensureManualItems() {
  let added = 0;
  let updated = 0;
  for (const m of MANUAL_ITEMS) {
    const existing = await Item.findOne({ where: { name: m.name } });
    if (!existing) {
      await Item.create({
        ...m,
        lastUpdated: new Date(),
      });
      added += 1;
    } else {
      await existing.update({
        location: m.location,
        quantity: m.quantity,
        quantityDisplay: m.quantityDisplay,
        category: m.category,
        lastUpdated: new Date(),
      });
      updated += 1;
    }
  }
  if (added > 0) console.log(`Added ${added} manual inventory item(s).`);
  if (updated > 0) console.log(`Updated ${updated} manual item(s) (location / qty).`);
}

const seedData = async () => {
  const reimport =
    process.env.REIMPORT_INVENTORY === "true" || process.env.REIMPORT_INVENTORY === "1";
  if (reimport) {
    const n = await Item.destroy({ where: {}, truncate: false });
    console.log(`REIMPORT_INVENTORY: cleared ${n} row(s); will reseed from Excel.`);
  }

  const itemCount = await Item.count();
  const excelPath = resolveExcelPath();

  if (itemCount === 0) {
    if (!fs.existsSync(excelPath)) {
      console.log("Excel file not found at", excelPath, "— skipping Excel seed.");
    } else {
      console.log("Seeding inventory from", path.basename(excelPath), "...");

      const wb = XLSX.readFile(excelPath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const items = [];
      for (const row of rows) {
        const item = rowToItem(row);
        if (item) items.push(item);
      }

      await Item.bulkCreate(items);
      console.log(`Seeded ${items.length} items from Excel.`);
    }
  }

  await ensureManualItems();
};

module.exports = seedData;
