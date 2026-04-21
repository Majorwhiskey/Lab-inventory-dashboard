const express = require("express");
const XLSX = require("xlsx");
const PDFDocument = require("pdfkit");
const { Item } = require("../models");

const router = express.Router();

router.get("/export", async (req, res) => {
  const format = (req.query.format || "xlsx").toLowerCase();
  const items = await Item.findAll({ order: [["name", "ASC"]] });
  const rows = items.map((item) => ({
    "Item Name": item.name,
    Quantity: item.quantityDisplay || item.quantity,
    Location: item.location,
    Category: item.category || "",
    "Last Updated": item.lastUpdated
      ? new Date(item.lastUpdated).toLocaleDateString()
      : "",
  }));

  if (format === "csv") {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(sheet);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="inventory_export_${Date.now()}.csv"`
    );
    res.setHeader("Content-Type", "text/csv");
    return res.send(csv);
  }

  if (format === "pdf") {
    const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 40 });
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="inventory_export_${Date.now()}.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    doc.fontSize(18).font("Helvetica-Bold").text("VARAHA — Inventory Export", { align: "center" });
    doc.fontSize(9).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}  |  Total Items: ${rows.length}`, { align: "center" });
    doc.moveDown(1);

    const cols = [
      { header: "Item Name", width: 220, key: "Item Name" },
      { header: "Qty", width: 60, key: "Quantity" },
      { header: "Location", width: 180, key: "Location" },
      { header: "Category", width: 150, key: "Category" },
      { header: "Last Updated", width: 100, key: "Last Updated" },
    ];
    const startX = doc.x;
    let y = doc.y;

    doc.fontSize(8).font("Helvetica-Bold");
    cols.forEach((col) => {
      doc.text(col.header, startX + cols.slice(0, cols.indexOf(col)).reduce((s, c) => s + c.width, 0), y, {
        width: col.width,
        continued: false,
      });
    });
    y += 16;
    doc.moveTo(startX, y).lineTo(startX + cols.reduce((s, c) => s + c.width, 0), y).stroke("#999");
    y += 6;

    doc.font("Helvetica").fontSize(7);
    for (const row of rows) {
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 40;
      }
      let x = startX;
      for (const col of cols) {
        doc.text(String(row[col.key] ?? ""), x, y, { width: col.width, lineBreak: false });
        x += col.width;
      }
      y += 14;
    }

    doc.end();
    return;
  }

  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Inventory");
  const fileBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="inventory_export_${Date.now()}.xlsx"`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  return res.send(fileBuffer);
});

module.exports = router;
