import { useEffect, useState } from "react";
import api from "../api/client";
import ScrambleText from "../components/ScrambleText";

const DATA_FIELDS = [
  { id: "name", label: "Item Name", defaultChecked: true },
  { id: "category", label: "Category", defaultChecked: true },
  { id: "location", label: "Location", defaultChecked: true },
  { id: "quantity", label: "Quantity", defaultChecked: true },
  { id: "lastUpdated", label: "Last Updated", defaultChecked: true },
  { id: "assetId", label: "Asset ID", defaultChecked: false },
];

export default function UploadPage() {
  const [downloading, setDownloading] = useState(false);
  const [format, setFormat] = useState("xlsx");
  const [fields, setFields] = useState(
    Object.fromEntries(DATA_FIELDS.map((f) => [f.id, f.defaultChecked]))
  );
  const [itemCount, setItemCount] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    api.get("/items").then(({ data }) => setItemCount(data.length)).catch(() => {});
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleField = (id) => setFields((prev) => ({ ...prev, [id]: !prev[id] }));

  const resetDefaults = () =>
    setFields(Object.fromEntries(DATA_FIELDS.map((f) => [f.id, f.defaultChecked])));

  const MIME_TYPES = {
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    pdf: "application/pdf",
  };

  const downloadExport = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`/export?format=${format}`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: MIME_TYPES[format] });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `inventory_export.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const systemTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-64px)] overflow-y-auto">
      {/* Telemetry Header — exact Stitch export */}
      <div className="flex justify-between items-end mb-8 border-b border-[#454840]/20 pb-4">
        <div className="flex flex-col">
          <ScrambleText text="MODULE ID: EX-294-VAR" className="text-xs text-[#ffba38] uppercase tracking-widest font-bold" />
          <ScrambleText text="DATA EXPORT: VARAHA-INVENTORY" as="h1" delay={150} className="text-4xl font-extrabold tracking-tighter text-[#e3e3dc] mt-1 uppercase" />
        </div>
        <div className="text-right">
          <span className="text-xs text-[#c5c7be] uppercase tracking-widest">
            SYSTEM TIME: {systemTime} UTC
          </span>
          <div className="w-48 h-1 bg-[#333531] mt-2 relative overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
                downloading ? "animate-shimmer w-full" : "bg-[#bfcab1] w-4/5"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Bento Grid Layout — exact Stitch export */}
      <div className="grid grid-cols-12 gap-5">
        {/* System Health Widget (Contextual) with radar effect */}
        <div className="col-span-12 lg:col-span-4 bg-[#1a1c18] p-5 flex flex-col justify-between radar-effect">
          <div className="radar-sweep-line" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[#bfcab1] text-sm">hub</span>
              <ScrambleText text="System Health Summary" delay={400} className="text-[10px] font-bold tracking-widest uppercase text-[#c5c7be]" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#454840]/10 pb-2">
                <span className="text-xs uppercase font-medium text-[#c5c7be]/80">Raspberry Pi Node</span>
                <span className="text-[10px] bg-[#3c4633] text-[#a8b49b] px-2 py-0.5 font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#454840]/10 pb-2">
                <span className="text-xs uppercase font-medium text-[#c5c7be]/80">Database Sync</span>
                <span className="text-[10px] bg-[#3c4633] text-[#a8b49b] px-2 py-0.5 font-bold">SYNCHRONIZED</span>
              </div>
              <div className="flex justify-between items-center border-b border-[#454840]/10 pb-2">
                <span className="text-xs uppercase font-medium text-[#c5c7be]/80">Memory Usage</span>
                <span className="text-[10px] text-[#ffba38] font-bold">42%</span>
              </div>
            </div>
          </div>
          {/* Data processing rings — exact Stitch */}
          <div className="mt-8 relative h-32 flex items-center justify-center">
            <div className="absolute inset-0 data-processing-ring opacity-20" />
            <div className="absolute inset-4 data-processing-ring opacity-10" style={{ animationDirection: "reverse", animationDuration: "30s" }} />
            <div className="absolute w-24 h-24 bg-[#ffba38]/5 rounded-full data-pulse" />
            <span className="material-symbols-outlined text-[64px] text-[#454840]/30">memory</span>
          </div>
        </div>

        {/* Export Parameters Panel — exact Stitch export */}
        <div className="col-span-12 lg:col-span-8 bg-[#1a1c18] p-6">
          <div className="flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[#ffba38] text-sm">settings_input_component</span>
            <ScrambleText text="Report Generation Parameters" delay={400} className="text-[10px] font-bold tracking-widest uppercase text-[#c5c7be]" />
          </div>
          <div className="grid grid-cols-2 gap-8">
            {/* Date Range Selection */}
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-[#c5c7be]/60">Target Start Date</span>
                <input className="mt-1 block w-full bg-[#333531] border-none text-[#e3e3dc] text-sm focus:ring-0 focus:border-b-2 focus:border-[#ffba38] p-3" type="date" />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-[#c5c7be]/60">Target End Date</span>
                <input className="mt-1 block w-full bg-[#333531] border-none text-[#e3e3dc] text-sm focus:ring-0 focus:border-b-2 focus:border-[#ffba38] p-3" type="date" />
              </label>
            </div>
            {/* Filter Options */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-[#c5c7be]/60 block mb-2">Export Format</span>
                <div className="flex gap-2">
                  {["xlsx", "pdf", "csv"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 py-3 text-xs font-bold uppercase border transition-colors ${
                        format === f
                          ? "bg-[#ffba38] text-[#432c00] border-[#ffba38]"
                          : "bg-transparent text-[#c5c7be]/40 border-[#454840]/20 hover:border-[#8f9289]"
                      }`}
                      type="button"
                    >
                      .{f}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-[#c5c7be]/60">Data Granularity</span>
                <select className="mt-1 block w-full bg-[#333531] border-none text-[#e3e3dc] text-sm focus:ring-0 p-3 appearance-none">
                  <option>ALL ITEMS</option>
                  <option>CRITICAL ITEMS ONLY</option>
                  <option>LOW STOCK ONLY</option>
                </select>
              </label>
            </div>
          </div>

          {/* Column Toggles — exact Stitch */}
          <div className="mt-8 p-4 bg-[#333531]/50 border border-[#454840]/10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#c5c7be]/60 block mb-4">Included Data Fields</span>
            <div className="grid grid-cols-3 gap-3">
              {DATA_FIELDS.map((field) => (
                <button
                  key={field.id}
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => toggleField(field.id)}
                  type="button"
                >
                  <div className={`w-4 h-4 flex items-center justify-center ${
                    fields[field.id]
                      ? "bg-[#bfcab1]"
                      : "bg-[#333531] border border-[#454840]/30"
                  }`}>
                    {fields[field.id] && (
                      <span className="material-symbols-outlined text-[12px] text-[#2a3322] font-bold">check</span>
                    )}
                  </div>
                  <span className={`text-[10px] uppercase font-bold group-hover:text-[#bfcab1] transition-colors ${
                    fields[field.id] ? "text-[#c5c7be]" : "text-[#c5c7be]/40"
                  }`}>
                    {field.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Area — exact Stitch */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              className="px-8 py-3 bg-transparent border border-[#454840]/20 text-[10px] font-bold uppercase tracking-widest text-[#c5c7be] hover:bg-[#383a35] transition-colors"
              onClick={resetDefaults}
              type="button"
            >
              RESET DEFAULTS
            </button>
            <button
              className="px-10 py-3 bg-[#bfcab1] text-[#2a3322] text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
              onClick={downloadExport}
              disabled={downloading}
              type="button"
            >
              {downloading ? "GENERATING..." : `GENERATE & DOWNLOAD .${format.toUpperCase()}`}
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
            </button>
          </div>
        </div>

        {/* Secondary Data/Visual Context — exact Stitch */}
        <div className="col-span-12 grid grid-cols-3 gap-5">
          <div className="bg-[#1a1c18] p-4 flex flex-col items-center justify-center border-t-2 border-[#bfcab1]/20">
            <span className="text-[10px] font-bold uppercase text-[#c5c7be]/40 mb-1">Estimated File Size</span>
            <span className="text-2xl font-black text-[#bfcab1]">{(itemCount * 0.012).toFixed(1)} MB</span>
          </div>
          <div className="bg-[#1a1c18] p-4 flex flex-col items-center justify-center border-t-2 border-[#ffba38]/20">
            <span className="text-[10px] font-bold uppercase text-[#c5c7be]/40 mb-1">Rows to Process</span>
            <span className="text-2xl font-black text-[#ffba38]">{itemCount.toLocaleString()}</span>
          </div>
          <div className="bg-[#1a1c18] p-4 flex flex-col items-center justify-center border-t-2 border-[#c5c7be]/20">
            <span className="text-[10px] font-bold uppercase text-[#c5c7be]/40 mb-1">Security Clearance</span>
            <span className="text-2xl font-black text-[#c5c7be]">LEVEL 4</span>
          </div>
        </div>
      </div>

      {/* Footer Meta — exact Stitch */}
      <div className="mt-16 text-[10px] text-[#c5c7be]/30 font-bold uppercase tracking-widest flex justify-between">
        <ScrambleText text="VARAHA-INVENTORY CONTROL SYSTEM // V.4.8.2-STABLE" delay={800} />
        <ScrambleText text="AUTHORIZED USE ONLY // ENCRYPTION AES-256 ACTIVE" delay={1000} />
      </div>
    </div>
  );
}
