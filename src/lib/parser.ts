import * as XLSX from 'xlsx'
import type { Unit, UnitType, RawData } from '../types/unit'
import {
  autoDetect,
  loadSavedMappings,
  FIELD_SCHEMA,
  type ColumnMapping,
  type FieldDef,
} from './columnSchema'

const COLOR_PALETTE = [
  '#1976D2','#388E3C','#E64A19','#7B1FA2','#F57C00','#0097A7','#C62828','#558B2F',
  '#283593','#F9A825','#00695C','#AD1457','#33691E','#1565C0','#E65100','#006064',
  '#880E4F','#1B5E20','#0D47A1','#BF360C','#37474F','#4E342E','#0288D1','#689F38',
  '#AB47BC','#FF7043','#26A69A','#EC407A','#7CB342','#5C6BC0','#26C6DA','#EF5350',
  '#42A5F5','#66BB6A','#FFCA28','#8D6E63','#78909C','#FF8A65','#9CCC65','#4DD0E1',
]

const VALID_TIPOS: UnitType[] = ['Oficinas', 'Locales', 'Estacionamientos', 'Bodegas']

function toDateStr(val: unknown): string {
  if (val === null || val === undefined || val === '' || val === '-') return ''
  if (typeof val === 'number') {
    const d = XLSX.SSF.parse_date_code(val)
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
  }
  if (typeof val === 'string') {
    const trimmed = val.trim()
    return trimmed === '-' ? '' : trimmed
  }
  return ''
}

// Returns null for empty/missing cells, 0 for explicit zero
function toNum(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

function str(val: unknown): string {
  return String(val ?? '').trim()
}

export class MappingRequiredError extends Error {
  constructor(
    public readonly headers: string[],
    public readonly unresolved: FieldDef[],
    public readonly resolved: Partial<ColumnMapping>,
  ) {
    super('column_mapping_required')
  }
}

function getRentRollSheet(wb: XLSX.WorkBook): XLSX.WorkSheet {
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes('rent roll'))
  if (!sheetName) {
    const listed = wb.SheetNames.length
      ? wb.SheetNames.map((n) => `• ${n}`).join('\n')
      : '(ninguna hoja encontrada)'
    throw new Error(
      `No se encontró una hoja llamada "Rent Roll" en el archivo.\n\nHojas disponibles:\n${listed}\n\nRenombra la hoja correcta a "Rent Roll" e intenta de nuevo.`,
    )
  }
  return wb.Sheets[sheetName]!
}

function buildUnits(rows: unknown[][], mapping: ColumnMapping): RawData {
  const headers = (rows[0] as unknown[]).map((h) => String(h ?? '').trim())

  // Build index: fieldKey → column index (-1 if not mapped)
  const idx: Record<string, number> = {}
  for (const field of FIELD_SCHEMA) {
    const headerName = mapping[field.key]
    idx[field.key] = headerName ? headers.indexOf(headerName) : -1
  }

  const get = (row: unknown[], key: string): unknown =>
    idx[key]! >= 0 ? row[idx[key]!] : null

  const tenantColors: Record<string, string> = {}
  let colorIdx = 0
  const units: Unit[] = []
  const today = new Date().toISOString().slice(0, 10)

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[]

    const piso = toNum(get(row, 'piso'))
    if (piso === null) continue  // skip empty rows

    const arrendatario = str(get(row, 'tenant'))
    const vacante = arrendatario === '' || arrendatario.toLowerCase() === 'vacante'

    const tipoRaw = str(get(row, 'tipo')) as UnitType
    const tipo = VALID_TIPOS.includes(tipoRaw) ? tipoRaw : 'Oficinas'

    const unidadArrendable = str(get(row, 'un'))
    const isM2 = unidadArrendable === 'm²' || unidadArrendable === 'm2'

    const interior_m2 = isM2 ? toNum(get(row, 'interior')) : null
    const terraza_m2  = isM2 ? toNum(get(row, 'terraza')) : null
    const util_raw    = toNum(get(row, 'util'))
    const util_m2     = util_raw ?? ((interior_m2 ?? 0) + (terraza_m2 ?? 0))

    const uf_m2 = toNum(get(row, 'ufm2')) ?? 0
    const canon = toNum(get(row, 'canon')) ?? 0
    const ggcc  = toNum(get(row, 'ggcc'))

    const tenantName = vacante ? 'Vacante' : arrendatario
    if (!vacante && !tenantColors[tenantName]) {
      tenantColors[tenantName] = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length]!
      colorIdx++
    }

    units.push({
      piso,
      unidad:            str(get(row, 'unidad')),
      tipo,
      tipo2:             str(get(row, 'tipo2')),
      detalle:           str(get(row, 'detalle')),
      arrendatario:      tenantName,
      sociedad:          str(get(row, 'sociedad')),
      categoria:         str(get(row, 'categoria')),
      inicio_contrato:   toDateStr(get(row, 'inicio_contrato')),
      primer_pago:       toDateStr(get(row, 'primer_pago')),
      salida_anticipada: toDateStr(get(row, 'salida')),
      vencimiento:       toDateStr(get(row, 'venc')),
      unidad_arrendable: unidadArrendable,
      interior_m2,
      terraza_m2,
      util_m2,
      uf_m2,
      canon,
      ggcc,
      vacante,
    })
  }

  if (units.length === 0) throw new Error('No se encontraron unidades válidas en la hoja "Rent Roll".\n\nVerifica que la columna "Piso" tenga valores numéricos en las filas de datos.')

  tenantColors['Vacante'] = '#B0BEC5'
  return { units, today, tenant_colors: tenantColors }
}

async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  if (!file.name.match(/\.(xlsx|xls)$/i))
    throw new Error('Formato no soportado. El archivo debe ser .xlsx o .xls.')
  const buffer = await file.arrayBuffer()
  try {
    return XLSX.read(buffer, { type: 'array', cellDates: false })
  } catch {
    throw new Error('No se pudo leer el archivo. Puede estar corrupto o protegido con contraseña.')
  }
}

export async function parseWithMapping(file: File, mapping: ColumnMapping): Promise<RawData> {
  const wb = await readWorkbook(file)
  const ws = getRentRollSheet(wb)
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  if (rows.length < 2) throw new Error('La hoja "Rent Roll" no tiene datos (solo encabezado o está vacía).')
  return buildUnits(rows, mapping)
}

export async function parseRentRoll(file: File): Promise<RawData> {
  const wb = await readWorkbook(file)
  const ws = getRentRollSheet(wb)
  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null })
  if (rows.length < 2) throw new Error('La hoja "Rent Roll" no tiene datos (solo encabezado o está vacía).')

  const headers = (rows[0] as unknown[]).map((h) => String(h ?? '').trim())

  const { resolved: autoResolved, unresolved } = autoDetect(headers)
  const saved = loadSavedMappings()

  const merged: Partial<ColumnMapping> = { ...autoResolved }
  for (const [key, headerName] of Object.entries(saved)) {
    if (headers.includes(headerName)) merged[key] = headerName
  }

  const stillUnresolved = unresolved.filter((f) => !merged[f.key])
  if (stillUnresolved.length > 0) {
    throw new MappingRequiredError(headers, stillUnresolved, merged)
  }

  return buildUnits(rows, merged as ColumnMapping)
}
