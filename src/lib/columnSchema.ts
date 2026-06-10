export interface FieldDef {
  key: string
  label: string
  required: boolean
  synonyms: string[]
}

export const FIELD_SCHEMA: FieldDef[] = [
  // ── Identificación ────────────────────────────────────
  {
    key: 'piso',
    label: 'Piso',
    required: true,
    synonyms: ['piso', 'floor', 'nivel', 'level', 'planta'],
  },
  {
    key: 'unidad',
    label: 'Número de unidad',
    required: true,
    synonyms: ['unidad', 'numero', 'número', 'unit', 'unit no', 'unit number', 'local', 'oficina', 'id unidad', 'nro', 'nro.'],
  },
  {
    key: 'tipo',
    label: 'Tipo I',
    required: true,
    synonyms: ['tipo', 'tipo i', 'type', 'uso', 'categoria principal', 'categoría principal', 'tipo 1'],
  },
  {
    key: 'tipo2',
    label: 'Tipo II',
    required: false,
    synonyms: ['tipo ii', 'tipo 2', 'subtipo', 'sub-tipo', 'sub tipo', 'type ii', 'type 2', 'detalle tipo'],
  },
  {
    key: 'detalle',
    label: 'Detalle',
    required: false,
    synonyms: ['detalle', 'descripcion', 'descripción', 'description', 'detail', 'obs', 'observacion', 'observación'],
  },

  // ── Partes ────────────────────────────────────────────
  {
    key: 'tenant',
    label: 'Arrendatario',
    required: true,
    synonyms: ['arrendatario', 'tenant', 'inquilino', 'locatario', 'cliente', 'ocupante'],
  },
  {
    key: 'sociedad',
    label: 'Sociedad',
    required: false,
    synonyms: ['sociedad', 'empresa', 'razon social', 'razón social', 'company', 'legal name', 'entidad'],
  },
  {
    key: 'categoria',
    label: 'Categoría',
    required: false,
    synonyms: ['categoría', 'categoria', 'category', 'tipo unidad', 'clasificacion', 'clasificación'],
  },

  // ── Fechas ────────────────────────────────────────────
  {
    key: 'inicio_contrato',
    label: 'Inicio contrato',
    required: false,
    synonyms: ['inicio contrato', 'inicio', 'lease start', 'start date', 'fecha inicio', 'comienzo', 'vigencia desde'],
  },
  {
    key: 'primer_pago',
    label: 'Primer pago',
    required: false,
    synonyms: ['primer pago', 'first payment', 'fecha primer pago', 'rent commencement', 'inicio renta'],
  },
  {
    key: 'salida',
    label: 'Salida anticipada',
    required: false,
    synonyms: ['salida anticipada', 'early termination', 'salida', 'break option', 'opcion salida', 'opción salida', 'break clause'],
  },
  {
    key: 'venc',
    label: 'Vencimiento',
    required: true,
    synonyms: ['vencimiento', 'expiry', 'expiration', 'lease end', 'fin contrato', 'fecha vencimiento', 'término', 'termino', 'end date'],
  },

  // ── Superficies ───────────────────────────────────────
  {
    key: 'un',
    label: 'Unidad arrendable (m² o un.)',
    required: true,
    synonyms: ['un.', 'un', 'unidad arrendable', 'rentable unit', 'medida', 'tipo unidad', 'métrica', 'metrica'],
  },
  {
    key: 'interior',
    label: 'Interior (m²)',
    required: false,
    synonyms: ['interior', 'area interior', 'área interior', 'm2 interior', 'sup. interior', 'sup interior'],
  },
  {
    key: 'terraza',
    label: 'Terraza (m²)',
    required: false,
    synonyms: ['terraza', 'balcon', 'balcón', 'terrace', 'outdoor', 'exterior', 'loggia'],
  },
  {
    key: 'util',
    label: 'Arrendable / Útil',
    required: true,
    synonyms: [
      'útil', 'util', 'arrendable', 'rentable', 'sup. util', 'area util', 'área útil',
      'm2 util', 'm² util', 'gla', 'nla', 'leasable area', 'sup. arrendable', 'total', 'total m2',
    ],
  },

  // ── Financiero ────────────────────────────────────────
  {
    key: 'ufm2',
    label: 'UF/m² o UF/un.',
    required: true,
    synonyms: [
      'uf/m² - uf/un.', 'uf/m2', 'uf/m²', 'uf/un', 'uf/un.',
      'precio m2', 'precio unitario', 'rent per m2', 'uf m2', 'uf/m²/mes', 'uf/m2/mes',
    ],
  },
  {
    key: 'canon',
    label: 'Canon mensual (UF)',
    required: true,
    synonyms: [
      'canon mensual (uf)', 'canon mensual', 'canon', 'renta mensual', 'rent', 'monthly rent',
      'arriendo', 'renta (uf/mes)', 'rent (uf/mes)', 'rent (uf/mes)', 'renta uf', 'canon (uf)',
    ],
  },
  {
    key: 'ggcc',
    label: 'Gastos comunes (UF)',
    required: false,
    synonyms: ['ggcc', 'gastos comunes', 'gc', 'cae', 'service charge', 'opex', 'expenses'],
  },
]

export type FieldKey = (typeof FIELD_SCHEMA)[number]['key']
export type ColumnMapping = Record<FieldKey, string>

export function autoDetect(headers: string[]): {
  resolved: Partial<ColumnMapping>
  unresolved: FieldDef[]
} {
  const normalized = headers.map((h) => h.toLowerCase().trim())
  const resolved: Partial<ColumnMapping> = {}
  const unresolved: FieldDef[] = []

  for (const field of FIELD_SCHEMA) {
    const match = field.synonyms.find((s) => normalized.includes(s.toLowerCase()))
    if (match) {
      const originalIdx = normalized.indexOf(match.toLowerCase())
      resolved[field.key] = headers[originalIdx]!
    } else if (field.required) {
      unresolved.push(field)
    }
  }

  return { resolved, unresolved }
}

const LS_KEY = 'stacking_column_mappings'

export function loadSavedMappings(): Partial<ColumnMapping> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as Partial<ColumnMapping>) : {}
  } catch {
    return {}
  }
}

export function saveMappings(mapping: Partial<ColumnMapping>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(mapping))
  } catch {}
}
