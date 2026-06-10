import { useState } from 'react'
import { FIELD_SCHEMA, saveMappings, type ColumnMapping, type FieldDef } from '../lib/columnSchema'
import { useEscKey } from '../hooks/useEscKey'

interface Props {
  headers: string[]
  unresolved: FieldDef[]
  resolved: Partial<ColumnMapping>
  onConfirm: (mapping: ColumnMapping) => void
  onCancel: () => void
}

export default function ColumnMapper({ headers, unresolved, resolved, onConfirm, onCancel }: Props) {
  useEscKey(onCancel)
  // Start with whatever was auto-resolved + empty string for unresolved
  const [manual, setManual] = useState<Partial<ColumnMapping>>(() => {
    const init: Partial<ColumnMapping> = { ...resolved }
    unresolved.forEach((f) => { if (!init[f.key]) init[f.key] = '' })
    return init
  })

  const setField = (key: string, value: string) =>
    setManual((prev) => ({ ...prev, [key]: value }))

  const canConfirm = FIELD_SCHEMA.filter((f) => f.required).every(
    (f) => manual[f.key] && manual[f.key] !== '',
  )

  const handleConfirm = () => {
    const mapping = manual as ColumnMapping
    saveMappings(mapping)
    onConfirm(mapping)
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-[#ECEFF1] p-6">
      <div className="bg-white rounded-xl shadow-lg max-w-xl w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#CFD8DC]">
          <h2 className="text-base font-bold text-[#1A237E]">Mapeo de columnas</h2>
          <p className="text-xs text-[#607D8B] mt-1">
            No se reconocieron algunas columnas automáticamente. Indícanos cuál columna
            de tu archivo corresponde a cada campo.
          </p>
        </div>

        {/* Fields */}
        <div className="px-6 py-4 flex flex-col gap-3 max-h-[60vh] overflow-y-auto">
          {FIELD_SCHEMA.map((field) => {
            const wasResolved = resolved[field.key] && !unresolved.find((u) => u.key === field.key)
            return (
              <div key={field.key} className="flex items-center gap-3">
                <div className="w-44 flex-shrink-0">
                  <span className="text-xs font-semibold text-[#37474F]">{field.label}</span>
                  {field.required
                    ? <span className="ml-1 text-[10px] text-red-500">*</span>
                    : <span className="ml-1 text-[10px] text-[#B0BEC5]">opcional</span>
                  }
                </div>

                {wasResolved ? (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs text-[#2E7D32] bg-green-50 border border-green-200 rounded px-2 py-1 flex-1">
                      ✓ {resolved[field.key]}
                    </span>
                    <button
                      onClick={() => setField(field.key, '')}
                      className="text-[10px] text-[#90A4AE] hover:text-[#546E7A]"
                    >
                      cambiar
                    </button>
                  </div>
                ) : (
                  <select
                    value={manual[field.key] ?? ''}
                    onChange={(e) => setField(field.key, e.target.value)}
                    className={`flex-1 text-xs px-2 py-1.5 border rounded-md bg-white ${
                      field.required && !manual[field.key]
                        ? 'border-red-300 bg-red-50'
                        : 'border-[#CFD8DC]'
                    }`}
                  >
                    <option value="">— selecciona una columna —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>

        <p className="px-6 text-[10px] text-[#90A4AE]">
          * Este mapeo se guardará para la próxima vez que subas un archivo con la misma estructura.
        </p>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[#CFD8DC] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="text-xs px-4 py-2 rounded-lg border border-[#CFD8DC] text-[#546E7A] hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="text-xs px-4 py-2 rounded-lg bg-[#1A237E] text-white font-medium disabled:opacity-40 hover:bg-[#283593] transition-colors"
          >
            Confirmar mapeo
          </button>
        </div>
      </div>
    </div>
  )
}
