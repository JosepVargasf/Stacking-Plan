import { useMemo, useRef, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useStackingStore } from '../../store/useStackingStore'
import { buildVencData, metricLabel, type ChartMetric } from '../../lib/chartData'
import { ExportPanel } from './ExportPanel'

type VencMode = 'venc' | 'salida' | 'both'

function todayYM(today: Date): string {
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function addMonths(ym: string, n: number): string {
  const [y, mo] = ym.split('-').map(Number)
  const date = new Date(y!, mo! - 1 + n)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function ymToInput(ym: string): string {
  return ym  // "YYYY-MM" works directly with <input type="month">
}

export default function VencimientosChart() {
  const allUnits = useStackingStore((s) => s.allUnits)
  const today = useStackingStore((s) => s.today)
  const allTipos = useMemo(
    () => [...new Set(allUnits.map((u) => u.tipo))].sort(),
    [allUnits],
  )

  const startYM = todayYM(today)
  const [fromYM, setFromYM] = useState(() => startYM)
  const [toYM, setToYM] = useState(() => addMonths(startYM, 23))
  const [mode, setMode] = useState<VencMode>('both')
  const [metric, setMetric] = useState<ChartMetric>('m2')
  const [tipoFilter, setTipoFilter] = useState('')
  const [fontSize, setFontSize] = useState(12)

  const chartRef = useRef<HTMLDivElement>(null)

  const data = useMemo(
    () => buildVencData(allUnits, fromYM, toYM, mode, tipoFilter, metric),
    [allUnits, fromYM, toYM, mode, tipoFilter, metric],
  )

  const yLabel = metricLabel(metric)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E0E0E0] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-[15px] font-bold text-[#37474F]">Vencimientos por mes</h3>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#546E7A]">
          {/* Rango */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[#37474F]">Desde</span>
            <input
              type="month"
              value={ymToInput(fromYM)}
              onChange={(e) => setFromYM(e.target.value)}
              className="border border-[#CFD8DC] rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#7986CB]"
            />
            <span className="font-semibold text-[#37474F]">Hasta</span>
            <input
              type="month"
              value={ymToInput(toYM)}
              onChange={(e) => setToYM(e.target.value)}
              className="border border-[#CFD8DC] rounded px-2 py-0.5 text-xs focus:outline-none focus:border-[#7986CB]"
            />
          </div>

          {/* Modo */}
          <div className="flex gap-1">
            {(['both', 'venc', 'salida'] as VencMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  mode === m
                    ? 'bg-[#1A237E] text-white border-[#1A237E]'
                    : 'border-[#CFD8DC] hover:bg-[#ECEFF1]'
                }`}
              >
                {m === 'both' ? 'Ambos' : m === 'venc' ? 'Vencimientos' : 'Salidas antic.'}
              </button>
            ))}
          </div>

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
            {allTipos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart area */}
      <div ref={chartRef} id="venc-chart-export" className="bg-white" style={{ fontSize }}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ECEFF1" />
            <XAxis
              dataKey="label"
              tick={{ fontSize, fill: '#78909C' }}
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
            />
            <YAxis
              tick={{ fontSize, fill: '#78909C' }}
              label={{ value: yLabel, angle: -90, position: 'insideLeft', fontSize, fill: '#90A4AE', offset: 8 }}
            />
            <Tooltip
              contentStyle={{ fontSize, borderRadius: 8, border: '1px solid #CFD8DC' }}
              formatter={(value: number) => [value.toLocaleString('es-CL'), undefined]}
            />
            <Legend wrapperStyle={{ fontSize }} />
            {(mode === 'venc' || mode === 'both') && (
              <Bar dataKey="vencimientos" name="Vencimientos" fill="#90A4AE" stackId="a" radius={mode === 'venc' ? [4,4,0,0] : [0,0,0,0]} />
            )}
            {(mode === 'salida' || mode === 'both') && (
              <Bar dataKey="salidas" name="Salidas anticipadas" fill="#EF9A9A" stackId="a" radius={[4,4,0,0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ExportPanel
        chartRef={chartRef}
        chartName="vencimientos"
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
      />
    </div>
  )
}
