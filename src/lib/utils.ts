import type { Unit, ExpClass } from '../types/unit'

export const TARGET_PX = 900

export function flLbl(p: number): string {
  return p > 0 ? `P${p}` : `S${Math.abs(p)}`
}

export function daysUntil(s: string, today: Date): number | null {
  if (!s || s === '-') return null
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : Math.round((d.getTime() - today.getTime()) / 86400000)
}

export function expClass(u: Unit, today: Date): ExpClass {
  if (u.vacante) return ''
  const d = daysUntil(u.vencimiento, today)
  if (d === null) return ''
  if (d < 180) return 'exp-crit'
  if (d < 365) return 'exp-warn'
  if (d < 730) return 'exp-watch'
  return ''
}

export function txtCol(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.52 ? '#212121' : '#FFFFFF'
}

export function fmt(n: number | null | undefined, decimals = 0): string {
  if (n === undefined || n === null || isNaN(n)) return '—'
  return n.toLocaleString('es-CL', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function calcScale(byFloor: Record<number, Unit[]>, ofLocFloors: number[]): number {
  let maxM2 = 0
  const towerFloors = ofLocFloors.filter((p) => p > 3)
  const floorsToCheck = towerFloors.length ? towerFloors : ofLocFloors
  floorsToCheck.forEach((piso) => {
    const tot = (byFloor[piso] ?? []).reduce((s, u) => s + u.util_m2, 0)
    if (tot > maxM2) maxM2 = tot
  })
  return maxM2 > 0 ? TARGET_PX / maxM2 : 1
}

export function groupByFloor(units: Unit[]): Record<number, Unit[]> {
  const map: Record<number, Unit[]> = {}
  units.forEach((u) => {
    if (!map[u.piso]) map[u.piso] = []
    map[u.piso]!.push(u)
  })
  return map
}
