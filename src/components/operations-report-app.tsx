'use client'

import {
  Activity, AlertCircle, ArrowDown, ArrowUp, BedDouble, Bell, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown,
  CircleHelp, Clock3, Columns3, Database, Download, Eye, EyeOff, FileDown,
  FileSpreadsheet, FileText, Gauge, LoaderCircle, LockKeyhole, LogOut,
  Menu, MessageSquareText, Play, RefreshCw, Search, Settings,
  ShieldCheck, UserRound, X,
} from 'lucide-react'
import {
  useEffect, useMemo, useState, type ButtonHTMLAttributes,
  type InputHTMLAttributes, type ReactNode,
} from 'react'

type Page = 'dashboard' | 'missed' | 'comments' | 'settings'
type ReportStatus = 'idle' | 'loading' | 'success' | 'error'
type Row = Record<string, string | null>
type Column = { key: string; label: string }

const DEMO_EMAIL = 'demo@operations.local'
const DEMO_PASSWORD = 'OperationsDemo2025!'

const missedColumns: Column[] = [
  { key: 'room', label: 'Room Number' }, { key: 'arrival', label: 'Arrival Date' },
  { key: 'departure', label: 'Departure Date' }, { key: 'confirmation', label: 'Confirmation ID' },
  { key: 'profile', label: 'Profile ID' },
]
const commentColumns: Column[] = [
  { key: 'room', label: 'Room No' }, { key: 'confirmation', label: 'Conf No' },
  { key: 'type', label: 'Comment Type' }, { key: 'comment', label: 'Comment' },
  { key: 'commentDate', label: 'Comment Date' }, { key: 'submitted', label: 'Comment Submitted Date' },
  { key: 'commentBy', label: 'Comment By' }, { key: 'gsa', label: 'GSA' },
  { key: 'updatedBy', label: 'Comment Updated By' }, { key: 'updated', label: 'Comment Update Date' },
  { key: 'arrival', label: 'Arrival Date' }, { key: 'departure', label: 'Departure Date' },
]
const missedRows: Row[] = [
  { room: '204', arrival: '2025-05-15', departure: '2025-05-18', confirmation: 'CNF-78491', profile: 'P-104882' },
  { room: '318', arrival: '2025-05-16', departure: '2025-05-18', confirmation: 'CNF-78524', profile: 'P-104921' },
  { room: '412', arrival: '2025-05-14', departure: '2025-05-17', confirmation: 'CNF-78388', profile: 'P-104704' },
  { room: '507', arrival: '2025-05-17', departure: '2025-05-18', confirmation: 'CNF-78580', profile: null },
  { room: '611', arrival: '2025-05-12', departure: '2025-05-16', confirmation: 'CNF-78102', profile: 'P-104203' },
  { room: '708', arrival: '2025-05-16', departure: '2025-05-18', confirmation: 'CNF-78531', profile: 'P-104930' },
  { room: '814', arrival: '2025-05-13', departure: '2025-05-18', confirmation: 'CNF-78245', profile: 'P-104451' },
]
const commentRows: Row[] = [
  { room: '105', confirmation: 'CNF-78610', type: 'Guest Request', comment: 'Guest requested a quiet room away from the elevator and an additional set of towels before the evening turndown service.', commentDate: '2025-05-18', submitted: '2025-05-18 08:42', commentBy: 'M. Rivera', gsa: 'A. Chen', updatedBy: null, updated: null, arrival: '2025-05-17', departure: '2025-05-21' },
  { room: '218', confirmation: 'CNF-78592', type: 'Maintenance', comment: 'Air conditioning was reported as noisy. Engineering attended and confirmed the unit is operating normally after filter replacement.', commentDate: '2025-05-18', submitted: '2025-05-18 10:17', commentBy: 'J. Patel', gsa: 'S. Brooks', updatedBy: 'D. Kim', updated: '2025-05-18', arrival: '2025-05-16', departure: '2025-05-20' },
  { room: '304', confirmation: 'CNF-78634', type: 'Service Recovery', comment: 'Breakfast delay acknowledged. Courtesy amenity arranged for the room and the guest confirmed satisfaction with the resolution.', commentDate: '2025-05-18', submitted: '2025-05-18 11:36', commentBy: 'S. Brooks', gsa: 'S. Brooks', updatedBy: null, updated: null, arrival: '2025-05-18', departure: '2025-05-22' },
  { room: '427', confirmation: 'CNF-78475', type: 'Preference', comment: 'Prefers sparkling water and feather-free bedding for all future stays.', commentDate: '2025-05-18', submitted: '2025-05-18 13:05', commentBy: 'A. Chen', gsa: 'M. Rivera', updatedBy: null, updated: null, arrival: '2025-05-15', departure: '2025-05-19' },
  { room: '512', confirmation: 'CNF-78601', type: 'Guest Request', comment: 'Late checkout requested until 2:00 PM. Approved by the duty manager and noted for housekeeping coordination.', commentDate: '2025-05-18', submitted: '2025-05-18 15:22', commentBy: 'D. Kim', gsa: 'J. Patel', updatedBy: 'M. Rivera', updated: '2025-05-18', arrival: '2025-05-17', departure: '2025-05-19' },
  { room: '633', confirmation: 'CNF-78548', type: 'Information', comment: 'Guest is celebrating an anniversary. Restaurant reservation confirmed for 7:30 PM.', commentDate: '2025-05-18', submitted: '2025-05-18 17:14', commentBy: 'M. Rivera', gsa: 'A. Chen', updatedBy: null, updated: null, arrival: '2025-05-16', departure: '2025-05-20' },
]

