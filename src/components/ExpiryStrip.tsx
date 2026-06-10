const ITEMS = [
  { borderColor: '#D32F2F', bg: 'rgba(211,47,47,0.1)', label: '<6 meses' },
  { borderColor: '#F57C00', bg: 'rgba(245,124,0,0.1)', label: '6–12 m.' },
  { borderColor: '#FBC02D', bg: 'rgba(251,192,45,0.1)', label: '12–24 m.' },
  { borderColor: '#90A4AE', bg: '#CFD8DC', label: 'Vacante' },
]

export default function ExpiryStrip() {
  return (
    <div className="flex items-center gap-3.5 px-6 py-1.5 bg-white border-b border-[#CFD8DC] flex-wrap flex-shrink-0">
      <span className="text-[11px] font-bold text-[#607D8B] mr-0.5">Vencimiento:</span>
      {ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-[#546E7A]">
          <div
            className="w-3.5 h-3.5 rounded-sm border-2"
            style={{ borderColor: item.borderColor, background: item.bg }}
          />
          {item.label}
        </div>
      ))}
    </div>
  )
}
