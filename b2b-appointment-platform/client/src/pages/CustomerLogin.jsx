import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function CustomerLogin() {
  const location = useLocation();
  const nav = useNavigate();
  const { setSession } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const returnTo = new URLSearchParams(location.search).get('returnTo') || '/customer-appointments';

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/customer/register';
      const x = await api(path, { method: 'POST', body: form });
      if (mode === 'login' && x.user.role !== 'CUSTOMER') throw new Error('Please use a customer account to book appointments.');
      setSession(x.token, x.user);
      nav(returnTo);
    } catch (e2) { setError(e2.message); }
  };

  return <div className="min-h-screen bg-slate-100 px-4 py-10"><div className="mx-auto max-w-md"><Link to="/login" className="text-sm font-medium text-slate-600">← Back to public directory</Link><div className="mt-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><p className="text-sm font-semibold text-slate-500">Customer account</p><h1 className="mt-1 text-3xl font-bold">{mode === 'login' ? 'Sign in to book' : 'Create your customer account'}</h1><p className="mt-2 text-sm text-slate-500">You only need an account when you are ready to book.</p>{error && <div className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}<form onSubmit={submit}>{mode === 'register' && <label className="mt-5 block text-sm font-medium">Name<input required className="mt-1 w-full rounded-lg border p-3 font-normal" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>}<label className="mt-5 block text-sm font-medium">Email<input required type="email" className="mt-1 w-full rounded-lg border p-3 font-normal" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}/></label><label className="mt-4 block text-sm font-medium">Password<input required minLength={8} type="password" className="mt-1 w-full rounded-lg border p-3 font-normal" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}/></label><button className="mt-6 w-full rounded-lg bg-slate-900 p-3 font-medium text-white">{mode === 'login' ? 'Continue to booking' : 'Create account & continue'}</button></form><button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="mt-4 w-full text-sm font-medium text-slate-600">{mode === 'login' ? 'New customer? Create an account' : 'Already have an account? Sign in'}</button></div></div></div>;
}
