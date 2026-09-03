export default function StatCard({ icon: Icon, value, label, trend, trendUp, iconTone = 'emerald' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconTone}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {trend && (
          <div className={`stat-trend ${trendUp ? 'up' : 'down'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
    </div>
  )
}