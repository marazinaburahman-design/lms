import { useEffect, useState } from 'react'
import { Bell, CheckCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { io } from 'socket.io-client'
import api, { getError } from '../services/api'
import { Badge, Button, Card, Empty } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function Notifications(){
  const {user}=useAuth(); const [items,setItems]=useState([]); const [unread,setUnread]=useState(0); const [error,setError]=useState('')
  const load=()=>api.get('/notifications?limit=50').then(r=>{setItems(r.data.notifications||[]);setUnread(r.data.unreadCount||0)}).catch(e=>setError(getError(e)))
  useEffect(()=>{load();const url=import.meta.env.VITE_SOCKET_URL||'http://localhost:5000';const token=localStorage.getItem('lms_token');const socket=io(url,{auth:{token},transports:['websocket','polling']});socket.on('notification:new',n=>{setItems(x=>[n,...x]);setUnread(x=>x+1)});return()=>socket.disconnect()},[user.id,user.role])
  const read=async id=>{try{await api.patch(`/notifications/${id}/read`);setItems(x=>x.map(n=>n._id===id?{...n,read:true}:n));setUnread(x=>Math.max(0,x-1))}catch(e){setError(getError(e))}}
  const readAll=async()=>{try{await api.patch('/notifications/read-all');setItems(x=>x.map(n=>({...n,read:true})));setUnread(0)}catch(e){setError(getError(e))}}
  return <div className="space-y-5"><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-indigo-600">Updates</p><h1 className="mt-1 text-2xl font-black">Notifications</h1><p className="mt-1 text-sm text-slate-500">Approval and system notifications from your backend.</p></div>{unread>0&&<Button variant="secondary" onClick={readAll}><CheckCheck size={16}/>Mark all read</Button>}</div>{error&&<Card className="p-4 text-sm text-rose-600">{error}</Card>}<div className="space-y-3">{items.length===0?<Card><Empty label="No notifications."/></Card>:items.map((n,i)=><motion.div key={n._id||i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><Card className={`p-5 ${n.read?'':'border-indigo-200 bg-indigo-50/30'}`}><div className="flex gap-4"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600"><Bell size={18}/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-bold">{n.title}</h2><Badge tone={n.read?'slate':'indigo'}>{n.read?'Read':'New'}</Badge></div><p className="mt-1 text-sm text-slate-600">{n.message}</p><div className="mt-3 flex items-center justify-between text-xs text-slate-400"><span>{n.createdAt?new Date(n.createdAt).toLocaleString():''}</span>{!n.read&&<button onClick={()=>read(n._id)} className="font-semibold text-indigo-600 hover:underline">Mark read</button>}</div></div></div></Card></motion.div>)}</div></div>
}