function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-600',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-orange-600',
    ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-500',
    danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-600',
  }
  return <button className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>
}

function TextInput({ icon, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">{icon}</span><input className={`h-9 w-full rounded-md border border-slate-300 bg-white pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-orange-600 focus:ring-2 focus:ring-orange-100 ${icon ? 'pl-9' : 'pl-3'} ${className}`} {...props} /></div>
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-orange-600 text-white"><FileText size={18} strokeWidth={2.2} /></div>{!compact && <div><p className="text-[13px] font-bold leading-tight tracking-tight">Operations Report</p><p className="mt-0.5 text-[9px] font-medium opacity-60">REPORTING CONSOLE</p></div>}</div>
}

function Status({ tone = 'success', children }: { tone?: 'success' | 'error' | 'neutral' | 'info'; children: ReactNode }) {
  const color = { success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', error: 'bg-red-50 text-red-700 ring-red-600/20', neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20', info: 'bg-blue-50 text-blue-700 ring-blue-600/20' }[tone]
  return <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${color}`}><span className="size-1.5 rounded-full bg-current" />{children}</span>
}

function Login({ onLogin }: { onLogin: (keepLoggedIn: boolean) => void }) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [error, setError] = useState('')
  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password) return setError('Enter your administrator email and password.')
    if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) return setError('Invalid demo username or password.')
    setError(''); setLoading(true)
    window.setTimeout(() => { setLoading(false); onLogin(keepLoggedIn) }, 700)
  }
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-5 py-12">
    <div className="absolute inset-x-0 top-0 h-1 bg-orange-600" />
    <div className="relative w-full max-w-[380px]"><div className="mb-5 flex justify-center text-slate-950"><Logo /></div><div className="rounded-md border border-slate-300 bg-white p-5 shadow-md shadow-slate-900/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-700">Secure local access</p><h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950">Welcome back</h2><p className="mt-1.5 text-xs text-slate-500">Sign in with your administrator account.</p>
      <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-3 text-xs text-orange-900"><p className="font-bold">Demo credentials</p><p className="mt-1"><span className="font-medium">Username:</span> {DEMO_EMAIL}</p><p className="mt-0.5"><span className="font-medium">Password:</span> {DEMO_PASSWORD}</p></div>
      {error && <div role="alert" className="mt-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}</div>}
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Administrator email</span><TextInput autoComplete="username" icon={<UserRound size={15} />} placeholder="admin@operations.local" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Password</span><div className="relative"><TextInput autoComplete="current-password" icon={<LockKeyhole size={15} />} type={show ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" /><button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-slate-400 hover:text-slate-700">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={keepLoggedIn} onChange={(event) => setKeepLoggedIn(event.target.checked)} className="size-3.5 rounded border-slate-300 accent-orange-600" />Keep me logged in</label>
        <Button type="submit" disabled={loading} className="w-full">{loading ? <><LoaderCircle size={17} className="animate-spin" />Signing in…</> : <>Sign in<ChevronRight size={17} /></>}</Button>
      </form>
      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500"><LockKeyhole size={14} />Your session is encrypted and expires automatically.</div>
    </div></div>
  </main>
}

function Sidebar({ page, onPage, open, onClose }: { page: Page; onPage: (p: Page) => void; open: boolean; onClose: () => void }) {
  const items = [{ id: 'dashboard' as Page, label: 'Dashboard', icon: Gauge }, { id: 'missed' as Page, label: 'Missed Check-Out', icon: BedDouble }, { id: 'comments' as Page, label: "Yesterday's Comments", icon: MessageSquareText }]
  return <><div onClick={onClose} className={`fixed inset-0 z-30 bg-slate-950/50 lg:hidden ${open ? 'block' : 'hidden'}`} /><aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-slate-900 text-white transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
    <div className="flex h-16 items-center justify-between border-b border-white/10 px-4"><Logo /><button onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu"><X size={17} /></button></div>
    <nav className="flex-1 px-3 py-5"><p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p><div className="space-y-1">{items.map((item) => <button key={item.id} onClick={() => { onPage(item.id); onClose() }} className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium transition ${page === item.id ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-white/[.06] hover:text-white'}`}><item.icon size={16} />{item.label}</button>)}</div><p className="mb-2 mt-6 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">System</p><button onClick={() => { onPage('settings'); onClose() }} className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium ${page === 'settings' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-white/[.06] hover:text-white'}`}><Settings size={16} />Settings</button></nav>
    <div className="m-3 rounded-md border border-white/10 bg-white/[.04] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-emerald-400"><span className="size-2 rounded-full bg-emerald-400" />SQL Server online</div><p className="mt-1.5 text-[11px] text-slate-500">FOApp · Local instance</p></div>
  </aside></>
}

