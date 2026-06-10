export type UnitType = 'Oficinas' | 'Locales' | 'Estacionamientos' | 'Bodegas'

export type ExpClass = 'exp-crit' | 'exp-warn' | 'exp-watch' | ''

export interface Unit {
  // Identificación
  piso: number
  unidad: string
  tipo: UnitType           // Tipo I
  tipo2: string            // Tipo II (opcional en algunos Excels)
  detalle: string          // Descripción libre de la unidad

  // Partes
  arrendatario: string
  sociedad: string
  categoria: string        // 'Arrendable' | 'Común' | '' — determina si entra en KPIs (#11)

  // Fechas
  inicio_contrato: string  // YYYY-MM-DD
  primer_pago: string      // YYYY-MM-DD
  salida_anticipada: string
  vencimiento: string

  // Superficies
  unidad_arrendable: string // 'm²' | 'un.'
  interior_m2: number | null
  terraza_m2: number | null
  util_m2: number          // superficie arrendable (m²) o nº de unidades

  // Financiero
  uf_m2: number            // UF/m² o UF/un. según unidad_arrendable
  canon: number            // Canon mensual (UF)
  ggcc: number | null      // Gastos comunes (UF)

  // Flag derivado
  vacante: boolean
}

export interface RawData {
  units: Unit[]
  today: string
  tenant_colors: Record<string, string>
}

export interface FilterState {
  activeTipos: Set<UnitType>
  filterTenant: string
  filterExpiry: string
  showVac: boolean
  hlTenant: string | null
}

export interface KPIs {
  occupancyRate: number
  occupiedM2: number
  totalM2: number
  vacantM2: number
  totalCanon: number
  avgUfM2: number
  expiringCount: number
  expiredCount: number
  expiringM2: number
}
