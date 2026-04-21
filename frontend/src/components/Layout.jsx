import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import api from "../api/client";
import { useSocket } from "../hooks/useSocket";
import ScrambleText from "./ScrambleText";

const mainNav = [
  { to: "/inventory", label: "Inventory", icon: "inventory_2" },
  { to: "/upload", label: "Export", icon: "ios_share" },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [nodeName, setNodeName] = useState("RPi-04");

  const [searchParams, setSearchParams] = useSearchParams();
  const isInventoryActive = location.pathname === "/inventory";
  const isExportActive = location.pathname === "/upload";
  const headerQuery = isInventoryActive ? (searchParams.get("q") || "") : "";

  useEffect(() => {
    api
      .get("/system-health")
      .then(({ data }) => {
        if (data?.hostname) setNodeName(String(data.hostname));
      })
      .catch(() => {});
  }, []);

  const handlers = useMemo(
    () => ({
      system_health: (h) => {
        if (h?.hostname) setNodeName(String(h.hostname));
      },
    }),
    []
  );
  useSocket(handlers);

  return (
    <div className="min-h-screen bg-[#121410] text-[#e3e3dc] font-['Manrope'] overflow-hidden">
      {/* Micro-Grid Overlay */}
      <div className="fixed inset-0 micro-grid pointer-events-none z-0" />

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#121410] border-b-0 border-[#a8b49b]/10">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#a8b49b] text-3xl">inventory_2</span>
          <div className="flex flex-col leading-tight">
            <ScrambleText text="LAB INVENTORY" className="text-lg font-bold tracking-tighter text-[#a8b49b] uppercase" />
            <ScrambleText text="Management System" delay={300} className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#ffba38]" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Search bar (shown on inventory page) */}
          {isInventoryActive && (
            <div className="hidden md:flex items-center bg-[#1a1c18] px-3 py-1 border border-[#454840]/30">
              <span className="material-symbols-outlined text-[#a8b49b]/60 text-sm mr-2">search</span>
              <input
                className="bg-transparent border-none text-xs focus:ring-0 focus:outline-none text-[#a8b49b] placeholder-[#a8b49b]/30 w-48 font-bold tracking-widest uppercase"
                placeholder="QUERY DATABASE..."
                type="text"
                value={headerQuery}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v) setSearchParams({ q: v });
                  else setSearchParams({});
                }}
              />
              {headerQuery && (
                <button
                  className="text-[#a8b49b]/40 hover:text-[#ffba38] transition-colors ml-1"
                  onClick={() => setSearchParams({})}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}
            </div>
          )}
          {/* Nav tabs (shown on export page like Stitch) */}
          {isExportActive && (
            <div className="hidden md:flex gap-8">
              <Link
                to="/inventory"
                className="tracking-tight uppercase font-medium text-[#a8b49b]/60 hover:bg-[#383a35] transition-colors duration-150 px-2 py-1"
              >
                Inventory
              </Link>
              <Link
                to="/upload"
                className="tracking-tight uppercase font-medium text-[#ffba38] border-b-2 border-[#ffba38] px-2 py-1"
              >
                Export
              </Link>
            </div>
          )}
          {/* Profile button */}
          <button
            className="flex items-center gap-2 bg-[#3c4633] hover:bg-[#454840] transition-colors duration-150 px-3 py-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[#a8b49b] text-lg">person</span>
            <span className="text-[10px] font-bold tracking-widest uppercase text-[#a8b49b]">PROFILE</span>
          </button>
        </div>
      </header>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 flex flex-col justify-between bg-[#1a1c18] border-r border-[#454840]/15 z-40">
        <div className="flex flex-col">
          {/* Node Status */}
          <div className="p-6 border-b border-[#454840]/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#3c4633] flex items-center justify-center animate-status-pulse">
                <span className="material-symbols-outlined text-[#ffba38]">terminal</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-[#a8b49b] uppercase tracking-tighter">
                  NODE: {nodeName}
                </p>
                <ScrambleText text="STATUS: OPERATIONAL" as="p" delay={500} className="text-[9px] font-bold text-[#ffba38] tracking-widest animate-status-pulse" />
              </div>
            </div>
          </div>

          {/* Main Nav */}
          <nav className="mt-4">
            {mainNav.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center px-4 py-3 transition-all duration-200 ease-in-out group ${
                    active
                      ? "bg-[#3c4633] text-[#a8b49b] border-l-4 border-[#ffba38]"
                      : "text-[#a8b49b]/40 hover:bg-[#292b26] hover:text-[#a8b49b]"
                  }`}
                >
                  <span className="material-symbols-outlined mr-3 text-sm">{item.icon}</span>
                  <ScrambleText text={item.label} trigger="hover" className="text-xs font-bold tracking-widest uppercase" />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col">
          <nav className="border-t border-[#454840]/10">
            <Link
              to="/dashboard"
              className={`flex items-center px-4 py-3 transition-all duration-200 ease-in-out group ${
                location.pathname === "/dashboard"
                  ? "bg-[#3c4633] text-[#a8b49b] border-l-4 border-[#ffba38]"
                  : "text-[#a8b49b]/40 hover:bg-[#292b26] hover:text-[#a8b49b]"
              }`}
            >
              <span className="material-symbols-outlined mr-3 text-sm">monitoring</span>
              <ScrambleText text="System Health" trigger="hover" className="text-xs font-bold tracking-widest uppercase text-[10px]" />
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 mt-16 min-h-screen bg-[#121410] relative">
        {children}
      </main>
    </div>
  );
}
