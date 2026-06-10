// Stable color palette for tenants — assigned once on data load, consistent across filters
const PALETTE = [
  '#4E79A7','#F28E2B','#E15759','#76B7B2','#59A14F',
  '#EDC948','#B07AA1','#FF9DA7','#9C755F','#BAB0AC',
  '#1F77B4','#FF7F0E','#2CA02C','#D62728','#9467BD',
  '#8C564B','#E377C2','#7F7F7F','#BCBD22','#17BECF',
  '#AEC7E8','#FFBB78','#98DF8A','#FF9896','#C5B0D5',
]

export function buildTenantColorMap(tenants: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  const sorted = [...new Set(tenants)].sort()
  sorted.forEach((t, i) => {
    map[t] = PALETTE[i % PALETTE.length]!
  })
  return map
}
