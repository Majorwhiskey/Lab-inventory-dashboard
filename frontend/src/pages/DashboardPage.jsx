import { useEffect, useMemo, useState } from "react";
import api from "../api/client";
import { useSocket } from "../hooks/useSocket";
import ScrambleText from "../components/ScrambleText";

export default function DashboardPage() {
  const [data, setData] = useState({
    totalItems: 0,
    categoriesCount: 0,
    recentActivity: [],
  });
  const [health, setHealth] = useState(null);
  const [now, setNow] = useState(new Date());

  const fetchDashboard = async () => {
    const { data: dashboard } = await api.get("/dashboard");
    setData(dashboard);
  };

  useEffect(() => {
    fetchDashboard();
    api.get("/system-health").then(({ data: h }) => setHealth(h)).catch(() => {});
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlers = useMemo(
    () => ({
      item_added: fetchDashboard,
      item_updated: fetchDashboard,
      item_deleted: fetchDashboard,
      inventory_refreshed: fetchDashboard,
      system_health: (h) => setHealth(h),
    }),
    []
  );
  useSocket(handlers);

  const systemTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header — same tactical style */}
      <div className="flex justify-between items-end mb-8 border-b border-[#454840]/20 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-[#ffba38]" />
            <ScrambleText text="Module ID: SYS-HEALTH-001" className="text-[10px] text-[#ffba38] font-bold tracking-[0.2em] uppercase" />
          </div>
          <ScrambleText text="System Health" as="h2" delay={150} className="text-4xl font-bold tracking-tight text-[#e3e3dc] uppercase" />
          <p className="text-[#c5c7be] text-sm mt-1">
            Real-time status and activity feed for the laboratory inventory system.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#c5c7be]/60 font-medium block">SYSTEM TIME</span>
          <span className="text-xl font-bold text-[#e3e3dc] tracking-widest animate-subtle-glitch">
            {systemTime} UTC
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-12 gap-5 mb-8">
        <div className="col-span-12 lg:col-span-4 bg-[#1a1c18] p-5 border-t-2 border-[#bfcab1]/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#bfcab1] text-sm">inventory_2</span>
            <ScrambleText text="Total Assets" delay={300} className="text-[10px] font-bold tracking-widest uppercase text-[#c5c7be]" />
          </div>
          <span className="text-5xl font-black text-[#bfcab1] block">
            {data.totalItems || "—"}
          </span>
          <p className="mt-2 text-xs text-[#c5c7be]/60 uppercase">Items tracked across all storage</p>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-[#1a1c18] p-5 border-t-2 border-[#ffba38]/30">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-[#ffba38] text-sm">category</span>
            <ScrambleText text="Categories" delay={400} className="text-[10px] font-bold tracking-widest uppercase text-[#c5c7be]" />
          </div>
          <span className="text-5xl font-black text-[#ffba38] block">
            {data.categoriesCount || "—"}
          </span>
          <p className="mt-2 text-xs text-[#c5c7be]/60 uppercase">Distinct classification groups</p>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-[#292b26] p-6 border-l-2 border-[#ffba38]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <ScrambleText text="Telemetry Stream" delay={400} className="text-[10px] text-[#ffba38] font-bold tracking-widest uppercase block" />
              <ScrambleText text="Node Health" as="h3" delay={500} className="text-lg font-black text-[#e3e3dc] uppercase tracking-tight" />
            </div>
            <span className="material-symbols-outlined text-[#ffba38] animate-pulse">sensors</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-[#454840]/10 pb-2">
              <span className="text-xs uppercase font-medium text-[#c5c7be]/80">{health?.hostname || "Node"}</span>
              <span className="text-[10px] bg-[#3c4633] text-[#a8b49b] px-2 py-0.5 font-bold animate-status-pulse">
                {health ? "ACTIVE" : "OFFLINE"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-[#454840]/10 pb-2">
              <span className="text-xs uppercase font-medium text-[#c5c7be]/80">CPU</span>
              <span className="text-[10px] text-[#ffba38] font-bold">{health?.cpuUsage ?? "—"}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#454840]/10 pb-2">
              <span className="text-xs uppercase font-medium text-[#c5c7be]/80">Memory</span>
              <span className="text-[10px] text-[#ffba38] font-bold">
                {health ? `${health.memory.usedGB}/${health.memory.totalGB} GB` : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-[#454840]/10 pb-2">
              <span className="text-xs uppercase font-medium text-[#c5c7be]/80">Temp</span>
              <span className="text-[10px] text-[#ffba38] font-bold">
                {health?.cpuTemp ? `${health.cpuTemp}°C` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs uppercase font-medium text-[#c5c7be]/80">Uptime</span>
              <span className="text-[10px] text-[#ffba38] font-bold">{health?.uptime || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center gap-4 mb-6">
          <ScrambleText text="Recent Activity" as="h2" delay={300} className="text-2xl font-black uppercase tracking-tighter text-[#e3e3dc]" />
          <div className="flex-1 h-px bg-[#454840]/20" />
        </div>
        <div className="bg-[#1a1c18] border-t border-[#a8b49b]/10 relative overflow-hidden">
          <div className="scan-overlay" />
          <div className="bg-[#292b26]">
            <div className="grid grid-cols-12 px-6 py-4">
              <div className="col-span-5 text-[10px] font-bold uppercase tracking-widest text-[#c5c7be]">Details</div>
              <div className="col-span-3 text-[10px] font-bold uppercase tracking-widest text-[#c5c7be]">User</div>
              <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-[#c5c7be]">Action</div>
              <div className="col-span-2 text-right text-[10px] font-bold uppercase tracking-widest text-[#c5c7be]">Date</div>
            </div>
          </div>
          <div className="divide-y divide-[#454840]/10">
            {data.recentActivity.map((entry) => (
              <div
                key={entry.id}
                className="grid grid-cols-12 items-center px-6 py-5 hover:bg-[#383a35] transition-colors"
              >
                <div className="col-span-5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#a8b49b] text-sm">
                    {entry.action === "added"
                      ? "add_circle"
                      : entry.action === "updated"
                      ? "edit"
                      : entry.action === "deleted"
                      ? "delete"
                      : "info"}
                  </span>
                  <span className="text-sm text-[#e3e3dc]">{entry.details}</span>
                </div>
                <div className="col-span-3 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center bg-[#333531] text-[10px] font-black text-[#c5c7be]">
                    {(entry.userName || "?")[0].toUpperCase()}
                  </div>
                  <span className="text-xs text-[#c5c7be]">{entry.userName}</span>
                </div>
                <div className="col-span-2">
                  <span className="bg-[#3c4633] text-[#a8b49b] px-2 py-0.5 text-[10px] font-bold uppercase">
                    {entry.action}
                  </span>
                </div>
                <div className="col-span-2 text-right text-xs text-[#c5c7be]">
                  {new Date(entry.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "2-digit",
                  })}
                </div>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <span className="material-symbols-outlined text-4xl text-[#454840]/30">history</span>
                <p className="text-xs text-[#c5c7be]/40 uppercase font-bold">No activity recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer Meta */}
      <div className="mt-16 flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#c5c7be]/30">
        <ScrambleText text="VARAHA-INVENTORY CONTROL SYSTEM // V.4.8.2-STABLE" delay={800} />
        <ScrambleText text="AUTHORIZED USE ONLY // ENCRYPTION AES-256 ACTIVE" delay={1000} />
      </div>
    </div>
  );
}