function Header({ onMenu, onLogout }: { onMenu: () => void; onLogout: () => void }) {
  const [now, setNow] = useState(new Date())
  const [menu, setMenu] = useState(false)
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer) }, [])
  return <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-300 bg-white px-4 lg:px-5">
    <div className="flex items-center gap-3"><button onClick={onMenu} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu size={21} /></button><div><p className="text-sm font-semibold text-slate-950">Operations Report</p><div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><CalendarDays size={13} />{now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div></div></div>
    <div className="flex items-center gap-2"><div className="mr-3 hidden items-center gap-2 border-r border-slate-200 pr-5 md:flex"><span className="size-2 rounded-full bg-emerald-500" /><span className="text-xs font-medium text-slate-600">Database connected</span></div><button className="relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell size={19} /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-orange-600 ring-2 ring-white" /></button><div className="relative"><button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"><span className="grid size-8 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">AR</span><span className="hidden text-left sm:block"><span className="block text-xs font-semibold text-slate-800">Admin Reporter</span><span className="block text-[10px] text-slate-500">Administrator</span></span><ChevronDown size={14} /></button>{menu && <div className="absolute right-0 top-12 w-48 rounded-md border border-slate-200 bg-white p-1.5 shadow-md"><button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50"><LogOut size={16} />Sign out</button></div>}</div></div>
  </header>
}

