interface RuntimeConfig {
  operatorUrls: string[]
}

let _config: RuntimeConfig | null = null

export async function loadRuntimeConfig(): Promise<void> {
  try {
    const res = await fetch('/config.json', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    _config = (await res.json()) as RuntimeConfig
  } catch {
    // Fallback to build-time var (e.g. local dev without config.json)
    _config = { operatorUrls: [import.meta.env.VITE_API_URL] }
  }
}

export function getOperatorUrls(): string[] {
  return _config?.operatorUrls ?? [import.meta.env.VITE_API_URL]
}
