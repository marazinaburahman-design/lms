import { useEffect, useState } from 'react'
import { CalendarDays, ExternalLink, Send, RefreshCw, Video, Clock3 } from 'lucide-react'
import { motion } from 'framer-motion'
import api, { getError } from '../services/api'
import { Badge, Button, Card, Empty, Toast } from '../components/ui'
import { useAuth } from '../context/AuthContext'

const statusTone = (s) => s ? 'green' : 'yellow'
const prettyDate = (value) => {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })
}
const prettyTime = (value) => {
  if (!value) return '—'
  const [h,m] = value.split(':').map(Number)
  const d = new Date(2000,0,1,h,m || 0)
  return d.toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })
}

export default function ClassSessions(){
  const { user } = useAuth()
  const [sessions,setSessions] = useState([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [toast,setToast] = useState('')
  const [running,setRunning] = useState(false)
  const canSend = ['admin','staff','teacher'].includes(user.role)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/class-sessions'); setSessions(r.data.sessions || []) }
    catch(e){ setError(getError(e)) }
    finally{ setLoading(false) }
  }
  useEffect(()=>{load()},[])

  const sendNow = async (id) => {
    setError('')
    try { await api.post(`/class-sessions/${id}/send-now`); setToast('Class link sent to Telegram'); load() }
    catch(e){ setError(getError(e)) }
  }

  const runDue = async () => {
    setRunning(true); setError('')
    try { const r = await api.post('/class-sessions/run-due'); setToast(`Scheduler checked ${r.data.checked} sessions and sent ${r.data.sent}`); load() }
    catch(e){ setError(getError(e)) }
    finally{ setRunning(false) }
  }

  return <div className="space-y-6">
    <Toast message={toast} onClose={()=>setToast('')}/>
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div><p className="text-sm font-semibold text-indigo-600">Live schedule</p><h1 className="mt-1 text-2xl font-black text-slate-900">Class Sessions</h1><p className="mt-1 text-sm text-slate-500">Sessions are generated automatically from batches.</p></div>
      {canSend && <div className="flex gap-2"><Button variant="secondary" onClick={load}><RefreshCw size={16}/>Refresh</Button><Button loading={running} onClick={runDue}><Send size={16}/>Run due notifications</Button></div>}
    </div>
    {error && <Card className="p-4 text-sm text-rose-600">{error}</Card>}
    {loading ? <Card className="p-10 text-center text-sm text-slate-400">Loading class sessions…</Card> : sessions.length === 0 ? <Card><Empty label="No class sessions yet. Create a batch with dates and a schedule."/></Card> : <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {sessions.map((s,i)=><motion.div key={s._id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*.03}}>
        <Card className="h-full overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/80 p-5">
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">{s.topic}</h2><p className="mt-1 text-sm text-slate-500">{s.course?.name || 'Course'}</p></div><Badge tone={s.cancelled?'red':statusTone(s.linkSent)}>{s.cancelled?'Cancelled':s.linkSent?'Link sent':'Pending'}</Badge></div>
          </div>
          <div className="space-y-3 p-5 text-sm">
            <div className="flex items-center gap-3 text-slate-600"><CalendarDays size={17} className="text-indigo-500"/><span>{prettyDate(s.date)}</span></div>
            <div className="flex items-center gap-3 text-slate-600"><Clock3 size={17} className="text-indigo-500"/><span>{prettyTime(s.startTime)} Colombo</span></div>
            <div className="flex items-center gap-3 text-slate-600"><Video size={17} className="text-indigo-500"/><span>{s.batch?.name || 'Batch'} {s.mentorName ? `· ${s.mentorName}` : ''}</span></div>
            {s.zoomJoinUrl ? <a href={s.zoomJoinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2.5 font-semibold text-indigo-700 hover:bg-indigo-100"><ExternalLink size={16}/>Open Zoom class</a> : <div className="rounded-xl bg-amber-50 p-3 text-amber-700">Zoom link is not configured yet.</div>}
            {canSend && s.zoomJoinUrl && <Button variant="secondary" className="w-full" onClick={()=>sendNow(s._id)}><Send size={16}/>Send to Telegram now</Button>}
          </div>
        </Card>
      </motion.div>)}
    </div>}
  </div>
}
