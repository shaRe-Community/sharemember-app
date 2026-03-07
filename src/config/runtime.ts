export interface OperatorConfig {
  url: string
  name: string
}

interface RuntimeConfig {
  operators?: OperatorConfig[]
  operatorUrls?: string[] // legacy format
}

let _config: RuntimeConfig | null = null

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    _config = (await res.json()) as RuntimeConfig
  } catch {
    _config = { operatorUrls: [import.meta.env.VITE_API_URL] }
  }
}

function deriveNameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname
    const segment = hostname.split('.')[0]
    return segment.charAt(0).toUpperCase() + segment.slice(1)
  } catch {
    return url
  }
}

export function getOperators(): OperatorConfig[] {
  if (_config?.operators?.length) {
    return _config.operators
  }
  // Legacy: operatorUrls without names — derive name from hostname
  return (_config?.operatorUrls ?? [import.meta.env.VITE_API_URL]).map((url) => ({
    url,
    name: deriveNameFromUrl(url),
  }))
}

export function getOperatorUrls(): string[] {
  return getOperators().map((o) => o.url)
}
