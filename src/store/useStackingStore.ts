import { create } from 'zustand'
import type { Unit, UnitType, RawData } from '../types/unit'

// ── Storage keys ──────────────────────────────────────────────────────────────

const LS_ASSETS_KEY  = 'stacking_assets_v2'
const LS_ACTIVE_KEY  = 'stacking_active_id'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BuildingFloors {
  aboveGrade: number
  belowGrade: number
}

export interface Asset {
  id: string
  fileName: string
  buildingName: string
  units: Unit[]
  tenantColors: Record<string, string>
  today: string          // ISO string
  buildingFloors: BuildingFloors | null
  activeTipos: UnitType[]
  filterEstado: string
  filterCategoria: string
  filterTipoII: string
  filterFloors: number[]
  filterTenant: string
  filterExpiry: string
  hlTenant: string | null
  showPlaceholders: boolean
}

interface PersistedAsset extends Omit<Asset, 'activeTipos'> {
  activeTipos: UnitType[]
}

// ── Persistence ───────────────────────────────────────────────────────────────

function saveAssets(assets: Asset[], activeId: string | null): void {
  try {
    localStorage.setItem(LS_ASSETS_KEY, JSON.stringify(assets))
    localStorage.setItem(LS_ACTIVE_KEY, activeId ?? '')
  } catch {}
}

function loadAssets(): { assets: Asset[]; activeId: string | null } {
  try {
    const raw = localStorage.getItem(LS_ASSETS_KEY)
    const activeId = localStorage.getItem(LS_ACTIVE_KEY) || null
    if (!raw) return { assets: [], activeId: null }
    const parsed = JSON.parse(raw) as PersistedAsset[]
    return { assets: parsed as Asset[], activeId }
  } catch {
    return { assets: [], activeId: null }
  }
}

