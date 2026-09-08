// import { useEffect, useState } from 'react';
// import Layout from '../components/Layout';
// import { api } from '../lib/api';
// import { useAuth } from '../context/AuthContext';

// const emptyForm = { name: '', email: '', phone: '', timezone: 'Asia/Kolkata', adminName: '', adminEmail: '', adminPassword: '' };

// export default function OwnerDashboard() {
//   const { token } = useAuth();
//   const [items, setItems] = useState([]);
//   const [message, setMessage] = useState('');
//   const [form, setForm] = useState(emptyForm);
//   const [busy, setBusy] = useState(false);

//   const load = () => api('/owner/businesses', { token }).then((x) => setItems(x.businesses));
//   useEffect(() => { load().catch((e) => setMessage(e.message)); }, []);
//   const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

//   const create = async (e) => {
//     e.preventDefault(); setMessage(''); setBusy(true);
//     try {
//       const result = await api('/owner/businesses', { method: 'POST', token, body: form });
//       setMessage('Business and Business Admin created successfully.');
//       setForm(emptyForm); await load();
//     } catch (e2) { setMessage(e2.message); } finally { setBusy(false); }
//   };

//   const removeBusiness = async (business) => {
//     if (!window.confirm(`Delete ${business.name}? This permanently removes its services, availability, users and appointments.`)) return;
//     setBusy(true); setMessage('');
//     try { await api(`/owner/businesses/${business._id}`, { method: 'DELETE', token }); await load(); setMessage(`${business.name} was deleted.`); }
//     catch (e) { setMessage(e.message); } finally { setBusy(false); }
//   };

//   return (
//     <Layout>
//       <div className="space-y-8">
//         <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
//           <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Platform administration</p>
//           <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
//             <div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">Business customers</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Onboard and manage the businesses that use your appointment platform.</p></div>
//             <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]"><div className="rounded-2xl bg-white/10 p-3"><div className="text-2xl font-bold">{items.length}</div><div className="text-xs text-slate-400">Total businesses</div></div><div className="rounded-2xl bg-white/10 p-3"><div className="text-2xl font-bold">{items.filter((b) => b.status === 'ACTIVE').length}</div><div className="text-xs text-slate-400">Active</div></div></div>
//           </div>
//         </section>

//         {message && <div className={`rounded-2xl p-4 text-sm font-medium ring-1 ${message.includes('deleted') || message.includes('successfully') ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : 'bg-red-50 text-red-700 ring-red-100'}`}>{message}</div>}

//         <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
//           <form onSubmit={create} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 sm:p-7">
//             <div className="mb-6"><span className="section-kicker">New customer</span><h2 className="section-title">Onboard a business</h2><p className="section-copy">Create the workspace and its first administrator in one step.</p></div>
//             <div className="space-y-4">
//               {[["name","Business name",true],["email","Business email",false],["phone","Phone",false],["timezone","IANA timezone",false],["adminName","Admin name",true],["adminEmail","Admin email",true]].map(([key,label,required]) => <label key={key} className="field-label">{label}<input required={required} className="field-input" value={form[key]} onChange={(e) => update(key,e.target.value)} /></label>)}
//               <label className="field-label">Admin password<input required minLength={8} type="password" className="field-input" value={form.adminPassword} onChange={(e) => update('adminPassword',e.target.value)} placeholder="Minimum 8 characters" /></label>
//             </div>
//             <button disabled={busy} className="mt-6 w-full rounded-xl bg-slate-950 p-3.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50">{busy ? 'Working…' : 'Create business'}</button>

import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  timezone: "Asia/Kolkata",
  adminName: "",
  adminEmail: "",
  adminPassword: "",
};

