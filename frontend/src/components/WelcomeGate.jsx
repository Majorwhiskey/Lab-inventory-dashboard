import { useEffect, useState } from "react";
import api from "../api/client";

export default function WelcomeGate({ onUnlock }) {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [knownName, setKnownName] = useState("");
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("input");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const startedAt = Date.now();
    api
      .get("/visitor-name", { timeout: 3000 })
      .then(({ data }) => {
        if (data?.name) {
          setKnownName(data.name);
          setMessage(`Welcome back Noob, oh! I mean ${data.name}, my bad..!`);
          setPhase("returning");
          setTimeout(() => onUnlock(), 2400);
        }
      })
      .finally(() => {
        const elapsed = Date.now() - startedAt;
        const waitMs = Math.max(0, 1000 - elapsed);
        setTimeout(() => setLoadingProfile(false), waitMs);
      });
  }, [onUnlock]);

  const submitName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setPhase("loading");
    await new Promise((r) => setTimeout(r, 1200));
    try {
      await api.post("/visitor-name", { name: trimmed }, { timeout: 3000 });
    } catch {
      // Allow login flow even if visitor-name API is unavailable.
    }
    setKnownName(trimmed);
    setMessage(`Hello there, ${trimmed} seems good but "Noob" would suit you better, Anyways ...`);
    setPhase("message");
    setTimeout(() => onUnlock(), 2600);
  };

  if (loadingProfile) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#0b0c09]/90 backdrop-blur-md flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-[#ffba38]/30 border-t-[#ffba38] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#0b0c09]/90 backdrop-blur-md flex items-center justify-center px-4">
      <div className="w-full max-w-xl border border-[#454840]/40 bg-[#1a1c18]/95 p-8">
        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-[#454840]/25">
          <span className="material-symbols-outlined text-[#a8b49b] text-4xl">inventory_2</span>
          <div className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tighter text-[#a8b49b] uppercase">LAB INVENTORY</span>
            <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#ffba38]">
              Management System
            </span>
          </div>
        </div>
        {phase === "input" && (
          <>
            <h1 className="text-3xl font-black text-[#ffba38] uppercase tracking-tight">WELCOME NOOB</h1>
            <p className="mt-3 text-sm text-[#c5c7be] uppercase tracking-wide">
              Please enter your name to access the inventory
            </p>
            <form className="mt-6 flex gap-3" onSubmit={submitName}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="YOUR NAME"
                className="flex-1 bg-[#121410] border border-[#454840]/40 px-3 py-2 text-[#e3e3dc] uppercase text-sm outline-none focus:border-[#ffba38]"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-[#ffba38] text-[#432c00] text-xs font-black tracking-widest uppercase"
              >
                Enter
              </button>
            </form>
          </>
        )}

        {(phase === "loading" || phase === "message" || phase === "returning") && (
          <div className="min-h-[110px] flex flex-col justify-center">
            {phase === "loading" && (
              <div className="flex items-center gap-3 text-[#c5c7be]">
                <div className="h-6 w-6 border-2 border-[#ffba38]/30 border-t-[#ffba38] rounded-full animate-spin" />
                <span className="text-sm uppercase tracking-wide">Loading profile...</span>
              </div>
            )}
            {(phase === "message" || phase === "returning") && (
              <p className="text-[#e3e3dc] text-base leading-relaxed">{message}</p>
            )}
            {knownName && (
              <p className="mt-4 text-[11px] text-[#c5c7be]/60 uppercase tracking-wider">
                User: {knownName}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
