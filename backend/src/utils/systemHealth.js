const os = require("os");
const fs = require("fs");

let prevCpuTimes = null;

function getCpuTimes() {
  const cpus = os.cpus();
  let idle = 0;
  let total = 0;
  for (const cpu of cpus) {
    for (const type of Object.keys(cpu.times)) {
      total += cpu.times[type];
    }
    idle += cpu.times.idle;
  }
  return { idle, total };
}

function getCpuUsage() {
  const curr = getCpuTimes();
  if (!prevCpuTimes) {
    prevCpuTimes = curr;
    return 0;
  }
  const idleDelta = curr.idle - prevCpuTimes.idle;
  const totalDelta = curr.total - prevCpuTimes.total;
  prevCpuTimes = curr;
  if (totalDelta === 0) return 0;
  return Math.round(((totalDelta - idleDelta) / totalDelta) * 100);
}

function getCpuTemp() {
  try {
    const raw = fs.readFileSync("/sys/class/thermal/thermal_zone0/temp", "utf8");
    return (parseInt(raw, 10) / 1000).toFixed(1);
  } catch {
    return null;
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${String(hours).padStart(2, "0")}h`;
  if (hours > 0) return `${hours}h ${String(mins).padStart(2, "0")}m`;
  return `${mins}m`;
}

function getMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  return {
    usedGB: (used / 1073741824).toFixed(1),
    totalGB: (total / 1073741824).toFixed(1),
    percent: Math.round((used / total) * 100),
  };
}

async function getSystemHealth() {
  const mem = getMemory();
  const cpuTemp = getCpuTemp();
  const uptimeSec = os.uptime();

  return {
    hostname: os.hostname(),
    platform: `${os.platform()} ${os.arch()}`,
    cpuUsage: getCpuUsage(),
    cpuCores: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || "Unknown",
    cpuTemp,
    memory: mem,
    uptime: formatUptime(uptimeSec),
    uptimeSeconds: Math.round(uptimeSec),
    loadAvg: os.loadavg().map((v) => v.toFixed(2)),
    timestamp: Date.now(),
  };
}

// Prime the CPU delta on module load
getCpuUsage();

module.exports = { getSystemHealth };
