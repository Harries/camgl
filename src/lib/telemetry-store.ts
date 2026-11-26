export interface VitalSample {
  name: "LCP" | "INP" | "CLS";
  value: number;
  path: string;
  ts: number;
}

export interface ClientErrorSample {
  message: string;
  path: string;
  ts: number;
}

interface TelemetryStore {
  vitals: VitalSample[];
  errors: ClientErrorSample[];
}

const globalForTelemetry = globalThis as unknown as {
  __camglTelemetry?: TelemetryStore;
};

const store = (globalForTelemetry.__camglTelemetry ??= {
  vitals: [],
  errors: [],
});

const MAX_SAMPLES = 300;

export function recordVital(sample: VitalSample): void {
  store.vitals.push(sample);
  if (store.vitals.length > MAX_SAMPLES) {
    store.vitals.splice(0, store.vitals.length - MAX_SAMPLES);
  }
}

export function recordClientError(sample: ClientErrorSample): void {
  store.errors.unshift(sample);
  if (store.errors.length > 100) {
    store.errors.length = 100;
  }
}

function p75(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.75));
  return Number(sorted[idx].toFixed(3));
}

export function getTelemetrySummary() {
  const lcp = p75(store.vitals.filter((v) => v.name === "LCP").map((v) => v.value));
  const inp = p75(store.vitals.filter((v) => v.name === "INP").map((v) => v.value));
  const cls = p75(store.vitals.filter((v) => v.name === "CLS").map((v) => v.value));
  return {
    sampleCount: store.vitals.length,
    lcpP75Ms: lcp,
    inpP75Ms: inp,
    clsP75: cls,
    errorCount: store.errors.length,
    recentErrors: store.errors.slice(0, 10),
  };
}
