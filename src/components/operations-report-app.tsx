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

type AuthState = { username: string; csrf: string }
type ReportResponse = {
  id: string
  rows: Row[]
  rowCount: number
  durationMs: number
  executedAt: string
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
    throw new ApiError(body?.error?.message ?? 'The request could not be completed.', response.status)
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

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

function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const variants = {
    primary: 'bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-700',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-teal-700',
    ghost: 'text-slate-600 hover:bg-slate-100 focus-visible:ring-slate-500',
    danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-600',
  }
  return <button className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props}>{children}</button>
}

function TextInput({ icon, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { icon?: ReactNode }) {
  return <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">{icon}</span><input className={`h-9 w-full rounded-md border border-slate-300 bg-white pr-3 text-xs text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 ${icon ? 'pl-9' : 'pl-3'} ${className}`} {...props} /></div>
}

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-700 text-white"><FileText size={18} strokeWidth={2.2} /></div>{!compact && <div><p className="text-[13px] font-bold leading-tight tracking-tight">Operations Report</p><p className="mt-0.5 text-[9px] font-medium opacity-60">REPORTING CONSOLE</p></div>}</div>
}

function Status({ tone = 'success', children }: { tone?: 'success' | 'error' | 'neutral' | 'info'; children: ReactNode }) {
  const color = { success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', error: 'bg-red-50 text-red-700 ring-red-600/20', neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20', info: 'bg-blue-50 text-blue-700 ring-blue-600/20' }[tone]
  return <span className={`inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${color}`}><span className="size-1.5 rounded-full bg-current" />{children}</span>
}

function Login({ onLogin }: { onLogin: (username: string, password: string, keepLoggedIn: boolean) => Promise<void> }) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!email.trim() || !password) return setError('Enter your administrator username and password.')
    setError('')
    setLoading(true)
    try {
      await onLogin(email, password, keepLoggedIn)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Sign in failed.')
    } finally {
      setLoading(false)
    }
  }
  return <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-5 py-12">
    <div className="absolute inset-x-0 top-0 h-1 bg-teal-700" />
    <div className="relative w-full max-w-[380px]"><div className="mb-5 flex justify-center text-slate-950"><Logo /></div><div className="rounded-md border border-slate-300 bg-white p-5 shadow-md shadow-slate-900/5">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-700">Secure local access</p><h2 className="mt-1.5 text-xl font-semibold tracking-tight text-slate-950">Welcome back</h2><p className="mt-1.5 text-xs text-slate-500">Sign in with the administrator created during setup.</p>
      {error && <div role="alert" className="mt-5 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}</div>}
      <form onSubmit={submit} className="mt-5 space-y-4">
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Administrator username</span><TextInput autoComplete="username" icon={<UserRound size={15} />} placeholder="Enter your username" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">Password</span><div className="relative"><TextInput autoComplete="current-password" icon={<LockKeyhole size={15} />} type={show ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" /><button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-slate-400 hover:text-slate-700">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></label>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600"><input type="checkbox" checked={keepLoggedIn} onChange={(event) => setKeepLoggedIn(event.target.checked)} className="size-3.5 rounded border-slate-300 accent-teal-700" />Keep me logged in</label>
        <Button type="submit" disabled={loading} className="w-full">{loading ? <><LoaderCircle size={17} className="animate-spin" />Signing in…</> : <>Sign in<ChevronRight size={17} /></>}</Button>
      </form>
      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500"><LockKeyhole size={14} />Your session is encrypted and expires automatically.</div>
    </div></div>
  </main>
}