function clearAssetStorage(): void {
  try {
    localStorage.removeItem(LS_ASSETS_KEY)
    localStorage.removeItem(LS_ACTIVE_KEY)
    // Also clear old single-asset key if present
    localStorage.removeItem('stacking_data')
  } catch {}
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildingNameFromFile(f: string): string {
  return f.replace(/\.(xlsx|xls)$/i, '').trim()
}

function isComun(u: Unit): boolean {
  const c = u.categoria.toLowerCase()
  return c === 'común' || c === 'comun'
}

function matchesFilters(
  u: Unit,
  today: Date,
  filterEstado: string,
  filterCategoria: string,
  filterTipoII: string,
  filterFloors: number[],
  filterTenant: string,
  filterExpiry: string,
): boolean {
  if (filterEstado) {
    if (filterEstado === 'arrendado' && (u.vacante || isComun(u))) return false
    if (filterEstado === 'vacante' && !u.vacante) return false
    if (filterEstado === 'comun' && (!isComun(u) || u.vacante)) return false
    if (filterEstado === 'ocupado' && u.vacante) return false
  }
  if (filterCategoria) {
    if (filterCategoria === 'Arrendable' && isComun(u)) return false
    if (filterCategoria === 'Común' && !isComun(u)) return false
  }
  if (filterTipoII && u.tipo2 !== filterTipoII) return false
  if (filterFloors.length > 0 && !filterFloors.includes(u.piso)) return false
  if (filterTenant && u.arrendatario !== filterTenant) return false
  if (filterExpiry && !u.vacante && (!u.vencimiento || u.vencimiento > filterExpiry)) return false
  void today
  return true
}

const DEFAULT_ASSET_FILTERS = {
  activeTipos: ['Oficinas', 'Locales', 'Estacionamientos', 'Bodegas'] as UnitType[],
  filterEstado: '',
  filterCategoria: '',
  filterTipoII: '',
  filterFloors: [] as number[],
  filterTenant: '',
  filterExpiry: '',
  hlTenant: null as string | null,
  showPlaceholders: true,
}

function makeAsset(data: RawData, fileName: string, id?: string): Asset {
  return {
    id: id ?? crypto.randomUUID(),
    fileName,
    buildingName: buildingNameFromFile(fileName),
    units: data.units,
    tenantColors: data.tenant_colors,
    today: data.today,
    buildingFloors: null,
    ...DEFAULT_ASSET_FILTERS,
  }
}

// ── Flat state from active asset (for store) ──────────────────────────────────

function flatFromAsset(asset: Asset) {
  return {
    allUnits: asset.units,
    tenantColors: asset.tenantColors,
    today: new Date(asset.today),
    buildingName: asset.buildingName,
    fileName: asset.fileName,
    buildingFloors: asset.buildingFloors,
    activeTipos: new Set<UnitType>(asset.activeTipos),
    filterEstado: asset.filterEstado,
    filterCategoria: asset.filterCategoria,
    filterTipoII: asset.filterTipoII,
    filterFloors: asset.filterFloors,
    filterTenant: asset.filterTenant,
    filterExpiry: asset.filterExpiry,
    hlTenant: asset.hlTenant,
    showPlaceholders: asset.showPlaceholders,
  }
}

function captureAsset(s: StackingStore, asset: Asset): Asset {
  return {
    ...asset,
    units: s.allUnits,
    tenantColors: s.tenantColors,
    today: s.today.toISOString().slice(0, 10),
    buildingName: s.buildingName,
    fileName: s.fileName ?? asset.fileName,
    buildingFloors: s.buildingFloors,
    activeTipos: [...s.activeTipos] as UnitType[],
    filterEstado: s.filterEstado,
    filterCategoria: s.filterCategoria,
    filterTipoII: s.filterTipoII,
    filterFloors: s.filterFloors,
    filterTenant: s.filterTenant,
    filterExpiry: s.filterExpiry,
    hlTenant: s.hlTenant,
    showPlaceholders: s.showPlaceholders,
  }
}

// ── Store interface ────────────────────────────────────────────────────────────

interface StackingStore {
  // Multi-asset
  assets: Asset[]
  activeAssetId: string | null

  // Active asset flat state (mirrors Asset fields for backwards-compat)
  allUnits: Unit[]
  tenantColors: Record<string, string>
  today: Date
  buildingName: string
  fileName: string | null
  activeTipos: Set<UnitType>
  filterEstado: string
  filterCategoria: string
  filterTipoII: string
  filterFloors: number[]
  filterTenant: string
  filterExpiry: string
  hlTenant: string | null
  buildingFloors: BuildingFloors | null
  showPlaceholders: boolean

  // Actions — single asset
  loadData: (data: RawData, fileName: string) => void
  clearData: () => void
  resetFilters: () => void
  setBuildingFloors: (bf: BuildingFloors | null) => void
  setShowPlaceholders: (v: boolean) => void
  toggleTipo: (tipo: UnitType) => void
  setFilterEstado: (v: string) => void
  setFilterCategoria: (v: string) => void
  setFilterTipoII: (v: string) => void
  toggleFilterFloor: (floor: number) => void
  clearFilterFloors: () => void
  setFilterTenant: (t: string) => void
  setFilterExpiry: (e: string) => void
  toggleHlTenant: (t: string) => void

  // Actions — multi-asset (E6)
  addAsset: (data: RawData, fileName: string) => void
  removeAsset: (id: string) => void
  switchAsset: (id: string) => void

  // Derived
  ghostedUnits: () => Array<{ unit: Unit; ghosted: boolean }>
  filteredUnits: () => Unit[]
  allTenants: () => string[]
  allTipoIIs: () => string[]
  allFloors: () => number[]
}

// ── Initial hydration ─────────────────────────────────────────────────────────

function hydrate() {
  // Migrate old single-asset data if present
  const oldRaw = localStorage.getItem('stacking_data')
  if (oldRaw && !localStorage.getItem(LS_ASSETS_KEY)) {
    try {
      const old = JSON.parse(oldRaw) as { units: Unit[]; tenantColors: Record<string, string>; today: string; fileName: string; buildingFloors?: BuildingFloors | null }
      const asset: Asset = {
        id: crypto.randomUUID(),
        fileName: old.fileName,
        buildingName: buildingNameFromFile(old.fileName),
        units: old.units,
        tenantColors: old.tenantColors,
        today: old.today,
        buildingFloors: old.buildingFloors ?? null,
        ...DEFAULT_ASSET_FILTERS,
      }
      saveAssets([asset], asset.id)
    } catch {}
  }

  const { assets, activeId } = loadAssets()
  if (assets.length === 0) return {}
  const active = assets.find((a) => a.id === activeId) ?? assets[0]!
  return {
    assets,
    activeAssetId: active.id,
    ...flatFromAsset(active),
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStackingStore = create<StackingStore>((set, get) => ({
  assets: [],
  activeAssetId: null,
  allUnits: [],
  tenantColors: {},
  today: new Date(),
  buildingName: '',
  fileName: null,
  buildingFloors: null,
  ...DEFAULT_ASSET_FILTERS,
  activeTipos: new Set<UnitType>(['Oficinas', 'Locales', 'Estacionamientos', 'Bodegas']),
  ...hydrate(),

  // ── Load / clear ──────────────────────────────────────────────────────────

  loadData: (data, fileName) => {
    // If no assets yet, create first. Otherwise update active asset.
    const s = get()
    if (s.assets.length === 0 || s.activeAssetId === null) {
      const asset = makeAsset(data, fileName)
      const assets = [asset]
      saveAssets(assets, asset.id)
      set({ assets, activeAssetId: asset.id, ...flatFromAsset(asset) })
    } else {
      const asset = makeAsset(data, fileName, s.activeAssetId)
      const assets = s.assets.map((a) => (a.id === s.activeAssetId ? asset : a))
      saveAssets(assets, s.activeAssetId)
      set({ assets, ...flatFromAsset(asset) })
    }
  },

  addAsset: (data, fileName) => {
    // Save current active state first
    const s = get()
    const activeAsset = s.assets.find((a) => a.id === s.activeAssetId)
    const savedAssets = activeAsset
      ? s.assets.map((a) => (a.id === s.activeAssetId ? captureAsset(s, a) : a))
      : s.assets
    const newAsset = makeAsset(data, fileName)
    const assets = [...savedAssets, newAsset]
    saveAssets(assets, newAsset.id)
    set({ assets, activeAssetId: newAsset.id, ...flatFromAsset(newAsset) })
  },

  removeAsset: (id) => {
    const s = get()
    const assets = s.assets.filter((a) => a.id !== id)
    if (assets.length === 0) {
      clearAssetStorage()
      set({ assets: [], activeAssetId: null, allUnits: [], fileName: null, buildingName: '', tenantColors: {}, buildingFloors: null, ...DEFAULT_ASSET_FILTERS, activeTipos: new Set<UnitType>(['Oficinas','Locales','Estacionamientos','Bodegas']) })
      return
    }
    const newActive = s.activeAssetId === id
      ? (assets.find((a) => a.id !== id) ?? assets[0]!)
      : assets.find((a) => a.id === s.activeAssetId)!
    saveAssets(assets, newActive.id)
    set({ assets, activeAssetId: newActive.id, ...flatFromAsset(newActive) })
  },

  switchAsset: (id) => {
    const s = get()
    if (id === s.activeAssetId) return
    // Persist current active state
    const activeAsset = s.assets.find((a) => a.id === s.activeAssetId)
    const savedAssets = activeAsset
      ? s.assets.map((a) => (a.id === s.activeAssetId ? captureAsset(s, a) : a))
      : s.assets
    const target = savedAssets.find((a) => a.id === id)
    if (!target) return
    saveAssets(savedAssets, id)
    set({ assets: savedAssets, activeAssetId: id, ...flatFromAsset(target) })
  },

  clearData: () => {
    clearAssetStorage()
    set({
      assets: [],
      activeAssetId: null,
      allUnits: [],
      tenantColors: {},
      today: new Date(),
      buildingName: '',
      fileName: null,
      buildingFloors: null,
      ...DEFAULT_ASSET_FILTERS,
      activeTipos: new Set<UnitType>(['Oficinas', 'Locales', 'Estacionamientos', 'Bodegas']),
    })
  },

  resetFilters: () => set({
    ...DEFAULT_ASSET_FILTERS,
    activeTipos: new Set<UnitType>(['Oficinas', 'Locales', 'Estacionamientos', 'Bodegas']),
  }),

  setBuildingFloors: (bf) => {
    const s = get()
    const assets = s.assets.map((a) =>
      a.id === s.activeAssetId ? { ...captureAsset(s, a), buildingFloors: bf } : a
    )
    saveAssets(assets, s.activeAssetId)
    set({ buildingFloors: bf, assets })
  },

  setShowPlaceholders: (showPlaceholders) => set({ showPlaceholders }),
  toggleTipo: (tipo) =>
    set((s) => {
      const next = new Set(s.activeTipos)
      if (next.has(tipo)) next.delete(tipo)
      else next.add(tipo)
      if (next.size === 0) next.add(tipo)
      return { activeTipos: next }
    }),
  setFilterEstado: (filterEstado) => set({ filterEstado }),
  setFilterCategoria: (filterCategoria) => set({ filterCategoria }),
  setFilterTipoII: (filterTipoII) => set({ filterTipoII }),
  toggleFilterFloor: (floor) =>
    set((s) => ({
      filterFloors: s.filterFloors.includes(floor)
        ? s.filterFloors.filter((f) => f !== floor)
        : [...s.filterFloors, floor],
    })),
  clearFilterFloors: () => set({ filterFloors: [] }),
  setFilterTenant: (filterTenant) => set({ filterTenant }),
  setFilterExpiry: (filterExpiry) => set({ filterExpiry }),
  toggleHlTenant: (t) =>
    set((s) => ({ hlTenant: s.hlTenant === t ? null : t })),

  ghostedUnits: () => {
    const { allUnits, activeTipos, today, filterEstado, filterCategoria, filterTipoII, filterFloors, filterTenant, filterExpiry } = get()
    return allUnits
      .filter((u) => activeTipos.has(u.tipo))
      .map((u) => ({
        unit: u,
        ghosted: !matchesFilters(u, today, filterEstado, filterCategoria, filterTipoII, filterFloors, filterTenant, filterExpiry),
      }))
  },
  filteredUnits: () =>
    get().ghostedUnits().filter(({ ghosted }) => !ghosted).map(({ unit }) => unit),
  allTenants: () =>
    [...new Set(get().allUnits.filter((u) => !u.vacante).map((u) => u.arrendatario))].sort(),
  allTipoIIs: () => {
    const { allUnits, activeTipos } = get()
    return [...new Set(allUnits.filter((u) => activeTipos.has(u.tipo) && u.tipo2).map((u) => u.tipo2))].sort()
  },
  allFloors: () =>
    [...new Set(get().allUnits.map((u) => u.piso))].sort((a, b) => b - a),
}))
