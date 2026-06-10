import VencimientosChart from './charts/VencimientosChart'
import RankingChart from './charts/RankingChart'

export default function ChartsView() {
  return (
    <div className="flex-1 overflow-auto p-5 pb-8 space-y-6">
      <VencimientosChart />
      <RankingChart />
    </div>
  )
}
