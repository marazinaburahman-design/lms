import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

export function Button({ children, variant = 'primary', loading = false, className = '', ...props }) {
  const styles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    ghost: 'text-slate-600 hover:bg-slate-100',
  }
  return <button disabled={loading || props.disabled} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`} {...props}>{loading ? 'Please wait…' : children}</button>
}

export function Card({ children, className = '' }) { return <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div> }

export function Input({ label, className = '', ...props }) { return <label className="block text-sm font-medium text-slate-700">{label && <span className="mb-1.5 block">{label}</span>}<input className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${className}`} {...props} /></label> }

export function Select({ label, children, className = '', ...props }) { return <label className="block text-sm font-medium text-slate-700">{label && <span className="mb-1.5 block">{label}</span>}<select className={`w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${className}`} {...props}>{children}</select></label> }

export function Textarea({ label, className = '', ...props }) { return <label className="block text-sm font-medium text-slate-700">{label && <span className="mb-1.5 block">{label}</span>}<textarea className={`min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 ${className}`} {...props} /></label> }

export function Badge({ children, tone = 'slate' }) { const styles = { green:'bg-emerald-50 text-emerald-700', red:'bg-rose-50 text-rose-700', yellow:'bg-amber-50 text-amber-700', blue:'bg-sky-50 text-sky-700', indigo:'bg-indigo-50 text-indigo-700', slate:'bg-slate-100 text-slate-600' }; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[tone] || styles.slate}`}>{children}</span> }

export function Modal({ open, onClose, title, children, wide = false }) { return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} onMouseDown={onClose}><motion.div className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-2xl'}`} initial={{ opacity:0, y:20, scale:.98 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:10, scale:.98 }} onMouseDown={(e) => e.stopPropagation()}><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18}/></button></div>{children}</motion.div></motion.div>}</AnimatePresence> }

export function Empty({ label='No records found.' }) { return <div className="p-10 text-center text-sm text-slate-400">{label}</div> }

export function SearchBox({ value, onChange, placeholder='Search…' }) { return <input value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"/> }

export function Toast({ message, onClose }) { return <AnimatePresence>{message && <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="fixed right-4 top-20 z-[60] flex max-w-sm items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">{message}<button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16}/></button></motion.div>}</AnimatePresence> }