function Dashboard() {
  const activity = [
    ["Yesterday's Comments", 'Today, 8:46 AM', '24 rows', '1.8s', true],
    ['Missed Check-Out', 'Today, 8:31 AM', '7 rows', '2.4s', true],
    ["Yesterday's Comments", 'Yesterday, 4:12 PM', '19 rows', '1.6s', true],
    ['Missed Check-Out', 'Yesterday, 2:05 PM', 'Failed', 'Error', false],
  ] as const
  return <div className="space-y-4"><div><p className="text-[11px] font-semibold text-orange-700">Monday, May 19</p><h1 className="mt-0.5 text-lg font-semibold text-slate-950">Good morning, Admin</h1><p className="mt-1 text-xs text-slate-500">Review recent report activity from your secure workspace.</p></div>
    <section className="rounded-sm border border-slate-300 bg-white"><div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-4 py-3"><div><h2 className="text-sm font-semibold text-slate-900">Recent report activity</h2><p className="mt-0.5 text-[11px] text-slate-500">Latest executions from this console</p></div><Button variant="ghost" className="h-8 px-2.5">View all<ChevronRight size={14} /></Button></div><div className="divide-y divide-slate-200">{activity.map(([report, time, rows, duration, ok]) => <div key={report + time} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_150px_100px_80px]"><div className="flex min-w-0 items-center gap-2.5"><span className={`grid size-8 place-items-center rounded-sm ${ok ? 'bg-orange-50 text-orange-700' : 'bg-red-50 text-red-700'}`}>{ok ? <FileText size={15} /> : <AlertCircle size={15} />}</span><div><p className="text-xs font-semibold text-slate-800">{report}</p><p className="text-[11px] text-slate-500 sm:hidden">{time}</p></div></div><p className="hidden text-xs text-slate-500 sm:block">{time}</p><p className="hidden text-xs font-medium text-slate-700 sm:block">{rows}</p><Status tone={ok ? 'success' : 'error'}>{duration}</Status></div>)}</div></section>
  </div>
}

function Summary({ label, value, icon, green = false }: { label: string; value: string; icon: ReactNode; green?: boolean }) {
  return <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-3"><span className={`grid size-8 place-items-center rounded-md ${green ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{icon}</span><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 truncate text-xs font-semibold text-slate-800">{value}</p></div></div>
}

