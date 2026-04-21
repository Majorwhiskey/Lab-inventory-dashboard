import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useSocket } from "../hooks/useSocket";
import ScrambleText from "../components/ScrambleText";

const ITEMS_PER_PAGE = 15;

const CRITICAL_CATEGORIES = new Set([
  "Single-Board Computers",
  "Microcontrollers",
  "Communication Modules",
  "Drone Equipment",
  "Computers",
  "Cameras & Imaging",
  "Test & Measurement",
  "Modules & Breakouts",
]);

export default function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const setQuery = (v) => {
    if (v) setSearchParams({ q: v });
    else setSearchParams({});
  };
  const [items, setItems] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [now, setNow] = useState(new Date());
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [health, setHealth] = useState(null);

  const fetchItems = async () => {
    const { data } = await api.get("/items");
    setItems(data);
  };

  useEffect(() => {
    fetchItems();
    api.get("/system-health").then(({ data: h }) => setHealth(h)).catch(() => {});
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlers = useMemo(
    () => ({
      item_added: (item) => setItems((prev) => [item, ...prev]),
      item_updated: (updated) =>
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item))),
      item_deleted: ({ id }) => setItems((prev) => prev.filter((item) => item.id !== id)),
      inventory_refreshed: (allItems) => setItems(allItems),
      system_health: (h) => setHealth(h),
    }),
    []
  );
  useSocket(handlers);

  const filtered = items
    .filter((item) => {
      if (criticalOnly) {
        const isCriticalCat = CRITICAL_CATEGORIES.has(item.category);
        const isLowStock = item.quantity > 0 && item.quantity <= 5;
        if (!isCriticalCat && !isLowStock) return false;
      }
      const text = `${item.name} ${item.location} ${item.category || ""}`.toLowerCase();
      return text.includes(query.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "quantity") return a.quantity - b.quantity;
      return String(a[sortBy] || "").localeCompare(String(b[sortBy] || ""));
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [query, sortBy, criticalOnly]);

  const systemTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="p-8 min-h-screen">
      {/* Dashboard Header Area — exact Stitch inventory */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-[#ffba38]" />
            <ScrambleText text="Module ID: INV-ALPHA-01" className="text-[10px] text-[#ffba38] font-bold tracking-[0.2em] uppercase" />
          </div>
          <ScrambleText text="Inventory" as="h2" delay={150} className="text-4xl font-bold tracking-tight text-[#e3e3dc] uppercase" />
          <p className="text-[#c5c7be] text-sm mt-1">
            TOTAL LOGGED RECORDS: <span className="text-[#bfcab1] font-bold">{filtered.length}</span>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#c5c7be]/60 font-medium block">SYSTEM TIME</span>
          <span className="text-xl font-bold text-[#e3e3dc] tracking-widest animate-subtle-glitch">
            {systemTime} UTC
          </span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Data Table Container */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-[#1a1c18] p-6 border-t border-[#a8b49b]/10 relative overflow-hidden">
            {/* Scan overlay line — exact Stitch */}
            <div className="scan-overlay" />

            {/* Filter bar */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                <button
                  className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                    !criticalOnly
                      ? "bg-[#3c4633] text-[#a8b49b]"
                      : "bg-transparent border border-[#454840]/30 text-[#c5c7be] hover:bg-[#383a35]"
                  }`}
                  onClick={() => setCriticalOnly(false)}
                  type="button"
                >
                  ALL ASSETS
                </button>
                <button
                  className={`px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-colors ${
                    criticalOnly
                      ? "bg-[#ffba38] text-[#432c00]"
                      : "bg-transparent border border-[#454840]/30 text-[#c5c7be] hover:bg-[#383a35]"
                  }`}
                  onClick={() => setCriticalOnly(true)}
                  type="button"
                >
                  CRITICAL ONLY
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#c5c7be] uppercase font-bold tracking-widest">Sort By:</span>
                <select
                  className="bg-[#333531] border-none text-[10px] font-bold tracking-widest text-[#e3e3dc] uppercase focus:ring-1 focus:ring-[#ffba38]"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="name">NAME</option>
                  <option value="quantity">QUANTITY</option>
                  <option value="location">LOCATION</option>
                  <option value="category">CATEGORY</option>
                </select>
              </div>
            </div>

            {/* Data Table — exact Stitch structure */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#454840]/20">
                    <th className="py-4 px-2 text-[10px] font-bold text-[#c5c7be] uppercase tracking-widest">Asset ID</th>
                    <th className="py-4 px-2 text-[10px] font-bold text-[#c5c7be] uppercase tracking-widest">Designation</th>
                    <th className="py-4 px-2 text-[10px] font-bold text-[#c5c7be] uppercase tracking-widest">Category</th>
                    <th className="py-4 px-2 text-[10px] font-bold text-[#c5c7be] uppercase tracking-widest">Location</th>
                    <th className="py-4 px-2 text-[10px] font-bold text-[#c5c7be] uppercase tracking-widest">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#454840]/10">
                  {paginated.map((item, idx) => {
                    const assetId = `#VH-${String(1000 + (item.id || idx)).slice(-4)}-${String.fromCharCode(65 + (idx % 26))}`;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#383a35] transition-colors group"
                      >
                        <td className="py-4 px-2 font-mono text-xs text-[#ffba38]">{assetId}</td>
                        <td className="py-4 px-2 text-sm font-bold uppercase tracking-tight">{item.name}</td>
                        <td className="py-4 px-2">
                          <span className="text-[10px] bg-[#3c4633] text-[#a8b49b] px-2 py-0.5 font-bold uppercase">
                            {item.category || "General"}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-[10px] text-[#c5c7be] font-bold uppercase">{item.location}</td>
                        <td className="py-4 px-2 text-sm font-bold">{item.quantityDisplay || item.quantity}</td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td className="px-6 py-16 text-center text-sm text-[#c5c7be]/40" colSpan={5}>
                        No items found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filtered.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-[#454840]/10 mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#c5c7be]/60">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} total
                </p>
                <div className="flex gap-2">
                  <button
                    className="border border-[#454840]/20 px-3 py-1 text-[10px] font-bold uppercase text-[#c5c7be] transition-colors hover:bg-[#383a35] disabled:opacity-30"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    type="button"
                  >
                    Prev
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`px-3 py-1 text-[10px] font-bold transition-all ${
                        p === currentPage
                          ? "bg-[#bfcab1] text-[#2a3322]"
                          : "border border-[#454840]/20 text-[#c5c7be] hover:bg-[#383a35]"
                      }`}
                      onClick={() => setPage(p)}
                      type="button"
                    >
                      {p}
                    </button>
                  ))}
                  {totalPages > 5 && <span className="px-2 text-[#c5c7be]/40">...</span>}
                  <button
                    className="border border-[#454840]/20 px-3 py-1 text-[10px] font-bold uppercase text-[#c5c7be] transition-colors hover:bg-[#383a35] disabled:opacity-30"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    type="button"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Last Audit Card */}
          <div className="bg-[#1e201c] p-6 relative overflow-hidden">
            <p className="text-[10px] font-bold text-[#c5c7be] uppercase tracking-widest mb-2">Last Audit</p>
            <p className="text-2xl font-black text-[#e3e3dc] tracking-tighter">
              {new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase()}
            </p>
            <p className="text-[10px] text-[#bfcab1] font-bold uppercase mt-4">Verified by The Boss</p>
            <p className="text-[12px] text-right text-[#c5c7be] font-bold uppercase tracking-widest mt-2">
              Click{" "}
              <a
                href="https://youtu.be/Aq5WXmQQooo?si=8EBl_52XjIWQac9G"
                target="_blank"
                rel="noreferrer"
                className="text-[#ffba38] underline underline-offset-4 hover:text-[#ffd27c]"
              >
                here
              </a>{" "}
              to know more
            </p>
          </div>
        </div>

        {/* Side Sidebar Widgets — exact Stitch */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Node Health Monitoring — Live */}
          <div className="bg-[#292b26] p-6 border-l-2 border-[#ffba38]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <ScrambleText text="Telemetry Stream" delay={400} className="text-[10px] text-[#ffba38] font-bold tracking-widest uppercase block" />
                <ScrambleText text="Node Health" as="h3" delay={500} className="text-lg font-black text-[#e3e3dc] uppercase tracking-tight" />
              </div>
              <span className="material-symbols-outlined text-[#ffba38] animate-pulse">sensors</span>
            </div>
            <div className="space-y-4">
              <div className="bg-[#0d0f0b] p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-[#c5c7be] uppercase tracking-widest">
                    {health?.hostname || "HOST"} CPU LOAD
                  </span>
                  <span className="text-[10px] font-bold text-[#bfcab1] tracking-tighter">
                    {health?.cpuUsage ?? "—"}%
                  </span>
                </div>
                <div className="w-full bg-[#333531] h-1.5">
                  <div
                    className="bg-[#bfcab1] h-full transition-all duration-700"
                    style={{ width: `${health?.cpuUsage ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0d0f0b] p-3">
                  <span className="text-[9px] font-bold text-[#c5c7be] uppercase tracking-widest block mb-1">Temperature</span>
                  <span className="text-lg font-black text-[#e3e3dc]">
                    {health?.cpuTemp ? `${health.cpuTemp}°C` : "N/A"}
                  </span>
                </div>
                <div className="bg-[#0d0f0b] p-3">
                  <span className="text-[9px] font-bold text-[#c5c7be] uppercase tracking-widest block mb-1">Uptime</span>
                  <span className="text-lg font-black text-[#e3e3dc]">
                    {health?.uptime || "—"}
                  </span>
                </div>
              </div>
              <div className="bg-[#0d0f0b] p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] font-bold text-[#c5c7be] uppercase tracking-widest">Memory Utilization</span>
                  <span className="text-[10px] font-bold text-[#ffba38] tracking-tighter">
                    {health ? `${health.memory.usedGB}GB / ${health.memory.totalGB}GB` : "—"}
                  </span>
                </div>
                <div className="w-full bg-[#333531] h-1.5">
                  <div
                    className="bg-[#ffba38] h-full transition-all duration-700"
                    style={{ width: `${health?.memory?.percent ?? 0}%` }}
                  />
                </div>
              </div>
              <div className="border-t border-[#454840]/20 pt-4 flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#c5c7be] uppercase">Platform</span>
                <span className="text-[10px] font-bold text-[#bfcab1]">
                  {health?.platform || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Top 5 Items by Quantity — Histogram */}
          <div className="bg-[#1e201c] p-6">
            <ScrambleText text="Top 5 Items by Quantity" as="p" delay={600} className="text-[10px] font-bold text-[#c5c7be] uppercase tracking-widest mb-4" />
            <div className="space-y-3">
              {[...items]
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5)
                .map((item, i) => {
                  const maxQty = Math.max(...items.map((it) => it.quantity), 1);
                  const pct = Math.round((item.quantity / maxQty) * 100);
                  const colors = ["#ffba38", "#bfcab1", "#bfcab1", "#bfcab1", "#bfcab1"];
                  return (
                    <div key={item.id || i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-bold text-[#c5c7be] uppercase tracking-widest truncate max-w-[70%]">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-bold tracking-tighter" style={{ color: colors[i] }}>
                          {item.quantity}
                        </span>
                      </div>
                      <div className="w-full bg-[#333531] h-2">
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: colors[i] }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
