import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom'
import {
  Menu,
  Search,
  Bell,
  User,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  ClipboardList,
  BookMarked,
  FolderOpen,
  History,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Info,
  X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { roles } from '../../constants/roles'

const roleNavLinks = {
  [roles.ADMIN]: {
    section1: {
      label: 'Menu Utama',
      links: [
        { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    section2: {
      label: 'Manajemen Data',
      links: [
        { to: '/admin/mahasiswa', label: 'Data Mahasiswa', icon: Users },
        { to: '/admin/dosen', label: 'Data Dosen', icon: UserCog },
        { to: '/admin/dosen-wali', label: 'Dosen Wali', icon: BookMarked },
      ],
    },
    section3: {
      label: 'Perwalian',
      links: [
        { to: '/admin/perwalian', label: 'Data Perwalian', icon: ClipboardList },
        { to: '/admin/rekap-perwalian', label: 'Rekap Perwalian', icon: FileText },
      ],
    },
  },
  [roles.MAHASISWA]: {
    section1: {
      label: 'Menu Utama',
      links: [
        { to: '/mahasiswa/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/mahasiswa/dosen-wali', label: 'Dosen Wali Saya', icon: BookMarked },
      ],
    },
    section2: {
      label: 'Perwalian',
      links: [
        { to: '/mahasiswa/catat-perwalian', label: 'Catat Perwalian', icon: FolderOpen },
        { to: '/mahasiswa/histori', label: 'Histori Perwalian', icon: History },
      ],
    },
  },
  [roles.DOSEN]: {
    section1: {
      label: 'Menu Utama',
      links: [
        { to: '/dosen/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/dosen/mahasiswa-wali', label: 'Mahasiswa Wali', icon: Users },
        { to: '/dosen/histori', label: 'Histori Perwalian', icon: History },
      ],
    },
  },
}

const roleLabels = {
  [roles.ADMIN]: 'Administrator',
  [roles.MAHASISWA]: 'Mahasiswa',
  [roles.DOSEN]: 'Dosen',
}


const searchHints = {
  Dashboard: 'ringkasan statistik aktivitas terbaru',
  'Data Mahasiswa': 'mahasiswa nim angkatan prodi',
  'Data Dosen': 'dosen nidn prodi',
  'Dosen Wali': 'atur dosen wali mahasiswa',
  'Data Perwalian': 'catatan topik hasil saran perwalian',
  'Rekap Perwalian': 'rekap laporan perwalian',
  'Dosen Wali Saya': 'informasi dosen wali',
  'Catat Perwalian': 'input catatan perwalian',
  'Histori Perwalian': 'riwayat catatan perwalian',
  'Mahasiswa Wali': 'daftar mahasiswa wali',
}


function getResponseMessage(data, fallback) {
  if (typeof data === 'string') {
    return data
  }

  if (data?.errors) {
    const firstError = Object.values(data.errors)
      .flat()
      .flatMap((value) => {
        if (typeof value === 'string') {
          return [value]
        }

        if (value?.message) {
          return [value.message]
        }

        if (value?.errors) {
          return Object.values(value.errors).flat()
        }

        return []
      })
      .find((value) => typeof value === 'string' && value.trim())

    if (firstError) return firstError
  }

  if (typeof data?.message === 'string') {
    return data.message
  }

  return fallback
}

function getMutationFeedback(method, url) {
  const cleanUrl = String(url || '').toLowerCase()

  if (cleanUrl.includes('/import')) {
    return {
      title: 'Import selesai',
      message: 'Data berhasil diimpor dan diperbarui.',
    }
  }

  if (cleanUrl.includes('/dosen-wali') && method === 'PATCH') {
    return {
      title: 'Dosen wali diperbarui',
      message: 'Penetapan dosen wali berhasil diperbarui.',
    }
  }

  if (cleanUrl.includes('/mahasiswa/perwalian') && method === 'POST') {
    return {
      title: 'Perwalian tercatat',
      message: 'Catatan perwalian berhasil disimpan.',
    }
  }

  if (method === 'DELETE') {
    return {
      title: 'Data dihapus',
      message: 'Data berhasil dihapus.',
    }
  }

  if (method === 'PUT' || method === 'PATCH') {
    return {
      title: 'Data diperbarui',
      message: 'Perubahan data berhasil disimpan.',
    }
  }

  if (method === 'POST') {
    return {
      title: 'Data ditambahkan',
      message: 'Data baru berhasil disimpan.',
    }
  }

  return {
    title: 'Berhasil',
    message: 'Perubahan berhasil disimpan.',
  }
}

function getUserInitial(user) {
  const source = String(user?.name || user?.username || '').trim()

  return source ? source.charAt(0).toUpperCase() : 'U'
}


function getNotificationTarget(role, item) {
  const backendUrl =
    item?.data?.url ||
    item?.data?.to

  if (backendUrl) {
    return backendUrl
  }

  const type = item?.type

  if (role === roles.MAHASISWA) {
    if (
      [
        'dosen_wali_status_changed',
        'dosen_wali_changed',
        'dosen_wali_assigned',
      ].includes(type)
    ) {
      return '/mahasiswa/dosen-wali'
    }

    if (
      [
        'perwalian_created',
        'perwalian_updated',
      ].includes(type)
    ) {
      return '/mahasiswa/histori'
    }

    return '/mahasiswa/dashboard'
  }

  if (role === roles.DOSEN) {
    if (
      [
        'mahasiswa_status_changed',
        'mahasiswa_wali_changed',
      ].includes(type)
    ) {
      return '/dosen/mahasiswa-wali'
    }

    if (
      [
        'perwalian_created',
        'perwalian_updated',
        'mahasiswa_deleted',
      ].includes(type)
    ) {
      return '/dosen/histori'
    }

    return '/dosen/dashboard'
  }

  if (role === roles.ADMIN) {
    if (
      [
        'mahasiswa_registered',
        'mahasiswa_status_changed',
      ].includes(type)
    ) {
      return '/admin/mahasiswa'
    }

    if (
      [
        'dosen_registered',
        'dosen_status_changed',
      ].includes(type)
    ) {
      return '/admin/dosen'
    }

    if (
      [
        'perwalian_created',
        'perwalian_updated',
      ].includes(type)
    ) {
      return '/admin/perwalian'
    }

    return '/admin/dashboard'
  }

  return '/dashboard'
}

function formatNotificationDate(value) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

function SidebarContent({ collapsed, onNavigate, onRequestLogout }) {
  const { user } = useAuth()
  const location = useLocation()
  const navConfig = roleNavLinks[user?.role] || { section1: { links: [] } }
  const sections = Object.values(navConfig)

  return (
    <>
      <div className="sidebar-brand">
        <div
          className="brand-icon"
          style={{
            padding: 0,
            background: 'transparent',
            border: 'none',
            boxShadow: 'none',
          }}
        >
          <img
            src="/stmik-bandung-logo.png"
            alt="Logo STMIK Bandung"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
        {!collapsed && (
          <div className="brand-text">
            Sistem Informasi Perwalian
            <small>STMIK Bandung</small>
          </div>
        )}
      </div>

      <nav className="sidebar-nav">
        {sections.map((section, i) => (
          <div key={i}>
            {!collapsed && <div className="nav-section-label">{section.label}</div>}
            {section.links.map((link) => {
              const Icon = link.icon
              const isActive = location.pathname === link.to
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={onNavigate}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon size={18} />
                  {!collapsed && <span className="nav-label">{link.label}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip" title={user?.name}>
          <div className="avatar">{getUserInitial(user)}</div>
          {!collapsed && (
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{roleLabels[user?.role] || user?.role}</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            className="btn btn-ghost btn-sm w-100 mt-2"
            onClick={onRequestLogout}
          >
            <LogOut size={14} /> Logout
          </button>
        )}
      </div>
    </>
  )
}

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [toast, setToast] = useState(null)
  const [isMobile, setIsMobile] = useState(false)
  const { user, token, API_BASE_URL, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const profileRef = useRef(null)
  const searchRef = useRef(null)
  const notificationRef = useRef(null)
  const toastTimerRef = useRef(null)
  const lastIncomingToastIdRef = useRef(null)
  const lastToastRef = useRef({
    message: '',
    time: 0,
  })

  const showToast = useCallback((type, title, message) => {
    const normalizedMessage = String(message || '').trim()
    const now = Date.now()

    if (
      normalizedMessage &&
      lastToastRef.current.message === normalizedMessage &&
      now - lastToastRef.current.time < 1500
    ) {
      return
    }

    lastToastRef.current = {
      message: normalizedMessage,
      time: now,
    }

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current)
    }

    setToast({
      id: now,
      type,
      title,
      message: normalizedMessage,
    })

    toastTimerRef.current = window.setTimeout(() => {
      setToast(null)
      toastTimerRef.current = null
    }, 4000)
  }, [])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const originalAlert = window.alert

    window.alert = (message) => {
      const textMessage = String(message || '').trim()
      const lower = textMessage.toLowerCase()

      const isError =
        lower.includes('gagal') ||
        lower.includes('error') ||
        lower.includes('tidak dapat') ||
        lower.includes('tidak boleh') ||
        lower.includes('wajib') ||
        lower.includes('invalid')

      showToast(
        isError ? 'error' : 'success',
        isError ? 'Proses gagal' : 'Berhasil',
        textMessage || (isError ? 'Proses gagal dilakukan.' : 'Proses berhasil.')
      )
    }

    return () => {
      window.alert = originalAlert
    }
  }, [showToast])

  useEffect(() => {
    const originalFetch = window.fetch.bind(window)

    window.fetch = async (input, init = {}) => {
      const method = String(
        init?.method ||
          (typeof Request !== 'undefined' && input instanceof Request
            ? input.method
            : 'GET')
      ).toUpperCase()

      const url =
        typeof input === 'string'
          ? input
          : input?.url || ''

      const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
      const isAuthAction =
        String(url).includes('/login') ||
        String(url).includes('/logout')

      const isNotificationAction =
        String(url).includes('/notifications/')

      try {
        const response = await originalFetch(input, init)

        if (isMutation && !isAuthAction && !isNotificationAction) {
          let data = null

          try {
            data = await response.clone().json()
          } catch {
            data = null
          }

          if (response.ok) {
            const feedback = getMutationFeedback(method, url)
            const hasImportFailures =
              String(url).toLowerCase().includes('/import') &&
              Number(data?.gagal || 0) > 0

            if (hasImportFailures) {
              showToast(
                'error',
                'Import selesai',
                `Berhasil: ${data?.berhasil ?? 0}. Gagal: ${data?.gagal ?? 0}.`
              )

              return response
            }

            showToast(
              'success',
              feedback.title,
              getResponseMessage(data, feedback.message)
            )
          } else if (response.status === 401) {
            showToast(
              'error',
              'Sesi login habis',
              'Silakan login ulang sebelum menyimpan perubahan.'
            )

            void logout()
            navigate('/login', { replace: true })
          } else {
            showToast(
              'error',
              'Perubahan gagal',
              getResponseMessage(
                data,
                'Data gagal diproses. Periksa kembali isian Anda.'
              )
            )
          }
        }

        return response
      } catch (error) {
        if (isMutation && !isAuthAction && !isNotificationAction) {
          showToast(
            'error',
            'Koneksi gagal',
            'Tidak dapat terhubung ke server. Silakan coba lagi.'
          )
        }

        throw error
      }
    }

    return () => {
      window.fetch = originalFetch
    }
  }, [logout, navigate, showToast])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
      }

      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const searchItems = useMemo(() => {
    const navConfig = roleNavLinks[user?.role] || {}

    return Object.values(navConfig).flatMap((section) =>
      section.links.map((link) => ({
        ...link,
        section: section.label,
        keywords: searchHints[link.label] || '',
      }))
    )
  }, [user?.role])

  const filteredSearchItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    if (!keyword) {
      return searchItems
    }

    return searchItems.filter((item) =>
      `${item.label} ${item.section} ${item.keywords}`
        .toLowerCase()
        .includes(keyword)
    )
  }, [searchItems, searchTerm])

  const loadNotifications = useCallback(async () => {
    if (!token || !API_BASE_URL || !user?.id) {
      return
    }

    try {
      setNotificationLoading(true)

      const response = await fetch(
        `${API_BASE_URL}/notifications`,
        {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )

      let data = null

      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        throw new Error(
          getResponseMessage(
            data,
            'Notifikasi gagal dimuat.'
          )
        )
      }

      const rows = Array.isArray(data?.data)
        ? data.data
        : []

      const mapped = rows.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title || 'Pemberitahuan',
        description:
          item.message || 'Ada pembaruan baru.',
        date: item.created_at || null,
        unread: !item.is_read,
        to: getNotificationTarget(
          user.role,
          item
        ),
      }))

      const maxId = rows.reduce(
        (max, item) =>
          Math.max(max, Number(item.id || 0)),
        0
      )

      if (
        lastIncomingToastIdRef.current ===
        null
      ) {
        /*
         * Saat halaman pertama kali dibuka,
         * notifikasi lama tidak ditampilkan
         * sebagai toast baru.
         */
        lastIncomingToastIdRef.current =
          maxId
      } else if (
        maxId >
        lastIncomingToastIdRef.current
      ) {
        const newestItem = rows.find(
          (item) =>
            Number(item.id || 0) >
            lastIncomingToastIdRef.current
        )

        if (newestItem) {
          showToast(
            'info',
            newestItem.title ||
              'Pemberitahuan baru',
            newestItem.message ||
              'Ada pembaruan baru pada akun Anda.'
          )
        }

        lastIncomingToastIdRef.current =
          maxId
      }

      setNotifications(mapped)

      setUnreadCount(
        Number.isFinite(
          Number(data?.unread_count)
        )
          ? Number(data.unread_count)
          : mapped.filter(
              (item) => item.unread
            ).length
      )
    } catch (err) {
      console.error(
        'Notifikasi gagal dimuat:',
        err
      )
    } finally {
      setNotificationLoading(false)
    }
  }, [
    API_BASE_URL,
    token,
    user?.id,
    user?.role,
    showToast,
  ])

  useEffect(() => {
    if (!token || !user?.id) {
      return undefined
    }

    loadNotifications()

    const intervalId = window.setInterval(
      () => {
        loadNotifications()
      },
      30000
    )

    return () =>
      window.clearInterval(intervalId)
  }, [
    loadNotifications,
    token,
    user?.id,
  ])

  const openNotifications = () => {
    const nextOpen = !notificationOpen

    setNotificationOpen(nextOpen)
    setSearchOpen(false)
    setProfileOpen(false)

    if (nextOpen) {
      loadNotifications()
    }
  }

  const markNotificationAsRead =
    async (item) => {
      if (!item) return

      try {
        if (item.unread) {
          const response = await fetch(
            `${API_BASE_URL}/notifications/${item.id}/read`,
            {
              method: 'PATCH',
              headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          )

          let data = null

          try {
            data = await response.json()
          } catch {
            data = null
          }

          if (!response.ok) {
            throw new Error(
              getResponseMessage(
                data,
                'Notifikasi gagal ditandai sudah dibaca.'
              )
            )
          }

          setNotifications((current) =>
            current.map((notification) =>
              notification.id === item.id
                ? {
                    ...notification,
                    unread: false,
                  }
                : notification
            )
          )

          setUnreadCount((current) =>
            Math.max(current - 1, 0)
          )
        }

        setNotificationOpen(false)

        if (item.to) {
          navigate(item.to)
        }
      } catch (err) {
        console.error(
          'Tandai notifikasi dibaca error:',
          err
        )

        showToast(
          'error',
          'Notifikasi gagal',
          err.message ||
            'Notifikasi gagal diproses.'
        )
      }
    }

  const markAllNotificationsAsRead =
    async () => {
      if (unreadCount <= 0) {
        return
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/notifications/read-all`,
          {
            method: 'PATCH',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        )

        let data = null

        try {
          data = await response.json()
        } catch {
          data = null
        }

        if (!response.ok) {
          throw new Error(
            getResponseMessage(
              data,
              'Semua notifikasi gagal ditandai sudah dibaca.'
            )
          )
        }

        setNotifications((current) =>
          current.map((item) => ({
            ...item,
            unread: false,
          }))
        )

        setUnreadCount(0)
      } catch (err) {
        console.error(
          'Tandai semua notifikasi dibaca error:',
          err
        )

        showToast(
          'error',
          'Notifikasi gagal',
          err.message ||
            'Notifikasi gagal diproses.'
        )
      }
    }

  const requestLogout = () => {
    setProfileOpen(false)
    setLogoutConfirmOpen(true)
  }

  const cancelLogout = () => {
    setLogoutConfirmOpen(false)
  }

  const confirmLogout = async () => {
    setLogoutConfirmOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const getPageTitle = () => {
    const segments = location.pathname.split('/').filter(Boolean)
    const last = segments[segments.length - 1] || 'dashboard'
    return last
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  const getPageGreeting = () => {
    const pageTitle = getPageTitle()
    if (pageTitle === 'Dashboard') {
      return `Selamat datang kembali, ${user?.name}`
    }
    return `Pengelolaan data pada halaman ${pageTitle.toLowerCase()}`
  }

  const title = getPageTitle()
  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="app-shell">
      {isMobile && (
        <div
          className={`mobile-overlay ${mobileOpen ? 'show' : ''}`}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`sidebar ${isMobile ? (mobileOpen ? 'open' : '') : sidebarCollapsed ? 'collapsed' : ''}`}>
        <SidebarContent
          collapsed={!isMobile && sidebarCollapsed}
          onNavigate={() => {
            if (isMobile) setMobileOpen(false)
          }}
          onRequestLogout={requestLogout}
        />
      </aside>

      <div className="main-wrapper">
        <header className="topbar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => {
              if (isMobile) {
                setMobileOpen(!mobileOpen)
              } else {
                setSidebarCollapsed(!sidebarCollapsed)
              }
            }}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>

          <div style={{ flex: 1 }} />

          <div className="topbar-actions">
            <div
              ref={searchRef}
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                className="topbar-btn"
                aria-label="Cari Menu"
                title="Cari Menu"
                onClick={() => {
                  setSearchOpen((prev) => !prev)
                  setNotificationOpen(false)
                  setProfileOpen(false)
                }}
              >
                <Search size={18} />
              </button>

              {searchOpen && (
                <div
                  className="dropdown"
                  style={{
                    minWidth: 320,
                    right: 0,
                    overflow: 'visible',
                  }}
                >
                  <div style={{ padding: 12 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <Search size={16} />
                      <input
                        type="text"
                        className="form-control"
                        autoFocus
                        placeholder="Cari Menu atau menu..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      maxHeight: 320,
                      overflowY: 'auto',
                      borderTop: '1px solid var(--border-soft)',
                    }}
                  >
                    {filteredSearchItems.length === 0 ? (
                      <div
                        style={{
                          padding: 16,
                          color: 'var(--text-muted)',
                          fontSize: 13,
                        }}
                      >
                        Tidak ada fitur yang cocok.
                      </div>
                    ) : (
                      filteredSearchItems.map((item) => {
                        const Icon = item.icon

                        return (
                          <button
                            key={item.to}
                            type="button"
                            className="dropdown-item"
                            onClick={() => {
                              setSearchOpen(false)
                              setSearchTerm('')
                              navigate(item.to)
                            }}
                          >
                            <Icon size={16} />
                            <span style={{ flex: 1, textAlign: 'left' }}>
                              <strong style={{ display: 'block' }}>
                                {item.label}
                              </strong>
                              <small style={{ color: 'var(--text-muted)' }}>
                                {item.section}
                              </small>
                            </span>
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div
              ref={notificationRef}
              style={{ position: 'relative' }}
            >
              <button
                type="button"
                className="topbar-btn"
                aria-label="Notifikasi Terbaru"
                title="Notifikasi Terbaru"
                onClick={openNotifications}
                style={{ position: 'relative' }}
              >
                <Bell size={18} />

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 1,
                      right: 1,
                      minWidth: 16,
                      height: 16,
                      padding: '0 4px',
                      borderRadius: 999,
                      background: 'var(--danger)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <div
                  className="dropdown"
                  style={{
                    minWidth: 380,
                    right: 0,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 16px',
                      borderBottom:
                        '1px solid var(--border-soft)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        'space-between',
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong>Notifikasi</strong>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11.5,
                          color:
                            'var(--text-muted)',
                        }}
                      >
                        {unreadCount > 0
                          ? `${unreadCount} belum dibaca`
                          : 'Semua sudah dibaca'}
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAllNotificationsAsRead()
                        }}
                        style={{
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      maxHeight: 390,
                      overflowY: 'auto',
                    }}
                  >
                    {notificationLoading &&
                    notifications.length ===
                      0 ? (
                      <div
                        style={{
                          padding: 16,
                          color:
                            'var(--text-muted)',
                          fontSize: 13,
                        }}
                      >
                        Memuat notifikasi...
                      </div>
                    ) : notifications.length ===
                      0 ? (
                      <div
                        style={{
                          padding: 20,
                          textAlign: 'center',
                          color:
                            'var(--text-muted)',
                          fontSize: 13,
                        }}
                      >
                        Belum ada notifikasi.
                      </div>
                    ) : (
                      notifications.map(
                        (item) => (
                          <button
                            key={item.id}
                            type="button"
                            className="dropdown-item"
                            onClick={() =>
                              markNotificationAsRead(
                                item
                              )
                            }
                            style={{
                              alignItems:
                                'flex-start',
                              background:
                                item.unread
                                  ? 'var(--primary-soft)'
                                  : undefined,
                              borderLeft:
                                item.unread
                                  ? '3px solid var(--primary)'
                                  : '3px solid transparent',
                            }}
                          >
                            <Bell
                              size={15}
                              style={{
                                marginTop: 3,
                                flexShrink: 0,
                              }}
                            />

                            <span
                              style={{
                                flex: 1,
                                minWidth: 0,
                                textAlign:
                                  'left',
                              }}
                            >
                              <span
                                style={{
                                  display:
                                    'flex',
                                  alignItems:
                                    'center',
                                  gap: 7,
                                }}
                              >
                                <strong
                                  style={{
                                    display:
                                      'block',
                                    color:
                                      'var(--text-primary)',
                                  }}
                                >
                                  {item.title}
                                </strong>

                                {item.unread && (
                                  <span
                                    aria-label="Belum dibaca"
                                    style={{
                                      width: 7,
                                      height: 7,
                                      borderRadius:
                                        999,
                                      background:
                                        'var(--primary)',
                                      flexShrink: 0,
                                    }}
                                  />
                                )}
                              </span>

                              <span
                                style={{
                                  display:
                                    'block',
                                  marginTop: 4,
                                  color:
                                    'var(--text-secondary)',
                                  lineHeight:
                                    1.45,
                                  whiteSpace:
                                    'normal',
                                }}
                              >
                                {
                                  item.description
                                }
                              </span>

                              {item.date && (
                                <small
                                  style={{
                                    display:
                                      'block',
                                    marginTop: 6,
                                    color:
                                      'var(--text-muted)',
                                  }}
                                >
                                  {formatNotificationDate(
                                    item.date
                                  )}
                                </small>
                              )}
                            </span>
                          </button>
                        )
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-menu" ref={profileRef}>
              <button
                type="button"
                className="profile-btn"
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setProfileOpen((prev) => !prev)
                }}
              >
                <div className="avatar">{getUserInitial(user)}</div>
                <div className="profile-info">
                  <div className="profile-name">{user?.name}</div>
                  <div className="profile-role">{roleLabels[user?.role] || user?.role}</div>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </button>

              {profileOpen && (
                <div
                  className="dropdown"
                  role="menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="dropdown-item disabled">
                    <User size={15} />
                    {user?.email}
                  </div>
                  <button
                    type="button"
                    className="dropdown-item danger"
                    onClick={requestLogout}
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          {title === 'Dashboard' ? (
            <div className="welcome-header">
              <div>
                <h1>{getPageGreeting()}</h1>
                <p>
                  {user?.role === roles.ADMIN
                    ? 'Pantau aktivitas perwalian mahasiswa secara keseluruhan.'
                    : user?.role === roles.DOSEN
                      ? 'Kelola mahasiswa wali dan catat perwalian Anda.'
                      : 'Kelola perwalian dan pantau perkembangan akademik Anda.'}
                </p>
              </div>
              <div className="welcome-date">
                <CalendarDays size={16} />
                {today}
              </div>
            </div>
          ) : (
            <div className="page-header">
              <h1>{title}</h1>
              <p>{getPageGreeting()}</p>
            </div>
          )}
          <Outlet />
        </main>
      </div>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 18,
            right: 18,
            zIndex: 10050,
            width: 'min(380px, calc(100vw - 36px))',
            background: 'var(--surface)',
            border: '1px solid var(--border-soft)',
            borderLeft: `4px solid ${
              toast.type === 'error'
                ? 'var(--danger, #dc2626)'
                : toast.type === 'info'
                  ? 'var(--primary, #0f766e)'
                  : 'var(--success, #16a34a)'
            }`,
            borderRadius: 14,
            boxShadow: 'var(--shadow-lg)',
            padding: 14,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 11,
          }}
        >
          <div
            style={{
              marginTop: 1,
              color:
                toast.type === 'error'
                  ? 'var(--danger, #dc2626)'
                  : toast.type === 'info'
                    ? 'var(--primary, #0f766e)'
                    : 'var(--success, #16a34a)',
              flexShrink: 0,
            }}
          >
            {toast.type === 'error' ? (
              <XCircle size={21} />
            ) : toast.type === 'info' ? (
              <Info size={21} />
            ) : (
              <CheckCircle2 size={21} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <strong
              style={{
                display: 'block',
                color: 'var(--text-primary)',
                fontSize: 14,
              }}
            >
              {toast.title}
            </strong>

            <div
              style={{
                marginTop: 3,
                color: 'var(--text-secondary)',
                fontSize: 13,
                lineHeight: 1.45,
              }}
            >
              {toast.message}
            </div>
          </div>

          <button
            type="button"
            aria-label="Tutup pemberitahuan"
            onClick={() => setToast(null)}
            style={{
              border: 0,
              background: 'transparent',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {logoutConfirmOpen && (
        <div
          role="presentation"
          onClick={cancelLogout}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-confirm-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 420,
              background: 'var(--surface)',
              border: '1px solid var(--border-soft)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-lg)',
              padding: 24,
            }}
          >
            <h3 id="logout-confirm-title" style={{ margin: 0, fontSize: 18 }}>
              Konfirmasi Logout
            </h3>

            <p
              style={{
                margin: '10px 0 22px',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}
            >
              Apakah Anda yakin ingin keluar dari Sistem Informasi Perwalian?
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
              }}
            >
              <button
                type="button"
                className="btn btn-outline"
                onClick={cancelLogout}
              >
                Batal
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={confirmLogout}
              >
                <LogOut size={15} />
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
