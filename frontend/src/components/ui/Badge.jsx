const toneMap = {
  aktif: 'status-aktif',
  selesai: 'status-selesai',
  proses: 'status-proses',
  dijadwalkan: 'status-dijadwalkan',
  cuti: 'status-cuti',
  'non aktif': 'status-non-aktif',
}

export default function Badge({ children, tone }) {
  const className = tone ? `badge ${toneMap[tone.toLowerCase()] || 'badge-gray'}` : 'badge badge-gray'
  return <span className={className}>{children}</span>
}

export function BadgeStatus({ status }) {
  return <Badge tone={status}>{status}</Badge>
}