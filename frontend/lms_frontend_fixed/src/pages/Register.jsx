import { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import api, { getError } from '../services/api'
import { Button, Input } from '../components/ui'

export default function Register(){
  const navigate=useNavigate()
  const [form,setForm]=useState({name:'',email:'',phone:'',password:''})
  const [error,setError]=useState('')
  const [loading,setLoading]=useState(false)

  const submit=async e=>{
    e.preventDefault()
    setError('')
    setLoading(true)
    try{
      await api.post('/auth/register',form)
      navigate('/login',{replace:true})
    }catch(err){
      setError(getError(err))
    }finally{
      setLoading(false)
    }
  }

  return <div className="grid min-h-screen place-items-center bg-slate-950 p-4">
    <motion.div initial={{opacity:0,y:18}} animate={{opacity:1,y:0}} className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
      <div className="mb-7 grid size-12 place-items-center rounded-2xl bg-indigo-600 text-white"><GraduationCap/></div>
      <h1 className="text-3xl font-black text-slate-900">Create student account</h1>
      <p className="mt-2 text-sm text-slate-500">Public registration creates a student account. Admin, staff and teacher accounts should be managed by an administrator.</p>
      {error&&<div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-600">{error}</div>}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Input label="Name" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
        <Input label="Email" type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
        <Input label="Phone" required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
        <Input label="Password" type="password" minLength={6} required value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/>
        <Button loading={loading} className="w-full py-3">Create account</Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link to="/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link></p>
    </motion.div>
  </div>
}
