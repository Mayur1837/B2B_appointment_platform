import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('Owner@12345');
  const [error, setError] = useState('');
  const [businesses, setBusinesses] = useState([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);
  const [selectedService, setSelectedService] = useState({});

  useEffect(() => {
    api('/public/businesses').then((x) => setBusinesses(x.businesses || [])).catch(() => {}).finally(() => setLoadingBusinesses(false));
  }, []);
  useEffect(() => { if (user) nav(user.role === 'SYSTEM_OWNER' ? '/owner' : user.role === 'BUSINESS_ADMIN' ? '/admin' : '/customer-appointments'); }, [user, nav]);

  const submit = async (e) => {
    e.preventDefault(); setError('');
    try { const x = await login(email, password); if (x.user.role === 'CUSTOMER') throw new Error('Customer accounts use Customer sign in to manage bookings.'); }
    catch (x) { setError(x.message); }
  };

  return <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-10 border-b bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"><div><div className="text-xl font-bold tracking-tight">BookFlow</div><div className="text-xs text-slate-500">Business appointments, made simple</div></div><Link to="/customer-login" className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Customer sign in</Link></div></header>
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <section className="max-w-3xl"><span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">Public booking directory</span><h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Choose a business, then choose its service.</h1><p className="mt-4 text-base leading-7 text-slate-600">Browsing is completely public. No account is needed to explore businesses, services, dates, or available times. Sign in only when you're ready to confirm a booking.</p></section>
      <section className="mt-8">{loadingBusinesses ? <div className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm ring-1 ring-slate-200">Loading available businesses…</div> : businesses.length === 0 ? <div className="rounded-2xl bg-white p-6 text-slate-500 shadow-sm ring-1 ring-slate-200">No active businesses are available for public booking yet.</div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{businesses.map((b) => { const selected = selectedService[b._id] || b.services[0]?._id || ''; return <article key={b._id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{b.name}</h2>{b.phone && <p className="mt-1 text-xs text-slate-500">{b.phone}</p>}</div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Available</span></div><label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Service<select className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm" value={selected} onChange={(e) => setSelectedService((v) => ({ ...v, [b._id]: e.target.value }))} disabled={!b.services.length}>{b.services.length ? b.services.map((s) => <option key={s._id} value={s._id}>{s.name} · {s.durationMinutes} min</option>) : <option>No active services</option>}</select></label><Link to={selected ? `/book/${b.slug}?serviceId=${selected}` : `/book/${b.slug}`} className="mt-4 block rounded-xl bg-slate-950 p-3 text-center text-sm font-semibold text-white hover:bg-slate-800">View dates & times</Link></article>; })}</div>}</section>
      <section className="mt-12 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start"><div className="rounded-2xl bg-slate-950 p-7 text-white"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Returning customers</p><h2 className="mt-2 text-2xl font-bold">Your bookings stay with your account.</h2><p className="mt-3 text-sm leading-6 text-slate-300">After you sign in, you'll be able to see your upcoming and past appointments across the businesses you've booked with, and cancel eligible appointments.</p><Link to="/customer-login" className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950">View my appointments</Link></div><form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform access</p><h2 className="mt-1 text-xl font-bold">System Owner / Business Admin</h2>{error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<label className="mt-5 block text-sm font-medium">Email<input required type="email" className="mt-2 w-full rounded-xl border p-3 font-normal" value={email} onChange={(e) => setEmail(e.target.value)} /></label><label className="mt-4 block text-sm font-medium">Password<input required type="password" className="mt-2 w-full rounded-xl border p-3 font-normal" value={password} onChange={(e) => setPassword(e.target.value)} /></label><button className="mt-5 w-full rounded-xl bg-slate-950 p-3.5 font-semibold text-white hover:bg-slate-800">Sign in</button></form></section>
    </main>
  </div>;
}
