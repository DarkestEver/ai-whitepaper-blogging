import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";

const port = Number(process.env.PORT || 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`Invalid PORT value: ${process.env.PORT || port}`);
  process.exit(1);
}

function windowsListenerPids(targetPort) {
  try {
    const output = execFileSync("netstat", ["-ano", "-p", "tcp"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return [...new Set(output.split(/\r?\n/).flatMap((line) => {
      const columns = line.trim().split(/\s+/);
      if (columns[0] !== "TCP" || columns[3] !== "LISTENING") return [];
      const portMatch = columns[1]?.match(/:(\d+)$/);
      return portMatch?.[1] === String(targetPort) && /^\d+$/.test(columns[4] ?? "") ? [columns[4]] : [];
    }))];
  } catch {
    return [];
  }
}

function unixListenerPids(targetPort) {
  try {
    const output = execFileSync("sh", ["-c", `lsof -nP -t -iTCP:${targetPort} -sTCP:LISTEN 2>/dev/null || true`], { encoding: "utf8" });
    return [...new Set(output.split(/\s+/).filter((pid) => /^\d+$/.test(pid) && pid !== String(process.pid)))];
  } catch {
    return [];
  }
}

const pids = process.platform === "win32" ? windowsListenerPids(port) : unixListenerPids(port);
for (const pid of pids) {
  if (process.platform === "win32") {
    try { execFileSync("taskkill", ["/PID", pid, "/T", "/F"], { stdio: "ignore" }); } catch { /* process may exit between detection and termination */ }
  } else {
    try { process.kill(Number(pid), "SIGTERM"); } catch { /* process may exit between detection and termination */ }
  }
  console.log(`Stopped existing development listener ${pid} on port ${port}.`);
}

const nextBin = fileURLToPath(new URL("./node_modules/next/dist/bin/next", import.meta.url));
const next = spawn(process.execPath, [nextBin, "dev", "--hostname", "0.0.0.0", "--port", String(port)], { stdio: "inherit", env: process.env });
next.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
