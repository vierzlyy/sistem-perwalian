import { Inbox, AlertTriangle } from 'lucide-react'

export function EmptyState({ icon: Icon = Inbox, title = 'Tidak ada data', message = 'Belum ada data yang dapat ditampilkan.' }) {
  return (
    <div className="empty-state">
      <Icon size={44} strokeWidth={1.5} />
      <h4>{title}</h4>
      <p>{message}</p>
    </div>
  )
}

export function LoadingState({ message = 'Memuat data...' }) {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  )
}

export function ErrorState({ message = 'Terjadi kesalahan saat memuat data.' }) {
  return (
    <div className="error-state">
      <AlertTriangle size={44} />
      <h4>Terjadi Kesalahan</h4>
      <p>{message}</p>
    </div>
  )
}