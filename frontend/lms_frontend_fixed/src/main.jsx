import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import CrudPage from './pages/CrudPage'
import Notifications from './pages/Notifications'
import Invoices from './pages/Invoices'
import Users from './pages/Users'
import Settings from './pages/Settings'
import ClassSessions from './pages/ClassSessions'
import { resources } from './pages/resources'
import './index.css'

function App(){return <AuthProvider><Routes><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route element={<ProtectedRoute/>}><Route element={<AppLayout/>}><Route path="/" element={<Dashboard/>}/>{Object.entries(resources).map(([key,c])=><Route key={key} path={`/${key}`} element={<ProtectedRoute roles={c.roles}/>}><Route index element={<CrudPage config={c}/>} /></Route>)}<Route path="/class-sessions" element={<ProtectedRoute roles={['admin','staff','teacher','student']}/>}><Route index element={<ClassSessions/>}/></Route><Route path="/notifications" element={<Notifications/>}/><Route path="/invoices" element={<ProtectedRoute roles={['admin','staff','student']}/>}><Route index element={<Invoices/>}/></Route><Route path="/users" element={<ProtectedRoute roles={['admin']}/>}><Route index element={<Users/>}/></Route><Route path="/settings" element={<ProtectedRoute roles={['admin']}/>}><Route index element={<Settings/>}/></Route></Route></Route></Routes></AuthProvider>}

createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>)
