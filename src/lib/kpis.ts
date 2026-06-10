import type { Unit, KPIs } from '../types/unit'
import { daysUntil } from './utils'

function isM2(u: Unit): boolean {
  return u.unidad_arrendable !== 'Un.' && u.unidad_arrendable !== 'un.'
}

function isArrendable(u: Unit): boolean {
  // 'Común' units are excluded from KPIs; empty categoria = backwards-compatible (include)
  return u.categoria.toLowerCase() !== 'común' && u.categoria.toLowerCase() !== 'comun'
}

export function computeKPIs(units: Unit[], today: Date): KPIs {
  // KPIs only consider m² + arrendable units — Un. and Común excluded from area/occupancy
  const m2Units = units.filter((u) => isM2(u) && isArrendable(u))
  const occ = m2Units.filter((u) => !u.vacante)
  const vac = m2Units.filter((u) => u.vacante)

  const totalM2   = m2Units.reduce((s, u) => s + u.util_m2, 0)
  const occupiedM2 = occ.reduce((s, u) => s + u.util_m2, 0)
  const vacantM2   = vac.reduce((s, u) => s + u.util_m2, 0)

  // Canon includes all occupied arrendable units (m² + Un., excluding Común)
  const totalCanon = units.filter((u) => !u.vacante && isArrendable(u)).reduce((s, u) => s + u.canon, 0)

  const occupancyRate = totalM2 > 0 ? (occupiedM2 / totalM2) * 100 : 0
  const avgUfM2 = occupiedM2 > 0
    ? occ.reduce((s, u) => s + u.uf_m2 * u.util_m2, 0) / occupiedM2
    : 0

  const expiring = occ.filter((u) => {
    const d = daysUntil(u.vencimiento, today)
    return d !== null && d >= 0 && d < 365
  })
  const expired = occ.filter((u) => {
    const d = daysUntil(u.vencimiento, today)
    return d !== null && d < 0
  })

  return {
    occupancyRate,
    occupiedM2,
    totalM2,
    vacantM2,
    totalCanon,
    avgUfM2,
    expiringCount: expiring.length,
    expiredCount:  expired.length,
    expiringM2:    expiring.reduce((s, u) => s + u.util_m2, 0),
  }
}