function ReportPage({ kind }: { kind: 'missed' | 'comments' }) {
  const comments = kind === 'comments'
  const columns = comments ? commentColumns : missedColumns
  const source = comments ? commentRows : missedRows
  const [status, setStatus] = useState<ReportStatus>('idle')
  const [rows, setRows] = useState<Row[]>([])
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'room', direction: 'asc' as 'asc' | 'desc' })
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(5)
  const [comment, setComment] = useState<Row | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useState('')
  const run = () => { setStatus('loading'); setTimeout(() => { setRows(source); setStatus('success'); setToast(`${source.length} records returned successfully`); setTimeout(() => setToast(''), 3000) }, 1100) }
  const filtered = useMemo(() => rows.filter((row) => Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(query.toLowerCase()))).sort((a, b) => String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1)), [rows, query, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / size))
  const visible = filtered.slice((page - 1) * size, page * size)
  const sortBy = (key: string) => setSort((s) => ({ key, direction: s.key === key && s.direction === 'asc' ? 'desc' : 'asc' }))
  function csv() {
    const safe = (v: string | null) => { const x = v && /^[=+\-@]/.test(v) ? `'${v}` : (v ?? ''); return `"${x.replaceAll('"', '""')}"` }
    const body = '\uFEFF' + [columns.map((c) => safe(c.label)).join(','), ...rows.map((r) => columns.map((c) => safe(r[c.key])).join(','))].join('\r\n')
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([body], { type: 'text/csv;charset=utf-8' })); link.download = `${comments ? 'Yesterdays_Comments_Report' : 'Missed_Checkout_Report'}_2025-05-19.csv`; link.click(); URL.revokeObjectURL(link.href); setExportOpen(false); setToast(`CSV prepared with all ${rows.length} records`)
  }
  async function excel() {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Operations Report'
    workbook.created = new Date()
    const sheet = workbook.addWorksheet(comments ? 'Yesterday Comments' : 'Missed Check-Out', {
      views: [{ state: 'frozen', ySplit: 5 }],
    })
    const title = comments ? "Yesterday's Comments Report" : 'Missed Check-Out Report'
    sheet.addRow([title])
    sheet.addRow([`Generated: ${new Date().toLocaleString()}`])
    sheet.addRow([`Rows: ${rows.length}`])
    sheet.addRow([])
    sheet.addRow(columns.map((column) => column.label))
    sheet.getRow(1).font = { bold: true, size: 16, color: { argb: 'FF0F172A' } }
    sheet.getRow(2).font = { color: { argb: 'FF475569' } }
    sheet.getRow(3).font = { bold: true, color: { argb: 'FF0F766E' } }
    const header = sheet.getRow(5)
    header.height = 25
    header.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F3B4C' } }
      cell.alignment = { vertical: 'middle' }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } } }
    })
    const protectedValue = (value: string | null) => value && /^[=+\-@]/.test(value) ? `'${value}` : value
    rows.forEach((row, index) => {
      const excelRow = sheet.addRow(columns.map((column) => protectedValue(row[column.key])))
      excelRow.alignment = { vertical: 'top' }
      if (index % 2 === 1) {
        excelRow.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
        })
      }
      excelRow.eachCell((cell) => {
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } } }
      })
      if (comments) {
        excelRow.getCell(4).alignment = { vertical: 'top', wrapText: true }
        excelRow.height = 36
      }
    })
    sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: columns.length } }
    columns.forEach((column, index) => {
      sheet.getColumn(index + 1).width = column.key === 'comment' ? 60 : Math.max(15, column.label.length + 3)
    })
    const buffer = await workbook.xlsx.writeBuffer()
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${comments ? 'Yesterdays_Comments_Report' : 'Missed_Checkout_Report'}_2025-05-19.xlsx`
    link.click()
    URL.revokeObjectURL(url)
    setExportOpen(false)
    setToast(`Excel prepared with all ${rows.length} records`)
  }
  return <div className="space-y-5">
    {toast && <div className="fixed right-5 top-24 z-50 flex items-center gap-3 rounded-md border border-emerald-200 bg-white px-4 py-3 text-sm font-medium shadow-md"><span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={16} /></span>{toast}<button onClick={() => setToast('')}><X size={16} /></button></div>}
    <div><div className="flex items-center gap-2 text-[11px] text-slate-500">Reports<ChevronRight size={12} /><span className="text-slate-700">{comments ? "Yesterday's Comments" : 'Missed Check-Out'}</span></div><div className="mt-3 flex flex-col justify-between gap-3 xl:flex-row xl:items-end"><div className="max-w-3xl"><h1 className="text-lg font-semibold text-slate-950">{comments ? "Yesterday's Comments Report" : 'Missed Check-Out Report'}</h1><p className="mt-1 text-xs leading-5 text-slate-500">{comments ? 'Review comments recorded yesterday for currently occupied rooms, together with stay, guest-service, and submission information.' : 'Find guests whose stay records indicate an overdue departure and whose profile IDs are missing from the latest arrival CSV file.'}</p></div><Button onClick={run} disabled={status === 'loading'}>{status === 'loading' ? <><LoaderCircle size={14} className="animate-spin" />Running report…</> : <><Play size={14} fill="currentColor" />Run report</>}</Button></div></div>
    <div className="grid gap-3 sm:grid-cols-3"><Summary label="Execution status" value={status === 'success' ? 'Completed' : status === 'loading' ? 'Running' : 'Ready to run'} icon={status === 'success' ? <CheckCircle2 size={18} /> : <Activity size={18} />} green={status === 'success'} /><Summary label="Results" value={status === 'success' ? `${rows.length} records` : '—'} icon={<FileText size={18} />} /><Summary label="Last execution" value={status === 'success' ? 'Today at 8:46 AM · 1.8 seconds' : 'Not run in this session'} icon={<Clock3 size={18} />} /></div>
    {status === 'idle' && <EmptyReport comments={comments} />}
    {status === 'loading' && <LoadingTable />}
    {status === 'error' && <ErrorReport onRetry={run} />}
    {status === 'success' && <section className="overflow-hidden rounded-sm border border-slate-300 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-300 bg-slate-50 p-3 lg:flex-row"><div className="w-full max-w-md"><TextInput icon={<Search size={15} />} placeholder="Search across all displayed fields…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} /></div><div className="flex gap-2"><Button variant="secondary"><Columns3 size={14} />Columns<ChevronDown size={13} /></Button><div className="relative"><Button variant="secondary" onClick={() => setExportOpen(!exportOpen)}><Download size={14} />Export all<ChevronDown size={13} /></Button>{exportOpen && <div className="absolute right-0 top-10 z-20 w-60 rounded-sm border border-slate-300 bg-white p-1 shadow-md"><button onClick={csv} className="flex w-full gap-2.5 rounded-sm p-2.5 text-left hover:bg-slate-50"><FileText size={16} className="text-orange-700" /><span><strong className="block text-xs">Download CSV</strong><small className="text-[11px] text-slate-500">All {rows.length} rows · UTF-8</small></span></button><button onClick={excel} className="flex w-full gap-2.5 rounded-sm p-2.5 text-left hover:bg-slate-50"><FileSpreadsheet size={16} className="text-emerald-700" /><span><strong className="block text-xs">Download Excel</strong><small className="text-[11px] text-slate-500">Formatted .xlsx workbook</small></span></button></div>}</div></div></div>
      {filtered.length ? <><div className="overflow-x-auto"><table className="w-full min-w-max text-left"><thead><tr className="bg-slate-50">{columns.map((c) => <th key={c.key} className={`whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 ${c.key === 'comment' ? 'min-w-80' : ''}`}><button onClick={() => sortBy(c.key)} className="flex items-center gap-1.5 hover:text-slate-800">{c.label}{sort.key === c.key ? (sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} className="opacity-50" />}</button></th>)}</tr></thead><tbody>{visible.map((row, i) => <tr key={`${row.room}-${i}`} className="border-b border-slate-100 hover:bg-orange-50/30">{columns.map((c) => <td key={c.key} className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-650">{c.key === 'room' ? <strong className="text-slate-900">{row[c.key]}</strong> : c.key === 'comment' ? <div className="flex max-w-sm items-center gap-2"><span className="truncate">{row.comment}</span><button onClick={() => setComment(row)} className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-orange-700 hover:bg-orange-50">View</button></div> : row[c.key] || <span className="text-slate-400">—</span>}</td>)}</tr>)}</tbody></table></div><TableFooter page={page} pages={pages} size={size} count={filtered.length} onPage={setPage} onSize={(n) => { setSize(n); setPage(1) }} /></> : <SearchEmpty onClear={() => setQuery('')} />}
    </section>}
    {comment && <CommentModal row={comment} onClose={() => setComment(null)} />}
  </div>
}

function EmptyReport({ comments }: { comments: boolean }) {
  return <section className="grid min-h-[220px] place-items-center rounded-sm border border-slate-300 bg-white p-5 text-center"><div className="max-w-md"><span className="mx-auto grid size-9 place-items-center rounded-sm border border-orange-200 bg-orange-50 text-orange-700">{comments ? <MessageSquareText size={18} /> : <BedDouble size={18} />}</span><h2 className="mt-3 text-xs font-semibold text-slate-900">Ready to run this report</h2><p className="mt-1 text-xs leading-5 text-slate-500">Results are retrieved securely from SQL Server only when requested. No guest information is displayed until execution completes.</p><p className="mt-2 text-[11px] text-slate-400">Use Run report above. Most reports complete in under 30 seconds.</p></div></section>
}
function LoadingTable() {
  return <section className="rounded-md border border-slate-200 bg-white p-4"><div className="mb-4 flex items-center gap-3 rounded-lg border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-800"><LoaderCircle size={18} className="animate-spin" /><strong>Running SQL report…</strong> This may take a few moments.</div>{Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex gap-4 border-b border-slate-100 py-4">{Array.from({ length: 5 }).map((__, j) => <div key={j} className="h-4 flex-1 animate-pulse rounded bg-slate-100" />)}</div>)}</section>
}
function ErrorReport({ onRetry }: { onRetry: () => void }) {
  return <section className="grid min-h-[360px] place-items-center rounded-md border border-red-200 bg-white p-8 text-center"><div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-lg bg-red-50 text-red-700"><AlertCircle size={27} /></span><h2 className="mt-5 text-lg font-semibold">Report execution failed</h2><p className="mt-2 text-sm leading-6 text-slate-500">The database did not respond before the request timed out. Previous successful results are preserved.</p><Button onClick={onRetry} className="mt-6"><RefreshCw size={16} />Retry report</Button></div></section>
}
function SearchEmpty({ onClear }: { onClear: () => void }) {
  return <div className="grid min-h-72 place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500"><Search size={21} /></span><h3 className="mt-4 font-semibold">No matching results</h3><p className="mt-1 text-sm text-slate-500">Try adjusting your search terms.</p><Button variant="ghost" className="mt-3" onClick={onClear}>Clear search</Button></div></div>
}
function TableFooter({ page, pages, size, count, onPage, onSize }: { page: number; pages: number; size: number; count: number; onPage: (n: number) => void; onSize: (n: number) => void }) {
  return <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row"><div className="flex items-center gap-3 text-xs text-slate-500">Showing <strong className="text-slate-700">{(page - 1) * size + 1}–{Math.min(page * size, count)}</strong> of <strong className="text-slate-700">{count}</strong><label className="flex items-center gap-2">Rows<select value={size} onChange={(e) => onSize(Number(e.target.value))} className="rounded-md border border-slate-300 bg-white px-2 py-1.5">{[5, 10, 25].map((n) => <option key={n}>{n}</option>)}</select></label></div><div className="flex gap-1"><button disabled={page === 1} onClick={() => onPage(page - 1)} className="grid size-8 place-items-center rounded-md border border-slate-300 disabled:opacity-40"><ChevronLeft size={16} /></button>{Array.from({ length: pages }, (_, i) => i + 1).map((n) => <button key={n} onClick={() => onPage(n)} className={`grid size-8 place-items-center rounded-md text-xs font-semibold ${n === page ? 'bg-slate-900 text-white' : 'border border-slate-300'}`}>{n}</button>)}<button disabled={page === pages} onClick={() => onPage(page + 1)} className="grid size-8 place-items-center rounded-md border border-slate-300 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>
}
function CommentModal({ row, onClose }: { row: Row; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-xl overflow-hidden rounded-md bg-white shadow-lg"><div className="flex justify-between border-b border-slate-300 bg-slate-50 px-4 py-3"><div><p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">Guest comment</p><h2 className="mt-0.5 text-base font-semibold">Room {row.room}</h2></div><button onClick={onClose} className="rounded-sm p-1.5 hover:bg-slate-200"><X size={16} /></button></div><div className="p-4"><div className="flex gap-2"><Status tone="info">{row.type}</Status><Status tone="neutral">{row.confirmation}</Status></div><blockquote className="mt-4 rounded-sm border-l-4 border-orange-600 bg-slate-50 p-4 text-xs leading-5 text-slate-700">“{row.comment}”</blockquote><dl className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Submitted by" value={row.commentBy} /><Info label="Submitted" value={row.submitted} /><Info label="Guest service agent" value={row.gsa} /><Info label="Stay dates" value={`${row.arrival} — ${row.departure}`} /></dl></div><div className="flex justify-end border-t border-slate-300 bg-slate-50 px-4 py-3"><Button variant="secondary" onClick={onClose}>Close</Button></div></div></div>
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-xs font-semibold text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-800">{value ?? '—'}</dd></div>
}

function SettingsPage({ onLogout }: { onLogout: () => void }) {
  const [testing, setTesting] = useState('')
  const test = (key: string) => { setTesting(key); setTimeout(() => setTesting(''), 1000) }
  return <div className="space-y-4"><div><div className="flex items-center gap-2 text-[11px] text-slate-500">System<ChevronRight size={12} /><span className="text-slate-700">Settings</span></div><h1 className="mt-2 text-lg font-semibold">Settings & status</h1><p className="mt-1 text-xs text-slate-500">Review local connectivity and session information. Sensitive credentials are never displayed.</p></div>
    <section className="grid gap-4 xl:grid-cols-2"><SettingsCard icon={<Database size={17} />} title="Database connection" description="SQL Server is reachable and FOApp is available."><Setting label="Server" value="LOCALHOST\\HOTELSQL" /><Setting label="Database" value="FOApp" /><Setting label="Authentication" value="Windows Integrated" /><Button variant="secondary" onClick={() => test('db')} className="mt-4">{testing === 'db' ? <LoaderCircle size={14} className="animate-spin" /> : <Activity size={14} />}Test connection</Button></SettingsCard><SettingsCard icon={<FileDown size={17} />} title="Arrival data file" description="SQL Server service account can read the configured arrival file."><Setting label="Path" value="C:\\ARRIVAL_DATA\\ARRIVAL_DATA.csv" /><Setting label="Last modified" value="Today, 6:04 AM" /><Setting label="File owner" value="Managed by SQL Server" /><Button variant="secondary" onClick={() => test('file')} className="mt-4">{testing === 'file' ? <LoaderCircle size={14} className="animate-spin" /> : <FileText size={14} />}Test file access</Button></SettingsCard></section>
    <section className="rounded-sm border border-slate-300 bg-white"><div className="border-b border-slate-300 bg-slate-50 px-4 py-3"><h2 className="text-sm font-semibold">Application & session</h2></div><div className="grid md:grid-cols-2"><div className="space-y-3 p-4 md:border-r"><Setting label="Application version" value="1.0.0" /><Setting label="Environment" value="Local production" /><Setting label="API binding" value="127.0.0.1 only" /></div><div className="space-y-3 border-t p-4 md:border-t-0"><Setting label="Signed in as" value="admin@operations.local" /><Setting label="Session started" value="Today, 8:02 AM" /><Setting label="Session expires" value="Today, 4:02 PM" /></div></div><div className="flex flex-col justify-between gap-3 border-t bg-slate-50 px-4 py-3 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} className="text-emerald-600" />HTTP-only secure session enabled</div><Button variant="danger" onClick={onLogout}><LogOut size={14} />Sign out</Button></div></section>
    <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><CircleHelp size={19} className="shrink-0" /><p><strong>Need to change connection settings?</strong> Update the backend environment file and restart the application. Passwords and session secrets cannot be edited here.</p></div>
  </div>
}
function SettingsCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <article className="rounded-sm border border-slate-300 bg-white p-4"><div className="flex justify-between gap-3"><div className="flex gap-2.5"><span className="grid size-8 place-items-center rounded-sm border border-orange-200 bg-orange-50 text-orange-700">{icon}</span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</p></div></div><Status>Connected</Status></div><div className="mt-4 space-y-2.5 border-t border-slate-200 pt-3">{children}</div></article>
}
function Setting({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5 text-xs"><span className="text-slate-500">{label}</span><span className="break-all text-right font-medium text-slate-800">{value}</span></div>
}

export function OperationsReportApp() {
  const [auth, setAuth] = useState(false)
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebar, setSidebar] = useState(false)
  useEffect(() => setAuth(localStorage.getItem('operations-demo-session') === 'active'), [])
  const login = (keepLoggedIn: boolean) => {
    if (keepLoggedIn) localStorage.setItem('operations-demo-session', 'active')
    setAuth(true)
  }
  const logout = () => {
    localStorage.removeItem('operations-demo-session')
    setAuth(false)
    setPage('dashboard')
  }
  if (!auth) return <Login onLogin={login} />
  return <div className="min-h-screen bg-slate-100"><Sidebar page={page} onPage={setPage} open={sidebar} onClose={() => setSidebar(false)} /><div className="lg:pl-60"><Header onMenu={() => setSidebar(true)} onLogout={logout} /><main className="mx-auto max-w-[1600px] p-4 lg:p-5">{page === 'dashboard' && <Dashboard />}{page === 'missed' && <ReportPage kind="missed" />}{page === 'comments' && <ReportPage kind="comments" />}{page === 'settings' && <SettingsPage onLogout={logout} />}</main></div></div>
}
