import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { ChevronLeft, ChevronRight, MoreVertical, Search } from 'lucide-react'
import type { MRVStatus, ProjectStatus } from '../types'
import { AppShell, AuthenticatedAppLayout } from './layout'

export { AppShell, AuthenticatedAppLayout }


export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} title={label} className="rounded p-2 text-forest transition hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-forest" {...props}>{children}</button>
}
export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: ReactNode }) {
  return <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold tracking-tight text-forest-deep">{title}</h1><p className="mt-1 text-sm text-stone-600">{description}</p></div>{actions}</header>
}
export function MetricCard({ label, value, tone = 'default' }: { label: string; value: string | number; tone?: 'default' | 'danger' | 'success' }) {
  const colour = tone === 'danger' ? 'text-danger' : tone === 'success' ? 'text-success' : 'text-forest-deep'
  return <section className="rounded border border-stone-300 bg-white p-5"><p className="text-xs font-bold uppercase tracking-wider text-stone-600">{label}</p><p className={`mt-8 text-4xl font-bold ${colour}`}>{value}</p></section>
}
export function StatusBadge({ status }: { status: MRVStatus | ProjectStatus | 'Active' | 'Inactive' | 'Pending' }) {
  const styles: Record<string, string> = { Active: 'bg-emerald-50 text-success border-emerald-200', Approved: 'bg-emerald-50 text-success border-emerald-200', Validated: 'bg-stone-100 text-forest border-stone-300', Submitted: 'bg-stone-100 text-forest border-stone-300', Draft: 'bg-stone-100 text-stone-700 border-stone-300', 'Under Review': 'bg-amber-50 text-warning border-amber-200', Pending: 'bg-amber-50 text-warning border-amber-200', Inactive: 'bg-stone-100 text-stone-600 border-stone-300', 'Validation Failed': 'bg-red-50 text-danger border-red-200' }
  return <span className={`inline-flex items-center rounded border px-2 py-1 text-xs font-bold ${styles[status]}`}>{status}</span>
}
export function SearchField({ placeholder = 'Search...' }: { placeholder?: string }) { return <label className="relative block"><span className="sr-only">{placeholder}</span><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" /><input className="w-full rounded border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20" placeholder={placeholder} /></label> }
export function FilterBar({ children }: { children: ReactNode }) { return <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{children}</div> }
export function DataTable({ children }: { children: ReactNode }) { return <div className="overflow-x-auto rounded border border-stone-300 bg-white"><table className="w-full min-w-[720px] text-left text-sm">{children}</table></div> }
export function Pagination({ total, label = 'entries' }: { total: number; label?: string }) { return <div className="flex flex-col gap-3 border-x border-b border-stone-300 bg-white px-3 py-3 text-sm text-stone-600 sm:flex-row sm:items-center sm:justify-between"><span>Showing 1 to 3 of {total} {label}</span><div className="flex gap-1"><button disabled className="rounded border border-stone-300 p-1 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={18} /></button><button className="rounded bg-forest px-3 py-1 font-bold text-white">1</button><button className="rounded border border-stone-300 px-3 py-1">2</button><button className="rounded border border-stone-300 px-3 py-1">3</button><button className="rounded border border-stone-300 p-1" aria-label="Next page"><ChevronRight size={18} /></button></div></div> }
export function ActionMenu() { return <IconButton label="More options"><MoreVertical size={18} /></IconButton> }
export function EmptyState({ title = 'Coming Soon', description = 'Module Under Development' }: { title?: string; description?: string }) { return <section className="rounded border border-dashed border-stone-300 bg-white p-10 text-center"><h1 className="text-2xl font-bold text-forest-deep">{title}</h1><p className="mt-2 text-stone-600">{description}</p><span className="mt-4 inline-block rounded bg-stone-100 px-3 py-1 text-xs font-bold text-stone-700">DEMO FRONTEND</span></section> }
