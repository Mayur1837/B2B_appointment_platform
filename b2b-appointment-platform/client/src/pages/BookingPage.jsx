import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

function todayInZone(timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function addDays(dateOnly, days) {
  const d = new Date(`${dateOnly}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function label(dateOnly, timeZone) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateOnly}T12:00:00Z`));
}

export default function BookingPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [serviceId, setServiceId] = useState(
    searchParams.get("serviceId") || "",
  );
  const [date, setDate] = useState(searchParams.get("date") || "");
  const [calendarStart, setCalendarStart] = useState("");
  const [slots, setSlots] = useState([]);
  const [availability, setAvailability] = useState({});
  const [selected, setSelected] = useState(searchParams.get("startAt") || "");
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    api(`/public/businesses/${slug}`)
      .then((x) => {
        setData(x);
        const initialService =
          searchParams.get("serviceId") || x.services[0]?._id || "";
        setServiceId(initialService);
        const today = todayInZone(x.business.timezone);
        const initialDate = searchParams.get("date") || today;
        setDate(initialDate);
        setCalendarStart(initialDate < today ? today : initialDate);
      })
      .catch((e) => setError(e.message));
  }, [slug]);
  useEffect(() => {
    if (user?.role === "CUSTOMER") return;
  }, [user]);

  const calendarDates = useMemo(
    () =>
      calendarStart
        ? Array.from({ length: 14 }, (_, i) => addDays(calendarStart, i))
        : [],
    [calendarStart],
  );

  // useEffect(() => {
  //   if (!data || !serviceId || !date) return;
  //   let cancelled = false;
  //   setLoading(true);
  //   setError("");
  //   Promise.all(
  //     calendarDates.map((day) =>
  //       api(
  //         `/public/businesses/${slug}/slots?serviceId=${serviceId}&date=${day}`,
  //       ).then((x) => [day, x.slots || []]),
  //     ),
  //   )
  //     .then((results) => {
  //       if (cancelled) return;
  //       const map = Object.fromEntries(results);
  //       setAvailability(map);
  //       const daySlots = map[date] || [];
  //       setSlots(daySlots);
  //       setSelected((current) =>
  //         daySlots.some((x) => x.startAt === current)
  //           ? current
  //           : daySlots[0]?.startAt || "",
  //       );
  //     })
  //     .catch((e) => !cancelled && setError(e.message))
  //     .finally(() => !cancelled && setLoading(false));
  //   return () => {
  //     cancelled = true;
  //   };
  // }, [data, slug, serviceId, date, calendarStart]);

  useEffect(() => {
    if (!data || !serviceId || !date) return;

    let cancelled = false;

    setLoading(true);
    setError("");
    setSlots([]);
    setSelected("");

    api(`/public/businesses/${slug}/slots?serviceId=${serviceId}&date=${date}`)
      .then((x) => {
        if (cancelled) return;

        const daySlots = x.slots || [];

        setSlots(daySlots);

        setAvailability((current) => ({
          ...current,
          [date]: daySlots,
        }));

        setSelected((current) =>
          daySlots.some((x) => x.startAt === current) ? current : "",
        );
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setSlots([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data, slug, serviceId, date]);

  const selectedService = data?.services.find((s) => s._id === serviceId);
  const goToCustomerLogin = () => {
    const returnTo = `/book/${slug}?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}${selected ? `&startAt=${encodeURIComponent(selected)}` : ""}`;
    navigate(`/customer-login?returnTo=${encodeURIComponent(returnTo)}`);
  };

  if (!data) {
    return <Loader fullScreen label="Loading booking page..." />;
  }

  if (booking) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 shadow-lg ring-1 ring-slate-200">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-xl text-emerald-700">
            ✓
          </div>
          <p className="mt-5 text-sm font-semibold text-emerald-600">
            Appointment confirmed
          </p>
          <h1 className="mt-1 text-3xl font-bold">
            You're booked, {booking.customerName}.
          </h1>
          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <div className="font-semibold">
              {selectedService?.name || "Appointment"}
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {new Date(booking.startAt).toLocaleString(undefined, {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              className="rounded-xl bg-slate-950 p-3 text-center text-sm font-semibold text-white"
              to="/customer-appointments"
            >
              My appointments
            </Link>
            <Link
              className="rounded-xl border p-3 text-center text-sm font-semibold"
              to={`/booking/${booking.cancelToken}`}
            >
              Manage this booking
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-600 hover:text-slate-950"
          >
            ← All businesses
          </Link>
          {user?.role === "CUSTOMER" && (
            <Link
              to="/customer-appointments"
              className="rounded-lg border bg-white px-3 py-2 text-sm font-medium"
            >
              My appointments
            </Link>
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
          <aside className="rounded-3xl bg-slate-950 p-7 text-white lg:sticky lg:top-6 lg:h-fit">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              Public booking
            </span>
            <h1 className="mt-5 text-3xl font-bold">
              {data?.business.name || "Book an appointment"}
            </h1>
            {data?.business.phone && (
              <p className="mt-2 text-sm text-slate-300">
                {data.business.phone}
              </p>
            )}
            <div className="mt-7 rounded-2xl bg-white/10 p-4">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                Selected service
              </div>
              <div className="mt-2 font-semibold">
                {selectedService?.name || "Choose a service"}
              </div>
              {selectedService && (
                <div className="mt-1 text-sm text-slate-300">
                  {selectedService.durationMinutes} minutes
                </div>
              )}
            </div>
            <p className="mt-6 text-sm leading-6 text-slate-300">
              No login is required to browse. Authentication is only requested
              when you confirm a time.
            </p>
          </aside>
          <main className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            {data && data.services.length === 0 && (
              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                This business has no active services available for booking.
              </div>
            )}
            {data && data.services.length > 0 && (
              <>
                <label className="block text-sm font-semibold">
                  1. Choose a service
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3.5"
                    value={serviceId}
                    onChange={(e) => {
                      setServiceId(e.target.value);
                      setSelected("");
                    }}
                  >
                    {data.services.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} · {s.durationMinutes} min
                      </option>
                    ))}
                  </select>
                </label>
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold">2. Choose a date</h2>
                      <p className="text-sm text-slate-500">
                        {/* Only dates configured for this service will have times. */}
                        Available times are based on this service's recurring
                        weekly schedule and specific date availability.
                      </p>
                    </div>
                    {loading && (
                      <span className="text-sm text-slate-500">Loading…</span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-7">
                    {calendarDates.map((day) => (
                      <button
                        type="button"
                        key={day}
                        onClick={() => setDate(day)}
                        className={`rounded-xl border p-3 text-left ${date === day ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 hover:bg-slate-50"}`}
                      >
                        <span className="block text-xs opacity-70">
                          {label(day, data.business.timezone)}
                        </span>
                        {/* <span className="mt-1 block text-xs font-semibold">
                          {availability[day]?.length
                            ? `${availability[day].length} times`
                            : "Unavailable"}
                        </span> */}
                        <span className="mt-1 block text-xs font-semibold">
                          {date === day
                            ? loading
                              ? "Loading…"
                              : slots.length
                                ? `${slots.length} times`
                                : "No times"
                            : "Select date"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                {/* <div className="mt-8">
                  <h2 className="text-lg font-bold">3. Choose a time</h2>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                    {slots.map((s) => (
                      <button
                        type="button"
                        key={s.startAt}
                        onClick={() => setSelected(s.startAt)}
                        className={`rounded-xl border p-3 text-sm font-semibold ${selected === s.startAt ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 hover:bg-slate-50"}`}
                      >
                        {s.time}
                      </button>
                    ))}
                  </div>
                  {!slots.length && !loading && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                      No available times for this service on this date.
                    </div>
                  )}
                </div> */}
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">3. Choose a time</h2>

                    {loading && (
                      <span className="text-xs font-medium text-slate-500">
                        Loading available times…
                      </span>
                    )}
                  </div>

                  <div className="mt-3">
                    {loading ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                          <div
                            key={index}
                            className="h-12 animate-pulse rounded-xl bg-slate-100"
                          />
                        ))}
                      </div>
                    ) : slots.length ? (
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                        {slots.map((s) => (
                          <button
                            type="button"
                            key={s.startAt}
                            onClick={() => setSelected(s.startAt)}
                            className={`rounded-xl border p-3 text-sm font-semibold ${
                              selected === s.startAt
                                ? "border-slate-950 bg-slate-950 text-white"
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        No available times for this service on this date.
                      </div>
                    )}
                  </div>
                </div>
                {user?.role === "CUSTOMER" ? (
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Signed in as
                      </span>
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-sm text-slate-500">
                        {user.email}
                      </span>
                    </div>
                    {/* <button
                      disabled={!selected || loading}
                      onClick={async () => {
                        try {
                          setError("");
                          const x = await api(
                            `/public/businesses/${slug}/appointments`,
                            {
                              method: "POST",
                              token: localStorage.getItem("token"),
                              body: { serviceId, startAt: selected },
                            },
                          );
                          setBooking(x.appointment);
                        } catch (e) {
                          setError(e.message);
                        }
                      }}
                      className="mt-5 w-full rounded-xl bg-slate-950 p-3.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      Confirm appointment
                    </button> */}
                    <button
                      disabled={!selected || loading || bookingLoading}
                      onClick={async () => {
                        try {
                          setError("");
                          setBookingLoading(true);

                          const x = await api(
                            `/public/businesses/${slug}/appointments`,
                            {
                              method: "POST",
                              token: localStorage.getItem("token"),
                              body: {
                                serviceId,
                                startAt: selected,
                              },
                            },
                          );

                          setBooking(x.appointment);
                        } catch (e) {
                          setError(e.message);
                        } finally {
                          setBookingLoading(false);
                        }
                      }}
                      className="mt-5 w-full rounded-xl bg-slate-950 p-3.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {bookingLoading
                        ? "Confirming appointment…"
                        : "Confirm appointment"}
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <h3 className="font-bold">Ready to book?</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      You can browse everything without an account. Sign in or
                      create a customer account only to confirm the selected
                      time.
                    </p>
                    <button
                      disabled={!selected || loading}
                      onClick={goToCustomerLogin}
                      className="mt-4 w-full rounded-xl bg-slate-950 p-3.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      Sign in to confirm booking
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
