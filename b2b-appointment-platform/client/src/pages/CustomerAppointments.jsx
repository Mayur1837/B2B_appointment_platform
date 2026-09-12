import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

export default function CustomerAppointments() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  // const load = () =>
  //   api("/public/customer/appointments", { token }).then((x) =>
  //     setAppointments(x.appointments || []),
  //   );
  const load = async () => {
    setLoading(true);

    try {
      const x = await api("/public/customer/appointments", { token });

      setAppointments(x.appointments || []);
    } finally {
      setLoading(false);
    }
  };
  // useEffect(() => {
  //   if (user?.role !== "CUSTOMER") {
  //     navigate("/customer-login");
  //     return;
  //   }
  //   load().catch((e) => setError(e.message));
  // }, [user]);
  useEffect(() => {
    if (!user) return;

    if (user.role !== "CUSTOMER") {
      navigate("/customer-login");
      return;
    }

    load().catch((e) => setError(e.message));
  }, [user]);

  const upcoming = useMemo(
    () =>
      appointments.filter(
        (a) => a.status === "CONFIRMED" && new Date(a.startAt) > new Date(),
      ),
    [appointments],
  );
  const history = useMemo(
    () => appointments.filter((a) => !upcoming.includes(a)),
    [appointments, upcoming],
  );

  const cancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setBusy(id);
    setError("");
    try {
      await api(`/public/customer/appointments/${id}/cancel`, {
        method: "POST",
        token,
      });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };

  const Card = ({ a }) => (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {a.tenantId?.name}
          </div>
          <h3 className="mt-1 text-lg font-bold">
            {a.serviceId?.name || "Appointment"}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {new Date(a.startAt).toLocaleString(undefined, {
              dateStyle: "full",
              timeStyle: "short",
            })}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${a.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : a.status === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}
        >
          {a.status}
        </span>
      </div>
      {a.status === "CONFIRMED" && new Date(a.startAt) > new Date() && (
        <button
          disabled={busy === a._id}
          onClick={() => cancel(a._id)}
          className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          {busy === a._id ? "Cancelling…" : "Cancel appointment"}
        </button>
      )}
    </article>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <Link to="/login" className="text-xl font-bold">
              BookFlow
            </Link>
            <p className="text-xs text-slate-500">Customer account</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-500 sm:inline">
              {user?.email}
            </span>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-lg border px-3 py-2 text-sm font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl bg-slate-950 p-7 text-white">
          <p className="text-sm text-slate-300">Welcome back</p>
          <h1 className="mt-1 text-3xl font-bold">My appointments</h1>
          <p className="mt-2 text-sm text-slate-300">
            Your bookings are tied to this customer account, so you can return
            anytime to view or cancel eligible appointments.
          </p>
          <Link
            to="/login"
            className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Book another appointment
          </Link>
        </div>
        {error && (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <Loader label="Loading your appointments..." />
        ) : (
          <>
            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Upcoming</h2>
                <span className="text-sm text-slate-500">
                  {upcoming.length}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {upcoming.length ? (
                  upcoming.map((a) => <Card key={a._id} a={a} />)
                ) : (
                  <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">
                    No upcoming appointments.
                  </div>
                )}
              </div>
            </section>
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">History</h2>
                <span className="text-sm text-slate-500">{history.length}</span>
              </div>
              <div className="mt-4 space-y-3">
                {history.length ? (
                  history.map((a) => <Card key={a._id} a={a} />)
                ) : (
                  <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200">
                    Your completed or cancelled appointments will appear here.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