export default function OwnerDashboard() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api("/owner/businesses", { token }).then((x) => setItems(x.businesses));
  useEffect(() => {
    load().catch((e) => setMessage(e.message));
  }, []);
  const update = (key, value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const create = async (e) => {
    e.preventDefault();
    setMessage("");
    setBusy(true);
    try {
      await api("/owner/businesses", { method: "POST", token, body: form });
      setMessage("Business and Business Admin created successfully.");
      setForm(emptyForm);
      await load();
    } catch (e2) {
      setMessage(e2.message);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (business) => {
    const nextStatus = business.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    const action = nextStatus === "ACTIVE" ? "enable" : "disable";
    if (
      !window.confirm(
        `${action.charAt(0).toUpperCase() + action.slice(1)} ${business.name}?`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await api(`/owner/businesses/${business._id}/status`, {
        method: "PATCH",
        token,
        body: { status: nextStatus },
      });
      await load();
      setMessage(`${business.name} is now ${nextStatus.toLowerCase()}.`);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  const removeBusiness = async (business) => {
    if (
      !window.confirm(
        `Delete ${business.name}? This permanently removes its services, availability, users and appointments.`,
      )
    )
      return;
    setBusy(true);
    setMessage("");
    try {
      await api(`/owner/businesses/${business._id}`, {
        method: "DELETE",
        token,
      });
      await load();
      setMessage(`${business.name} was deleted.`);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Platform administration
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                Business customers
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Onboard and manage the businesses that use your appointment
                platform.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[260px]">
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-2xl font-bold">{items.length}</div>
                <div className="text-xs text-slate-400">Total businesses</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-3">
                <div className="text-2xl font-bold">
                  {items.filter((b) => b.status === "ACTIVE").length}
                </div>
                <div className="text-xs text-slate-400">Active</div>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div
            className={`rounded-2xl p-4 text-sm font-medium ring-1 ${message.includes("deleted") || message.includes("successfully") || message.includes("now active") ? "bg-emerald-50 text-emerald-800 ring-emerald-100" : "bg-red-50 text-red-700 ring-red-100"}`}
          >
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
          <form
            onSubmit={create}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 sm:p-7"
          >
            <div className="mb-6">
              <span className="section-kicker">New customer</span>
              <h2 className="section-title">Onboard a business</h2>
              <p className="section-copy">
                Create the workspace and its first administrator in one step.
              </p>
            </div>
            <div className="space-y-4">
              {[
                ["name", "Business name", true],
                ["email", "Business email", false],
                ["phone", "Phone", false],
                ["timezone", "IANA timezone", false],
                ["adminName", "Admin name", true],
                ["adminEmail", "Admin email", true],
              ].map(([key, label, required]) => (
                <label key={key} className="field-label">
                  {label}
                  <input
                    required={required}
                    className="field-input"
                    value={form[key]}
                    onChange={(e) => update(key, e.target.value)}
                  />
                </label>
              ))}
              <label className="field-label">
                Admin password
                <input
                  required
                  minLength={8}
                  type="password"
                  className="field-input"
                  value={form.adminPassword}
                  onChange={(e) => update("adminPassword", e.target.value)}
                  placeholder="Minimum 8 characters"
                />
              </label>
            </div>
            <button
              disabled={busy}
              className="mt-6 w-full rounded-xl bg-slate-950 p-3.5 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "Working…" : "Create business"}
            </button>
          </form>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 sm:p-7">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <span className="section-kicker">Customer accounts</span>
                <h2 className="section-title">All businesses</h2>
                <p className="section-copy">
                  Enable, disable, or permanently remove a business workspace.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No businesses onboarded yet.
                </div>
              ) : (
                items.map((business) => {
                  const active = business.status === "ACTIVE";
                  return (
                    <article
                      key={business._id}
                      className="rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-bold text-slate-950">
                              {business.name}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                            >
                              {active ? "Active" : "Disabled"}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-slate-500">
                            {business.email || "No business email provided"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Timezone: {business.timezone || "Asia/Kolkata"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={busy}
                            onClick={() => setStatus(business)}
                            className={`rounded-xl px-3.5 py-2.5 text-xs font-bold disabled:opacity-50 ${active ? "bg-amber-50 text-amber-800 hover:bg-amber-100" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}`}
                          >
                            {active ? "Disable" : "Enable"}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => removeBusiness(business)}
                            className="rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
