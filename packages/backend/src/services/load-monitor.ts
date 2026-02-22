import { cpus, totalmem, freemem, loadavg } from "node:os";

/**
 * System load monitor.
 *
 * Periodically checks CPU and memory usage. When the system is
 * overloaded (RAM ≥ 90% AND CPU ≥ 100%), callers are advised to
 * forward incoming requests to available cluster nodes.
 */

/** Represents a snapshot of system resource usage. */
export interface SystemLoad {
  /** CPU usage as a percentage (0–N×100 for N cores). */
  cpuPercent: number;
  /** Total system memory in bytes. */
  totalMemory: number;
  /** Free system memory in bytes. */
  freeMemory: number;
  /** Memory usage as a percentage (0–100). */
  memoryPercent: number;
  /** 1-minute load average. */
  loadAvg1m: number;
  /** Number of logical CPU cores. */
  cpuCount: number;
  /** Timestamp of this snapshot. */
  timestamp: string;
}

/** RAM usage threshold (percentage) above which we consider overloaded. */
const RAM_THRESHOLD = 90;

/** CPU usage threshold (percentage of total capacity) above which we consider overloaded. */
const CPU_THRESHOLD = 100;

/** Monitoring interval in milliseconds. */
const DEFAULT_MONITOR_INTERVAL_MS = 5_000;

/** Cached CPU times from the previous sample (for delta computation). */
let _prevCpuTimes: { idle: number; total: number } | null = null;

/** Most recent computed load snapshot. */
let _lastLoad: SystemLoad | null = null;

/** Interval handle for the periodic monitor. */
let _monitorInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Compute aggregate CPU times across all cores.
 * Returns total and idle milliseconds.
 */
function getCpuTimes(): { idle: number; total: number } {
  const cores = cpus();
  let idle = 0;
  let total = 0;

  for (const core of cores) {
    const t = core.times;
    idle += t.idle;
    total += t.user + t.nice + t.sys + t.irq + t.idle;
  }

  return { idle, total };
}

/**
 * Compute current CPU usage as a percentage by comparing
 * delta CPU times between two samples.
 */
function computeCpuPercent(): number {
  const current = getCpuTimes();

  if (!_prevCpuTimes) {
    _prevCpuTimes = current;
    // First sample – use load average as a proxy
    const avg = loadavg()[0];
    return Math.round((avg / cpus().length) * 100);
  }

  const idleDelta = current.idle - _prevCpuTimes.idle;
  const totalDelta = current.total - _prevCpuTimes.total;

  _prevCpuTimes = current;

  if (totalDelta === 0) return 0;

  // Percentage of time spent NOT idle, scaled across all cores
  const usagePercent = ((totalDelta - idleDelta) / totalDelta) * 100 * cpus().length;
  return Math.round(usagePercent * 100) / 100;
}

/**
 * Get the current system load snapshot.
 *
 * If the monitor is running the cached value is returned.
 * Otherwise a fresh snapshot is computed.
 *
 * @returns Current system load metrics.
 */
export function getSystemLoad(): SystemLoad {
  if (_lastLoad && _monitorInterval) {
    return _lastLoad;
  }

  const total = totalmem();
  const free = freemem();
  const used = total - free;

  _lastLoad = {
    cpuPercent: computeCpuPercent(),
    totalMemory: total,
    freeMemory: free,
    memoryPercent: Math.round((used / total) * 100 * 100) / 100,
    loadAvg1m: loadavg()[0],
    cpuCount: cpus().length,
    timestamp: new Date().toISOString(),
  };

  return _lastLoad;
}

/**
 * Determine whether incoming requests should be forwarded to
 * cluster nodes because the local system is overloaded.
 *
 * The system is considered overloaded when **both**:
 *  - RAM usage ≥ 90%
 *  - CPU usage ≥ 100% (across all cores)
 *
 * @returns `true` if request forwarding is recommended.
 */
export function shouldForwardRequests(): boolean {
  const load = getSystemLoad();
  return load.memoryPercent >= RAM_THRESHOLD && load.cpuPercent >= CPU_THRESHOLD;
}

/**
 * Start the periodic load monitor.
 *
 * Samples CPU and memory at a regular interval so that
 * `getSystemLoad()` returns a cached snapshot without blocking.
 *
 * @param intervalMs - Sampling interval (default 5 seconds).
 * @returns A function that stops the monitor.
 */
export function startLoadMonitor(
  intervalMs = DEFAULT_MONITOR_INTERVAL_MS,
): () => void {
  if (_monitorInterval) {
    clearInterval(_monitorInterval);
  }

  // Take initial sample
  getSystemLoad();

  console.log(`[load-monitor] Started (interval: ${intervalMs}ms)`);

  _monitorInterval = setInterval(() => {
    const total = totalmem();
    const free = freemem();
    const used = total - free;

    _lastLoad = {
      cpuPercent: computeCpuPercent(),
      totalMemory: total,
      freeMemory: free,
      memoryPercent: Math.round((used / total) * 100 * 100) / 100,
      loadAvg1m: loadavg()[0],
      cpuCount: cpus().length,
      timestamp: new Date().toISOString(),
    };
  }, intervalMs);

  // Don't prevent process exit
  _monitorInterval.unref();

  return () => {
    if (_monitorInterval) {
      clearInterval(_monitorInterval);
      _monitorInterval = null;
      console.log("[load-monitor] Stopped");
    }
  };
}