function Sidebar({ page, onPage, open, collapsed, onClose, onToggle }: { page: Page; onPage: (p: Page) => void; open: boolean; collapsed: boolean; onClose: () => void; onToggle: () => void }) {
  const items = [{ id: 'dashboard' as Page, label: 'Dashboard', icon: Gauge }, { id: 'missed' as Page, label: 'Missed Check-Out', icon: BedDouble }, { id: 'comments' as Page, label: "Yesterday's Comments", icon: MessageSquareText }]
  return <><div onClick={onClose} className={`fixed inset-0 z-30 bg-slate-950/50 lg:hidden ${open ? 'block' : 'hidden'}`} /><aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-slate-900 text-white transition-[width,transform] duration-200 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 ${collapsed ? 'lg:w-12' : 'lg:w-60'}`}>
    <div className={`flex h-14 items-center border-b border-white/10 px-3 ${collapsed ? 'lg:justify-center lg:px-0' : 'justify-between'}`}><div className={collapsed ? 'lg:hidden' : ''}><Logo /></div><button onClick={onToggle} className="hidden size-8 place-items-center rounded-sm text-slate-400 hover:bg-white/10 hover:text-white lg:grid" aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'} title={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button><button onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-white/10 lg:hidden" aria-label="Close menu"><X size={17} /></button></div>
    <nav className={`flex-1 px-3 py-5 ${collapsed ? 'lg:hidden' : ''}`}><p className="mb-2 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">Workspace</p><div className="space-y-1">{items.map((item) => <button key={item.id} onClick={() => { onPage(item.id); onClose() }} className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs font-medium transition ${page === item.id ? 'bg-teal-700 text-white' : 'text-slate-400 hover:bg-white/[.06] hover:text-white'}`}><item.icon size={16} />{item.label}</button>)}</div><p className="mb-2 mt-6 px-3 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">System</p><button onClick={() => { onPage('settings'); onClose() }} className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium ${page === 'settings' ? 'bg-teal-700 text-white' : 'text-slate-400 hover:bg-white/[.06] hover:text-white'}`}><Settings size={16} />Settings</button></nav>
    <div className={`m-3 rounded-md border border-white/10 bg-white/[.04] p-3 ${collapsed ? 'lg:hidden' : ''}`}><div className="flex items-center gap-2 text-xs font-semibold text-emerald-400"><span className="size-2 rounded-full bg-emerald-400" />SQL Server online</div><p className="mt-1.5 text-[11px] text-slate-500">FOApp · Local instance</p></div>
  </aside></>
}

function Header({ onMenu, onLogout, username }: { onMenu: () => void; onLogout: () => void; username: string }) {
  const [now, setNow] = useState(new Date())
  const [menu, setMenu] = useState(false)
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(timer) }, [])
  return <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-300 bg-white px-4 lg:px-5">
    <div className="flex items-center gap-3"><button onClick={onMenu} className="rounded-sm border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={17} /></button><div><p className="text-sm font-semibold text-slate-950">Operations Report</p><div className="mt-1 flex items-center gap-2 text-xs text-slate-500"><CalendarDays size={13} />{now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div></div></div>
    <div className="flex items-center gap-2"><button className="relative rounded-lg p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Notifications"><Bell size={19} /></button><div className="relative"><button onClick={() => setMenu(!menu)} className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100"><span className="grid size-8 place-items-center rounded-lg bg-slate-900 text-xs font-bold text-white">{username.slice(0, 2).toUpperCase()}</span><span className="hidden text-left sm:block"><span className="block max-w-36 truncate text-xs font-semibold text-slate-800">{username}</span><span className="block text-[10px] text-slate-500">Administrator</span></span><ChevronDown size={14} /></button>{menu && <div className="absolute right-0 top-12 w-48 rounded-md border border-slate-200 bg-white p-1.5 shadow-md"><button onClick={onLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-700 hover:bg-red-50"><LogOut size={16} />Sign out</button></div>}</div></div>
  </header>
}

function Dashboard() {
  const [activity, setActivity] = useState<Array<{ id: string; report: string; rowCount: number; durationMs: number; executedAt: string }>>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api<{ items: typeof activity }>('/api/activity')
      .then((result) => setActivity(result.items))
      .finally(() => setLoading(false))
  }, [])
  return <div className="space-y-4"><div><p className="text-[11px] font-semibold text-teal-700">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p><h1 className="mt-0.5 text-lg font-semibold text-slate-950">Operations dashboard</h1><p className="mt-1 text-xs text-slate-500">Review real report activity from the current local server session.</p></div>
    <section className="rounded-sm border border-slate-300 bg-white"><div className="border-b border-slate-300 bg-slate-50 px-4 py-3"><h2 className="text-sm font-semibold text-slate-900">Recent report activity</h2><p className="mt-0.5 text-[11px] text-slate-500">Latest successful executions from this server process</p></div>{loading ? <div className="p-6 text-center text-xs text-slate-500">Loading activity…</div> : activity.length === 0 ? <div className="p-8 text-center"><FileText size={20} className="mx-auto text-slate-400" /><p className="mt-2 text-xs font-semibold text-slate-700">No reports have been run yet</p><p className="mt-1 text-[11px] text-slate-500">Run either report to create activity.</p></div> : <div className="divide-y divide-slate-200">{activity.map((item) => <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_180px_100px_80px]"><div className="flex min-w-0 items-center gap-2.5"><span className="grid size-8 place-items-center rounded-sm bg-teal-50 text-teal-700"><FileText size={15} /></span><p className="text-xs font-semibold text-slate-800">{item.report === 'missed-checkout' ? 'Missed Check-Out' : "Yesterday's Comments"}</p></div><p className="hidden text-xs text-slate-500 sm:block">{new Date(item.executedAt).toLocaleString()}</p><p className="hidden text-xs font-medium text-slate-700 sm:block">{item.rowCount} rows</p><Status>{(item.durationMs / 1000).toFixed(1)}s</Status></div>)}</div>}</section>
  </div>
}

function Summary({ label, value, icon, green = false }: { label: string; value: string; icon: ReactNode; green?: boolean }) {
  return <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-3"><span className={`grid size-8 place-items-center rounded-md ${green ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{icon}</span><div className="min-w-0"><p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 truncate text-xs font-semibold text-slate-800">{value}</p></div></div>
}

