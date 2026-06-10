import type { Unit } from '../types/unit'

export type ChartMetric = 'm2' | 'un' | 'uf'

function metricVal(u: Unit, metric: ChartMetric): number {
  if (metric === 'uf') return u.canon
  if (metric === 'un') return 1
  return u.util_m2
}

function metricLabel(metric: ChartMetric): string {
  if (metric === 'uf') return 'UF/mes'
  if (metric === 'un') return 'Unidades'
  return 'm²'
}

// ── Vencimientos chart ────────────────────────────────────────────────────────

export interface VencBarDatum {
  label: string     // "Ene 2026"
  yearMonth: string // "2026-01"
  vencimientos: number
  salidas: number
}

function parseYM(dateStr: string): string | null {
  if (!dateStr) return null
  const m = dateStr.match(/^(\d{4})-(\d{2})/)
  if (!m) return null
  return `${m[1]}-${m[2]}`
}

function ymLabel(ym: string): string {
  const [y, mo] = ym.split('-')
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return `${months[parseInt(mo!) - 1]} ${y}`
}

export function buildVencData(
  units: Unit[],
  fromYM: string,
  toYM: string,
  mode: 'venc' | 'salida' | 'both',
  tipoFilter: string,
  metric: ChartMetric,
): VencBarDatum[] {
  const filtered = units.filter((u) => {
    if (u.vacante) return false
    if (tipoFilter && u.tipo !== tipoFilter) return false
    return true
  })

  // Enumerate months in range
  const months: string[] = []
  let cur = fromYM
  while (cur <= toYM) {
    months.push(cur)
    const [y, mo] = cur.split('-').map(Number)
    const next = mo! === 12 ? `${y! + 1}-01` : `${y}-${String(mo! + 1).padStart(2, '0')}`
    cur = next
  }

  const vencMap: Record<string, number> = {}
  const salidaMap: Record<string, number> = {}
  for (const m of months) { vencMap[m] = 0; salidaMap[m] = 0 }

  for (const u of filtered) {
    const v = parseYM(u.vencimiento)
    const s = parseYM(u.salida_anticipada)
    const val = metricVal(u, metric)
    if ((mode === 'venc' || mode === 'both') && v && v >= fromYM && v <= toYM) {
      vencMap[v] = (vencMap[v] ?? 0) + val
    }
    if ((mode === 'salida' || mode === 'both') && s && s >= fromYM && s <= toYM) {
      salidaMap[s] = (salidaMap[s] ?? 0) + val
    }
  }

  return months.map((ym) => ({
    label: ymLabel(ym),
    yearMonth: ym,
    vencimientos: Math.round((vencMap[ym] ?? 0) * 100) / 100,
    salidas: Math.round((salidaMap[ym] ?? 0) * 100) / 100,
  }))
}

// ── Ranking chart ─────────────────────────────────────────────────────────────

export interface RankDatum {
  tenant: string
  value: number
  color: string
}

export function buildRankData(
  units: Unit[],
  metric: ChartMetric,
  tipoFilter: string,
  tipo2Filter: string,
  estadoFilter: string,
  categoriaFilter: string,
  colorMap: Record<string, string>,
): RankDatum[] {
  const filtered = units.filter((u) => {
    if (u.vacante) return false
    if (tipoFilter && u.tipo !== tipoFilter) return false
    if (tipo2Filter && u.tipo2 !== tipo2Filter) return false
    if (estadoFilter === 'vacante' && !u.vacante) return false
    if (estadoFilter === 'arrendado' && u.vacante) return false
    const isComun = ['común','comun'].includes(u.categoria.toLowerCase())
    if (categoriaFilter === 'Arrendable' && isComun) return false
    if (categoriaFilter === 'Común' && !isComun) return false
    return true
  })

  const map: Record<string, number> = {}
  for (const u of filtered) {
    map[u.arrendatario] = (map[u.arrendatario] ?? 0) + metricVal(u, metric)
  }

  return Object.entries(map)
    .map(([tenant, value]) => ({
      tenant,
      value: Math.round(value * 100) / 100,
      color: colorMap[tenant] ?? '#90A4AE',
    }))
    .sort((a, b) => b.value - a.value)
}

export { metricLabel }
