import { useMemo, useRef, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import { useStackingStore } from '../../store/useStackingStore'
import { buildRankData, metricLabel, type ChartMetric } from '../../lib/chartData'
import { ExportPanel } from './ExportPanel'

export default function RankingChart() {
  const allUnits = useStackingStore((s) => s.allUnits)
  const tenantColors = useStackingStore((s) => s.tenantColors)
  const allTipos = useMemo(() => [...new Set(allUnits.map((u) => u.tipo))].sort(), [allUnits])
  const allTipo2s = useMemo(() => [...new Set(allUnits.map((u) => u.tipo2).filter(Boolean))].sort(), [allUnits])

  const [metric, setMetric] = useState<ChartMetric>('m2')
  const [tipoFilter, setTipoFilter] = useState('')
  const [tipo2Filter, setTipo2Filter] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState('')
  const [fontSize, setFontSize] = useState(12)

  const chartRef = useRef<HTMLDivElement>(null)

  const data = useMemo(
    () => buildRankData(allUnits, metric, tipoFilter, tipo2Filter, estadoFilter, categoriaFilter, tenantColors),
    [allUnits, metric, tipoFilter, tipo2Filter, estadoFilter, categoriaFilter, tenantColors],
  )

  const yLabel = metricLabel(metric)
  const barHeight = Math.max(28, Math.min(48, 600 / Math.max(data.length, 1)))
  const chartHeight = Math.max(200, data.length * (barHeight + 4) + 60)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-[15px] font-bold text-[#37474F]">Ranking de arrendatarios</h3>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#546E7A]">
          {/* Métrica */}
          <div className="flex gap-1">
            {(['m2', 'un', 'uf'] as ChartMetric[]).map((mt) => (
              <button
                key={mt}
                onClick={() => setMetric(mt)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  metric === mt
                    ? 'bg-[#455A64] text-white border-[#455A64]'
                    : 'border-[#CFD8DC] hover:bg-[#ECEFF1]'
                }`}
              >
                {mt === 'm2' ? 'm²' : mt === 'un' ? 'Un.' : 'UF/mes'}
              </button>
            ))}
          </div>

          {/* Tipo I */}
          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="border border-[#CFD8DC] rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#7986CB] bg-white"
          >
            <option value="">Todos los tipos</option>
            {allTipos.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Tipo II */}
          {allTipo2s.length > 0 && (
            <select
              value={tipo2Filter}
              onChange={(e) => setTipo2Filter(e.target.value)}
              className="border border-[#CFD8DC] rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#7986CB] bg-white"
            >
              <option value="">Todos Tipo II</option>
              {allTipo2s.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}

          {/* Estado */}
          <select
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            className="border border-[#CFD8DC] rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#7986CB] bg-white"
          >
            <option value="">Todos estados</option>
            <option value="arrendado">Arrendado</option>
            <option value="vacante">Vacante</option>
          </select>

          {/* Categoría */}
          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="border border-[#CFD8DC] rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#7986CB] bg-white"
          >
            <option value="">Todas categorías</option>
            <option value="Arrendable">Arrendable</option>
            <option value="Común">Común</option>
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-[#B0BEC5] text-sm">
          Sin datos para mostrar
        </div>
      ) : (
        <div ref={chartRef} id="rank-chart-export" className="bg-white overflow-auto" style={{ fontSize }}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 40, left: 160, bottom: 8 }}
              barSize={barHeight - 4}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF1" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize, fill: '#78909C' }}
                label={{ value: yLabel, position: 'insideBottom', offset: -4, fontSize, fill: '#90A4AE' }}
              />
              <YAxis
                type="category"
                dataKey="tenant"
                tick={{ fontSize, fill: '#37474F' }}
                width={155}
              />
              <Tooltip
                contentStyle={{ fontSize, borderRadius: 8, border: '1px solid #CFD8DC' }}
                formatter={(value: number) => [value.toLocaleString('es-CL'), yLabel]}
              />
              <Bar dataKey="value" name={yLabel} radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.tenant} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <ExportPanel
        chartRef={chartRef}
        chartName="ranking-arrendatarios"
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />
    </div>
  )
}