function ReportPage({ kind, csrf, onUnauthorized }: { kind: 'missed' | 'comments'; csrf: string; onUnauthorized: () => void }) {
  const comments = kind === 'comments'
  const columns = comments ? commentColumns : missedColumns
  const [status, setStatus] = useState<ReportStatus>('idle')
  const [rows, setRows] = useState<Row[]>([])
  const [executionId, setExecutionId] = useState('')
  const [execution, setExecution] = useState<{ durationMs: number; executedAt: string } | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'room', direction: 'asc' as 'asc' | 'desc' })
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(5)
  const [comment, setComment] = useState<Row | null>(null)
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useState('')
  const run = async () => {
    setStatus('loading')
    try {
      const report = comments ? 'yesterdays-comments' : 'missed-checkout'
      const result = await api<ReportResponse>(`/api/reports/${report}/run`, {
        method: 'POST',
        headers: { 'x-csrf-token': csrf },
        body: JSON.stringify({}),
      })
      setRows(result.rows)
      setExecutionId(result.id)
      setExecution({ durationMs: result.durationMs, executedAt: result.executedAt })
      setStatus('success')
      setToast(`${result.rowCount} records returned successfully`)
      window.setTimeout(() => setToast(''), 3000)
    } catch (reportError) {
      if (reportError instanceof ApiError && reportError.status === 401) onUnauthorized()
      setStatus('error')
      setToast(reportError instanceof Error ? reportError.message : 'Report execution failed.')
    }
  }
  const filtered = useMemo(() => rows.filter((row) => Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(query.toLowerCase()))).sort((a, b) => String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), undefined, { numeric: true }) * (sort.direction === 'asc' ? 1 : -1)), [rows, query, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / size))
  const visible = filtered.slice((page - 1) * size, page * size)
  const sortBy = (key: string) => setSort((s) => ({ key, direction: s.key === key && s.direction === 'asc' ? 'desc' : 'asc' }))
  async function download(format: 'csv' | 'xlsx') {
    try {
      const report = comments ? 'yesterdays-comments' : 'missed-checkout'
      const response = await fetch(`/api/reports/${report}/export`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({ executionId, format }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: { message?: string } } | null
        throw new ApiError(body?.error?.message ?? 'Export failed.', response.status)
      }
      const disposition = response.headers.get('content-disposition') ?? ''
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `report.${format}`
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      URL.revokeObjectURL(url)
      setExportOpen(false)
      setToast(`${format.toUpperCase()} prepared with all ${rows.length} records`)
    } catch (exportError) {
      if (exportError instanceof ApiError && exportError.status === 401) onUnauthorized()
      setToast(exportError instanceof Error ? exportError.message : 'Export failed.')
    }
  }
  return <div className="space-y-5">
    {toast && <div className="fixed right-5 top-24 z-50 flex items-center gap-3 rounded-md border border-emerald-200 bg-white px-4 py-3 text-sm font-medium shadow-md"><span className="grid size-7 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Check size={16} /></span>{toast}<button onClick={() => setToast('')}><X size={16} /></button></div>}
    <div><div className="flex items-center gap-2 text-[11px] text-slate-500">Reports<ChevronRight size={12} /><span className="text-slate-700">{comments ? "Yesterday's Comments" : 'Missed Check-Out'}</span></div><div className="mt-3 max-w-3xl"><h1 className="text-lg font-semibold text-slate-950">{comments ? "Yesterday's Comments Report" : 'Missed Check-Out Report'}</h1><p className="mt-1 text-xs leading-5 text-slate-500">{comments ? 'Review comments recorded yesterday for currently occupied rooms, together with stay, guest-service, and submission information.' : 'Find guests whose stay records indicate an overdue departure and whose profile IDs are missing from the latest arrival CSV file.'}</p><Button className="mt-2.5 h-8 px-2.5" onClick={run} disabled={status === 'loading'}>{status === 'loading' ? <><LoaderCircle size={13} className="animate-spin" />Running…</> : <><Play size={13} fill="currentColor" />Run report</>}</Button></div></div>
    <div className="grid gap-3 sm:grid-cols-3"><Summary label="Execution status" value={status === 'success' ? 'Completed' : status === 'loading' ? 'Running' : status === 'error' ? 'Failed' : 'Ready to run'} icon={status === 'success' ? <CheckCircle2 size={18} /> : <Activity size={18} />} green={status === 'success'} /><Summary label="Results" value={status === 'success' ? `${rows.length} records` : '—'} icon={<FileText size={18} />} /><Summary label="Last execution" value={execution ? `${new Date(execution.executedAt).toLocaleString()} · ${(execution.durationMs / 1000).toFixed(1)}s` : 'Not run in this session'} icon={<Clock3 size={18} />} /></div>
    {status === 'idle' && <EmptyReport comments={comments} />}
    {status === 'loading' && <LoadingTable />}
    {status === 'error' && <ErrorReport onRetry={run} />}
    {status === 'success' && <section className="overflow-hidden rounded-sm border border-slate-300 bg-white">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-300 bg-slate-50 p-3 lg:flex-row"><div className="w-full max-w-md"><TextInput icon={<Search size={15} />} placeholder="Search across all displayed fields…" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1) }} /></div><div className="flex gap-2"><Button variant="secondary"><Columns3 size={14} />Columns<ChevronDown size={13} /></Button><div className="relative"><Button variant="secondary" onClick={() => setExportOpen(!exportOpen)}><Download size={14} />Export all<ChevronDown size={13} /></Button>{exportOpen && <div className="absolute right-0 top-10 z-20 w-60 rounded-sm border border-slate-300 bg-white p-1 shadow-md"><button onClick={() => download('csv')} className="flex w-full gap-2.5 rounded-sm p-2.5 text-left hover:bg-slate-50"><FileText size={16} className="text-teal-700" /><span><strong className="block text-xs">Download CSV</strong><small className="text-[11px] text-slate-500">All {rows.length} rows · UTF-8</small></span></button><button onClick={() => download('xlsx')} className="flex w-full gap-2.5 rounded-sm p-2.5 text-left hover:bg-slate-50"><FileSpreadsheet size={16} className="text-emerald-700" /><span><strong className="block text-xs">Download Excel</strong><small className="text-[11px] text-slate-500">Formatted .xlsx workbook</small></span></button></div>}</div></div></div>
      {filtered.length ? <><div className="overflow-x-auto"><table className="w-full min-w-max text-left"><thead><tr className="bg-slate-50">{columns.map((c) => <th key={c.key} className={`whitespace-nowrap border-b border-slate-200 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 ${c.key === 'comment' ? 'min-w-80' : ''}`}><button onClick={() => sortBy(c.key)} className="flex items-center gap-1.5 hover:text-slate-800">{c.label}{sort.key === c.key ? (sort.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} className="opacity-50" />}</button></th>)}</tr></thead><tbody>{visible.map((row, i) => <tr key={`${row.room}-${i}`} className="border-b border-slate-100 hover:bg-teal-50/30">{columns.map((c) => <td key={c.key} className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-650">{c.key === 'room' ? <strong className="text-slate-900">{row[c.key]}</strong> : c.key === 'comment' ? <div className="flex max-w-sm items-center gap-2"><span className="truncate">{row.comment}</span><button onClick={() => setComment(row)} className="shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-50">View</button></div> : row[c.key] || <span className="text-slate-400">—</span>}</td>)}</tr>)}</tbody></table></div><TableFooter page={page} pages={pages} size={size} count={filtered.length} onPage={setPage} onSize={(n) => { setSize(n); setPage(1) }} /></> : <SearchEmpty onClear={() => setQuery('')} />}
    </section>}
    {comment && <CommentModal row={comment} onClose={() => setComment(null)} />}
  </div>
}

function EmptyReport({ comments }: { comments: boolean }) {
  return <section className="grid min-h-[220px] place-items-center rounded-sm border border-slate-300 bg-white p-5 text-center"><div className="max-w-md"><span className="mx-auto grid size-9 place-items-center rounded-sm border border-teal-200 bg-teal-50 text-teal-700">{comments ? <MessageSquareText size={18} /> : <BedDouble size={18} />}</span><h2 className="mt-3 text-xs font-semibold text-slate-900">Ready to run this report</h2><p className="mt-1 text-xs leading-5 text-slate-500">Results are retrieved securely from SQL Server only when requested. No guest information is displayed until execution completes.</p><p className="mt-2 text-[11px] text-slate-400">Use Run report above. Most reports complete in under 30 seconds.</p></div></section>
}
function LoadingTable() {
  return <section className="rounded-md border border-slate-200 bg-white p-4"><div className="mb-4 flex items-center gap-3 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-800"><LoaderCircle size={18} className="animate-spin" /><strong>Running SQL report…</strong> This may take a few moments.</div>{Array.from({ length: 7 }).map((_, i) => <div key={i} className="flex gap-4 border-b border-slate-100 py-4">{Array.from({ length: 5 }).map((__, j) => <div key={j} className="h-4 flex-1 animate-pulse rounded bg-slate-100" />)}</div>)}</section>
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
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-xl overflow-hidden rounded-md bg-white shadow-lg"><div className="flex justify-between border-b border-slate-300 bg-slate-50 px-4 py-3"><div><p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">Guest comment</p><h2 className="mt-0.5 text-base font-semibold">Room {row.room}</h2></div><button onClick={onClose} className="rounded-sm p-1.5 hover:bg-slate-200"><X size={16} /></button></div><div className="p-4"><div className="flex gap-2"><Status tone="info">{row.type}</Status><Status tone="neutral">{row.confirmation}</Status></div><blockquote className="mt-4 rounded-sm border-l-4 border-teal-600 bg-slate-50 p-4 text-xs leading-5 text-slate-700">“{row.comment}”</blockquote><dl className="mt-4 grid gap-3 sm:grid-cols-2"><Info label="Submitted by" value={row.commentBy} /><Info label="Submitted" value={row.submitted} /><Info label="Guest service agent" value={row.gsa} /><Info label="Stay dates" value={`${row.arrival} — ${row.departure}`} /></dl></div><div className="flex justify-end border-t border-slate-300 bg-slate-50 px-4 py-3"><Button variant="secondary" onClick={onClose}>Close</Button></div></div></div>
}

function Info({ label, value }: { label: string; value: string | null }) {
  return <div><dt className="text-xs font-semibold text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-slate-800">{value ?? '—'}</dd></div>
}

function SettingsPage({ auth, onAuthChange, onLogout }: { auth: AuthState; onAuthChange: (auth: AuthState) => void; onLogout: () => void }) {
  const [testing, setTesting] = useState('')
  const [status, setStatus] = useState<{ database: { server: string; port: number; database: string }; arrivalFile: { path: string }; version: string } | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<typeof status>('/api/settings/status').then(setStatus).catch(() => setMessage('Could not load settings status.'))
  }, [])

  async function test(type: 'db' | 'file') {
    setTesting(type)
    setMessage('')
    try {
      const path = type === 'db' ? '/api/settings/test-database' : '/api/settings/test-arrival-file'
      await api(path, { method: 'POST', headers: { 'x-csrf-token': auth.csrf }, body: JSON.stringify({}) })
      setMessage(type === 'db' ? 'Database connection succeeded.' : 'SQL Server can read the arrival file.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Test failed.')
    } finally {
      setTesting('')
    }
  }

  async function saveCredentials(event: React.FormEvent) {
    event.preventDefault()
    setMessage('')
    if (!newUsername && !newPassword) return setMessage('Enter a new username or password.')
    if (newPassword && newPassword.length < 12) return setMessage('New password must contain at least 12 characters.')
    if (newPassword !== confirmPassword) return setMessage('New passwords do not match.')
    setSaving(true)
    try {
      const result = await api<{ user: { username: string }; csrf: string }>('/api/settings/credentials', {
        method: 'POST',
        headers: { 'x-csrf-token': auth.csrf },
        body: JSON.stringify({
          currentPassword,
          ...(newUsername ? { newUsername } : {}),
          ...(newPassword ? { newPassword } : {}),
        }),
      })
      onAuthChange({ username: result.user.username, csrf: result.csrf })
      setCurrentPassword('')
      setNewUsername('')
      setNewPassword('')
      setConfirmPassword('')
      setMessage('Administrator credentials updated successfully.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not update credentials.')
    } finally {
      setSaving(false)
    }
  }

  return <div className="space-y-4"><div><div className="flex items-center gap-2 text-[11px] text-slate-500">System<ChevronRight size={12} /><span className="text-slate-700">Settings</span></div><h1 className="mt-2 text-lg font-semibold">Settings & status</h1><p className="mt-1 text-xs text-slate-500">Review real local connectivity and securely change administrator credentials.</p></div>
    {message && <div className="rounded-sm border border-slate-300 bg-white px-4 py-3 text-xs text-slate-700">{message}</div>}
    <section className="grid gap-4 xl:grid-cols-2"><SettingsCard icon={<Database size={17} />} title="Database connection" description="Connection details are read from the local .env file."><Setting label="Server" value={status ? `${status.database.server}:${status.database.port}` : 'Loading…'} /><Setting label="Database" value={status?.database.database ?? 'Loading…'} /><Setting label="Authentication" value="SQL Server username/password" /><Button variant="secondary" onClick={() => test('db')} className="mt-4" disabled={testing !== ''}>{testing === 'db' ? <LoaderCircle size={14} className="animate-spin" /> : <Activity size={14} />}Test connection</Button></SettingsCard><SettingsCard icon={<FileDown size={17} />} title="Arrival data file" description="This test is performed by SQL Server, not the browser."><Setting label="Path" value={status?.arrivalFile.path ?? 'Loading…'} /><Setting label="Access identity" value="SQL Server service account" /><Button variant="secondary" onClick={() => test('file')} className="mt-4" disabled={testing !== ''}>{testing === 'file' ? <LoaderCircle size={14} className="animate-spin" /> : <FileText size={14} />}Test file access</Button></SettingsCard></section>
    <section className="rounded-sm border border-slate-300 bg-white"><div className="border-b border-slate-300 bg-slate-50 px-4 py-3"><h2 className="text-sm font-semibold">Change administrator credentials</h2><p className="mt-0.5 text-[11px] text-slate-500">Enter the current password, then provide a new username, password, or both.</p></div><form onSubmit={saveCredentials} className="grid gap-4 p-4 md:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold">Current password</span><TextInput type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold">New username</span><TextInput value={newUsername} onChange={(event) => setNewUsername(event.target.value)} placeholder={auth.username} /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold">New password</span><TextInput type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Minimum 12 characters" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold">Confirm new password</span><TextInput type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label><div className="md:col-span-2"><Button type="submit" disabled={saving}>{saving ? <LoaderCircle size={14} className="animate-spin" /> : <ShieldCheck size={14} />}Update credentials</Button></div></form></section>
    <section className="rounded-sm border border-slate-300 bg-white"><div className="border-b border-slate-300 bg-slate-50 px-4 py-3"><h2 className="text-sm font-semibold">Application & session</h2></div><div className="grid md:grid-cols-2"><div className="space-y-3 p-4 md:border-r"><Setting label="Application version" value={status?.version ?? '1.0.0'} /><Setting label="Environment" value="Local installation" /><Setting label="API binding" value="127.0.0.1 only" /></div><div className="space-y-3 border-t p-4 md:border-t-0"><Setting label="Signed in as" value={auth.username} /><Setting label="Session protection" value="HTTP-only signed cookie" /></div></div><div className="flex flex-col justify-between gap-3 border-t bg-slate-50 px-4 py-3 sm:flex-row sm:items-center"><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} className="text-emerald-600" />Authenticated local session</div><Button variant="danger" onClick={onLogout}><LogOut size={14} />Sign out</Button></div></section>
    <div className="flex gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-xs text-blue-800"><CircleHelp size={17} className="shrink-0" /><p><strong>Database credentials are not editable in the browser.</strong> Change them in the local `.env` file and restart the application.</p></div>
  </div>
}
function SettingsCard({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <article className="rounded-sm border border-slate-300 bg-white p-4"><div className="flex justify-between gap-3"><div className="flex gap-2.5"><span className="grid size-8 place-items-center rounded-sm border border-teal-200 bg-teal-50 text-teal-700">{icon}</span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</p></div></div><Status>Connected</Status></div><div className="mt-4 space-y-2.5 border-t border-slate-200 pt-3">{children}</div></article>
}
function Setting({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-5 text-xs"><span className="text-slate-500">{label}</span><span className="break-all text-right font-medium text-slate-800">{value}</span></div>
}

export function OperationsReportApp() {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebar, setSidebar] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    api<{ user: { username: string }; csrf: string }>('/api/auth/me')
      .then((result) => setAuth({ username: result.user.username, csrf: result.csrf }))
      .catch(() => setAuth(null))
      .finally(() => setCheckingSession(false))
  }, [])

  const login = async (username: string, password: string, keepLoggedIn: boolean) => {
    const result = await api<{ user: { username: string }; csrf: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, keepLoggedIn }),
    })
    setAuth({ username: result.user.username, csrf: result.csrf })
  }

  const logout = async () => {
    if (auth) {
      await api('/api/auth/logout', {
        method: 'POST',
        headers: { 'x-csrf-token': auth.csrf },
        body: JSON.stringify({}),
      }).catch(() => undefined)
    }
    setAuth(null)
    setPage('dashboard')
  }

  if (checkingSession) return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm text-slate-600"><LoaderCircle className="animate-spin" />Checking local session…</div>
  if (!auth) return <Login onLogin={login} />
  const signedOut = () => { setAuth(null); setPage('dashboard') }
  return <div className="min-h-screen bg-slate-100"><Sidebar page={page} onPage={setPage} open={sidebar} collapsed={sidebarCollapsed} onClose={() => setSidebar(false)} onToggle={() => setSidebarCollapsed((value) => !value)} /><div className={`transition-[padding] duration-200 ${sidebarCollapsed ? 'lg:pl-12' : 'lg:pl-60'}`}><Header onMenu={() => setSidebar(true)} onLogout={logout} username={auth.username} /><main className="mx-auto max-w-[1600px] p-4 lg:p-5">{page === 'dashboard' && <Dashboard />}{page === 'missed' && <ReportPage kind="missed" csrf={auth.csrf} onUnauthorized={signedOut} />}{page === 'comments' && <ReportPage kind="comments" csrf={auth.csrf} onUnauthorized={signedOut} />}{page === 'settings' && <SettingsPage auth={auth} onAuthChange={setAuth} onLogout={logout} />}</main></div></div>
}
