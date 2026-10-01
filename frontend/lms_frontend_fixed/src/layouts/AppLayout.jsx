import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, BookOpen, CalendarCheck, ChevronLeft, ChevronRight, GraduationCap, LayoutDashboard, LogOut, Menu, Receipt, Settings, ShieldCheck, UserRound, Users, X } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const nav = [
  { to:'/', label:'Dashboard', icon:LayoutDashboard, roles:['admin','staff','teacher','student'] },
  { to:'/students', label:'Students', icon:GraduationCap, roles:['admin','staff','teacher'] },
  { to:'/teachers', label:'Teachers', icon:Users, roles:['admin','staff'] },
  { to:'/courses', label:'Courses', icon:BookOpen, roles:['admin','staff','teacher','student'] },
  { to:'/batches', label:'Batches', icon:CalendarCheck, roles:['admin','staff','teacher','student'] },
  { to:'/class-sessions', label:'Class Sessions', icon:CalendarCheck, roles:['admin','staff','teacher','student'] },
  { to:'/enrollments', label:'Enrollments', icon:UserRound, roles:['admin','staff','teacher'] },
  { to:'/assignments', label:'Assignments', icon:BookOpen, roles:['admin','staff','teacher','student'] },
  { to:'/attendance', label:'Attendance', icon:CalendarCheck, roles:['admin','staff','teacher','student'] },
  { to:'/grades', label:'Grades', icon:ShieldCheck, roles:['admin','staff','teacher','student'] },
  { to:'/invoices', label:'Invoices', icon:Receipt, roles:['admin','staff'] },
  { to:'/notifications', label:'Notifications', icon:Bell, roles:['admin','staff','teacher','student'] },
  { to:'/users', label:'Users', icon:Users, roles:['admin'] },
  { to:'/settings', label:'Settings', icon:Settings, roles:['admin'] },
]

function Sidebar({ collapsed, items, closeMobile=false }) {
  const { logout } = useAuth(); const navigate = useNavigate()
  return <aside className={`${collapsed ? 'w-[78px]' : 'w-64'} flex h-full flex-col bg-white ${closeMobile ? 'w-72 shadow-2xl' : 'border-r border-slate-200'}`}>
    <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-4"><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white"><GraduationCap size={20}/></div>{!collapsed&&<div><div className="font-bold">LMS Portal</div><div className="text-[10px] uppercase tracking-widest text-slate-400">Learning system</div></div>}</div>
    <nav className="flex-1 space-y-1 overflow-y-auto p-3">{items.map(({to,label,icon:Icon})=><NavLink key={to} to={to} className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive?'bg-indigo-50 text-indigo-700':'text-slate-600 hover:bg-slate-50'} ${collapsed?'justify-center':''}`} title={collapsed?label:''}><Icon size={18}/>{!collapsed&&label}</NavLink>)}</nav>
    <div className="border-t border-slate-100 p-3"><button onClick={()=>{logout();navigate('/login')}} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-rose-50 hover:text-rose-600 ${collapsed?'justify-center':''}`}><LogOut size={18}/>{!collapsed&&'Sign out'}</button></div>
  </aside>
}

export default function AppLayout() {
  const { user } = useAuth(); const [mobile,setMobile]=useState(false); const [collapsed,setCollapsed]=useState(false); const [unread,setUnread]=useState(0)
  const items=nav.filter(x=>x.roles.includes(user.role))
  useEffect(()=>{api.get('/notifications?unread=true&limit=1').then(r=>setUnread(r.data.unreadCount||0)).catch(()=>{})},[])
  return <div className="flex min-h-screen bg-slate-50">
    <div className="hidden lg:block"><Sidebar collapsed={collapsed} items={items}/></div>
    <AnimatePresence>{mobile&&<motion.div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setMobile(false)}><motion.div className="h-full w-72" initial={{x:-300}} animate={{x:0}} exit={{x:-300}} onClick={e=>e.stopPropagation()}><Sidebar collapsed={false} items={items} closeMobile/></motion.div></motion.div>}</AnimatePresence>
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-6">
        <div className="flex items-center gap-2"><button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={()=>setMobile(true)}><Menu/></button><button className="hidden rounded-lg p-2 hover:bg-slate-100 lg:block" onClick={()=>setCollapsed(v=>!v)}>{collapsed?<ChevronRight size={19}/>:<ChevronLeft size={19}/>}</button><div className="text-sm text-slate-500">Welcome back, <span className="font-semibold text-slate-800">{user.name}</span></div></div>
        <div className="flex items-center gap-3"><NavLink to="/notifications" className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100"><Bell size={19}/>{unread>0&&<span className="absolute right-1 top-1 size-2 rounded-full bg-rose-500"/>}</NavLink><div className="hidden text-right sm:block"><div className="text-sm font-semibold">{user.name}</div><div className="text-xs capitalize text-slate-400">{user.role}</div></div><div className="grid size-9 place-items-center rounded-xl bg-slate-900 text-sm font-bold text-white">{user.name?.[0]?.toUpperCase()}</div></div>
      </header>
      <div className="p-4 md:p-6"><Outlet/></div>
    </main>
  </div>
}
