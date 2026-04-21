require("dotenv").config();
const { initDb, Item } = require("./src/models");

const rules = [
  // Passive components
  [/resistor/i, "Passive Components"],
  [/capacitor/i, "Passive Components"],
  [/diode/i, "Passive Components"],
  [/fuse/i, "Passive Components"],
  [/inductor/i, "Passive Components"],
  [/ldr/i, "Passive Components"],
  [/regulator|L7805/i, "Passive Components"],
  [/transistor/i, "Passive Components"],

  // Active / IC modules
  [/led\b/i, "Active Components"],
  [/buzzer/i, "Active Components"],
  [/dc motor/i, "Active Components"],
  [/slip ring/i, "Active Components"],

  // Dev boards & SBCs
  [/raspberry pi/i, "Single-Board Computers"],
  [/arduino/i, "Microcontrollers"],
  [/stm32/i, "Microcontrollers"],
  [/jetson/i, "Single-Board Computers"],
  [/mac mini/i, "Computers"],
  [/macbook/i, "Computers"],
  [/dell monitor/i, "Computers"],

  // Modules & breakouts
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

  // Connectors & headers
  [/header|berg strip|idc|pin.*header/i, "Connectors & Headers"],
  [/connector|terminal block|screw terminal/i, "Connectors & Headers"],
  [/jst|molex|housing/i, "Connectors & Headers"],
  [/dc jack/i, "Connectors & Headers"],
  [/mic terminal/i, "Connectors & Headers"],
  [/through.hole.*pin/i, "Connectors & Headers"],

  // Wires, cables, jumpers
  [/jumper|connecting wire|single strand/i, "Wires & Cables"],
  [/lace connector/i, "Wires & Cables"],
  [/lan cable/i, "Networking & Fiber"],
  [/patch cord|pigtail/i, "Networking & Fiber"],
  [/cat.?[5-8]|rj45|ethernet.*connector|cable splitter/i, "Networking & Fiber"],
  [/coupler|fiber|of fiber|ofc|optical|visual fault/i, "Networking & Fiber"],
  [/onu\b|poe|10.port.*switch/i, "Networking & Fiber"],
  [/cable scanner/i, "Networking & Fiber"],
  [/data cable.*pin/i, "Wires & Cables"],
  [/wire\b|2.core wire/i, "Wires & Cables"],
  [/shrink wrap/i, "Wires & Cables"],
  [/usb.*cable|usb.*otg|type.*c.*cable|data cable/i, "Cables & Adapters"],
  [/hdmi|hdtv/i, "Cables & Adapters"],
  [/adapter|charger|dock/i, "Power & Charging"],

  // Power
  [/li.po|battery|balance charger|imax/i, "Power & Charging"],
  [/power plate/i, "Power & Charging"],
  [/solar panel/i, "Power & Charging"],
  [/poe splitter/i, "Networking & Fiber"],
  [/converter.*6a|switch housing/i, "Power & Charging"],

  // Breadboards & prototyping
  [/breadboard/i, "Prototyping"],
  [/lattice/i, "Prototyping"],
  [/crimping box/i, "Prototyping"],

  // Drone
  [/drone|propeller|fpv|radio master|vr goggles.*drone/i, "Drone Equipment"],
  [/antenna connector/i, "Drone Equipment"],

  // Camera / imaging
  [/camera|arducam/i, "Cameras & Imaging"],

  // Tools
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

  // Storage & packaging
  [/case box|carry box|acrylic case|raspberry case/i, "Storage & Enclosures"],
  [/box cap/i, "Storage & Enclosures"],
  [/polycarbonate gel/i, "Storage & Enclosures"],

  // Office & misc supplies
  [/tape|tisco|zip tie/i, "Office Supplies"],
  [/marker/i, "Office Supplies"],
  [/tape dispenser/i, "Office Supplies"],
  [/plastic wrapper|transparent clip|washer|disc|nut/i, "Office Supplies"],
  [/document|paperwork/i, "Documents"],
  [/keyboard|mouse/i, "Peripherals"],
  [/sd card/i, "Storage Media"],
  [/fan|cooling/i, "Cooling"],
  [/3.pin socket|3.pin top/i, "Electrical Fittings"],

  // Lab consumables (seed items)
  [/pipette/i, "Lab Consumables"],
  [/ethanol/i, "Lab Consumables"],
  [/microscope slide/i, "Lab Consumables"],
  [/pin\b/i, "Connectors & Headers"],
];

function categorize(name) {
  for (const [regex, category] of rules) {
    if (regex.test(name)) return category;
  }
  return "Uncategorized";
}

(async () => {
  await initDb();
  const items = await Item.findAll();
  const counts = {};
  const uncategorized = [];

  for (const item of items) {
    const cat = categorize(item.name);
    if (cat === "Uncategorized") uncategorized.push(item.name);
    counts[cat] = (counts[cat] || 0) + 1;
    await item.update({ category: cat, lastUpdated: new Date() });
  }

  console.log("\nCategory summary:");
  Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, n]) => console.log(`  ${cat}: ${n}`));

  if (uncategorized.length) {
    console.log("\nUncategorized items:");
    uncategorized.forEach((n) => console.log(`  - ${n}`));
  }

  console.log(`\nDone. ${items.length} items categorized.`);
  process.exit(0);
})();
