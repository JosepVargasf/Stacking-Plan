import { useRef, useState } from 'react'
import { useStackingStore } from './store/useStackingStore'
import Header from './components/Header'
import KpiBar from './components/KpiBar'
import ExpiryStrip from './components/ExpiryStrip'
import FilterPanel from './components/FilterPanel'
import StackingView from './components/StackingView'
import ChartsView from './components/ChartsView'
import PortfolioView from './components/PortfolioView'
import UploadScreen from './components/UploadScreen'
import BuildingSetupDialog from './components/BuildingSetupDialog'
import { exportStackingPng, exportFullPdf } from './lib/exportStacking'

type Tab = 'stacking' | 'graficos' | 'portfolio'

export default function App() {
  const fileName      = useStackingStore((s) => s.fileName)
  const buildingFloors = useStackingStore((s) => s.buildingFloors)
  const buildingName  = useStackingStore((s) => s.buildingName)
  const today         = useStackingStore((s) => s.today)
  const assets        = useStackingStore((s) => s.assets)

  const [showSetup, setShowSetup]       = useState(false)
  const [setupDismissed, setSetupDismissed] = useState(false)
  const [tab, setTab]                   = useState<Tab>('stacking')

  const kpiBarRef = useRef<HTMLDivElement>(null)

  const needsSetup = !!fileName && buildingFloors === null && !setupDismissed
  const multiAsset = assets.length > 1

  function handleSetupClose() {
    setSetupDismissed(true)
    setShowSetup(false)
  }

  const dateStr = today.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })

  async function handleExportPng() {
    await exportStackingPng(buildingName)
  }

  async function handleExportPdf() {
    await exportFullPdf(kpiBarRef.current, buildingName, dateStr)
  }

  if (!fileName) {
    return (
      <div className="flex flex-col h-screen bg-[#ECEFF1]">
        <Header />
        <UploadScreen onLoad={() => setSetupDismissed(false)} />
      </div>
    )
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'stacking',  label: 'Stacking Plan' },
    { id: 'graficos',  label: 'Gráficos' },
    ...(multiAsset ? [{ id: 'portfolio' as Tab, label: 'Portfolio' }] : []),
  ]

  return (
    <div className="flex flex-col h-screen bg-[#ECEFF1] text-[#212121] overflow-hidden">
      <Header
        onConfigFloors={() => setShowSetup(true)}
        onExportPng={handleExportPng}
        onExportPdf={handleExportPdf}
      />
      <div ref={kpiBarRef}>
        <KpiBar />
      </div>
      <ExpiryStrip />

      {/* Tab nav */}
      <div className="flex-shrink-0 flex gap-0 border-b border-[#CFD8DC] bg-white px-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 text-[13px] font-semibold border-b-2 transition-colors -mb-px ${
              tab === t.id
                ? 'border-[#1A237E] text-[#1A237E]'
                : 'border-transparent text-[#78909C] hover:text-[#546E7A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {tab === 'stacking' ? (
          <>
            <div className="flex flex-1 overflow-hidden min-w-0">
              <StackingView />
            </div>
            <FilterPanel />
          </>
        ) : tab === 'graficos' ? (
          <ChartsView />
        ) : (
          <PortfolioView />
        )}
      </div>

      {/* Charts always mounted off-screen so export can capture them */}
      {fileName && tab !== 'graficos' && (
        <div className="fixed" style={{ left: -9999, top: 0, width: 1200, pointerEvents: 'none', opacity: 0, zIndex: -1 }}>
          <ChartsView />
        </div>
      )}

      {(needsSetup || showSetup) && (
        <BuildingSetupDialog onClose={handleSetupClose} />
      )}
    </div>
  )
}
