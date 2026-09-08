import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';

export default function ManageBooking() {
  const { token } = useParams(); const [appointment, setAppointment] = useState(null); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { api(`/public/appointments/${token}`).then((x) => setAppointment(x.appointment)).catch((e) => setError(e.message)); }, [token]);
  const cancel = async () => { if (!window.confirm('Cancel this appointment?')) return; setBusy(true); try { const x = await api(`/public/appointments/${token}/cancel`, { method: 'POST' }); setAppointment(x.appointment); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  return <div className="min-h-screen bg-slate-100 px-4 py-10"><div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Booking management</p><h1 className="mt-1 text-3xl font-bold">Your appointment</h1>{error && <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}{appointment && <div className="mt-6 space-y-2"><div className="text-xl font-semibold">{appointment.serviceId?.name}</div><div>{appointment.tenantId?.name}</div><div className="text-slate-600">{new Date(appointment.startAt).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' })}</div><div className="pt-2 text-sm">Status: <strong>{appointment.status}</strong></div>{appointment.status === 'CONFIRMED' && <button disabled={busy} onClick={cancel} className="mt-5 w-full rounded-lg bg-red-600 p-3 font-medium text-white disabled:opacity-50">{busy ? 'Cancelling…' : 'Cancel appointment'}</button>}</div>}</div></div>;
}
