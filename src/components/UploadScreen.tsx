import { useCallback, useRef, useState } from 'react'
import { useStackingStore } from '../store/useStackingStore'
import { parseRentRoll, parseWithMapping, MappingRequiredError } from '../lib/parser'
import ColumnMapper from './ColumnMapper'
import type { ColumnMapping, FieldDef } from '../lib/columnSchema'

interface PendingMapping {
  file: File
  headers: string[]
  unresolved: FieldDef[]
  resolved: Partial<ColumnMapping>
}

export default function UploadScreen({ onLoad }: { onLoad?: () => void }) {
  const loadData = useStackingStore((s) => s.loadData)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<PendingMapping | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        setError('El archivo debe ser .xlsx o .xls')
        return
      }
      setError(null)
      setLoading(true)
      try {
        const result = await parseRentRoll(file)
        loadData(result, file.name)
        onLoad?.()
      } catch (e) {
        if (e instanceof MappingRequiredError) {
          setPending({ file, headers: e.headers, unresolved: e.unresolved, resolved: e.resolved })
        } else {
          setError(e instanceof Error ? e.message : 'Error al leer el archivo')
        }
      } finally {
        setLoading(false)
      }
    },
    [loadData],
  )

  const handleMappingConfirm = useCallback(
    async (mapping: ColumnMapping) => {
      if (!pending) return
      setError(null)
      setLoading(true)
      setPending(null)
      try {
        const result = await parseWithMapping(pending.file, mapping)
        loadData(result, pending.file.name)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al leer el archivo')
      } finally {
        setLoading(false)
      }
    },
    [pending, loadData],
  )

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile],
  )

  if (pending) {
    return (
      <ColumnMapper
        headers={pending.headers}
        unresolved={pending.unresolved}
        resolved={pending.resolved}
        onConfirm={handleMappingConfirm}
        onCancel={() => setPending(null)}
      />
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#ECEFF1]">
      <div className="flex flex-col items-center gap-6 max-w-md w-full px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1A237E]">Stacking Plan</h2>
          <p className="text-sm text-[#607D8B] mt-1">Sube el Rent Roll para comenzar</p>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          className={`w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
            dragging
              ? 'border-[#1A237E] bg-[#E8EAF6]'
              : 'border-[#B0BEC5] bg-white hover:border-[#7986CB] hover:bg-[#F8F9FF]'
          }`}
        >
          <div className="text-5xl">📊</div>
          <div className="text-sm font-medium text-[#37474F] text-center">
            {loading
              ? 'Procesando archivo...'
              : dragging
              ? 'Suelta el archivo aquí'
              : 'Arrastra tu archivo aquí o haz click para seleccionar'}
          </div>
          <div className="text-xs text-[#90A4AE]">Acepta .xlsx y .xls</div>
        </div>

        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 whitespace-pre-line">
            {error}
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          className="hidden"
        />
      </div>
    </div>
  )
}
