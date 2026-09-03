import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  if (totalPages <= 1) {
    return (
      <div className="pagination">
        <span className="pagination-info">Menampilkan {totalItems} data</span>
      </div>
    )
  }

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  const pages = []
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i)
  }

  return (
    <div className="pagination">
      <span className="pagination-info">
        Menampilkan {start}-{end} dari {totalItems} data
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.slice(Math.max(0, page - 3), Math.min(totalPages, page + 2)).map((p) => (
          <button
            key={p}
            type="button"
            className={`page-btn ${p === page ? 'active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}