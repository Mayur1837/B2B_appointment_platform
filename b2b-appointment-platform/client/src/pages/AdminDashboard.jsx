import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

const today = new Date().toISOString().slice(0, 10);
const EMPTY_SLOT = { date: today, startTime: "09:00", endTime: "17:00" };
const DAYS_OF_WEEK = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

const EMPTY_WEEKLY_SLOT = {
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "17:00",
};

// function formatDate(date) {
//   return new Intl.DateTimeFormat(undefined, {
//     weekday: "short",
//     month: "short",
//     day: "numeric",
//     year: "numeric",
//   }).format(new Date(`${date}T12:00:00`));
// }
function formatDate(date) {
  if (!date) return "Date not set";

  const parsed = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsed.getTime())) {
    return "Invalid date";
  }

  return parsed.toLocaleDateString();
}

// function formatAvailability(a) {
//   if (a.mode === "WEEKLY") {
//     const days = [
//       { value: 1, label: "Monday" },
//       { value: 2, label: "Tuesday" },
//       { value: 3, label: "Wednesday" },
//       { value: 4, label: "Thursday" },
//       { value: 5, label: "Friday" },
//       { value: 6, label: "Saturday" },
//       { value: 0, label: "Sunday" },
//     ];

//     return (
//       days.find((day) => day.value === Number(a.dayOfWeek))?.label || "Weekly"
//     );
//   }

//   return formatDate(a.date);
// }
function formatAvailability(a) {
  if (a.mode === "WEEKLY") {
    const days = [
      { value: 1, label: "Monday" },
      { value: 2, label: "Tuesday" },
      { value: 3, label: "Wednesday" },
      { value: 4, label: "Thursday" },
      { value: 5, label: "Friday" },
      { value: 6, label: "Saturday" },
      { value: 0, label: "Sunday" },
    ];

    return (
      days.find((day) => day.value === Number(a.dayOfWeek))?.label ||
      "Weekly day not set"
    );
  }

  return formatDate(a.date);
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [appts, setAppts] = useState([]);
  const [error, setError] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [duration, setDuration] = useState(30);
  // const [serviceSlots, setServiceSlots] = useState([{ ...EMPTY_SLOT }]);
  const [availabilityMode, setAvailabilityMode] = useState("DATE");
  const [serviceSlots, setServiceSlots] = useState([{ ...EMPTY_SLOT }]);
  const [extraServiceId, setExtraServiceId] = useState("");
  // const [extraSlot, setExtraSlot] = useState({ ...EMPTY_SLOT });
  const [extraAvailabilityMode, setExtraAvailabilityMode] = useState("DATE");
  const [extraSlot, setExtraSlot] = useState({
    ...EMPTY_SLOT,
  });
  const [appointmentFilter, setAppointmentFilter] = useState("ALL");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // const load = async () => {
  //   const [b, s, a] = await Promise.all([
  //     api("/business/profile", { token }),
  //     api("/business/services", { token }),
  //     api("/business/appointments", { token }),
  //   ]);
  //   setBusiness(b.business);
  //   setServices(s.services);
  //   setAppts(a.appointments);
  //   if (!extraServiceId && s.services[0]) setExtraServiceId(s.services[0]._id);
  // };
  const load = async () => {
    setLoading(true);

    try {
      const [b, s, a] = await Promise.all([
        api("/business/profile", { token }),
        api("/business/services", { token }),
        api("/business/appointments", { token }),
      ]);

      setBusiness(b.business);
      setServices(s.services);
      setAppts(a.appointments);

      if (!extraServiceId && s.services[0]) {
        setExtraServiceId(s.services[0]._id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  const run = async (fn) => {
    try {
      setError("");
      setBusy(true);
      await fn();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const filteredAppointments = useMemo(
    () =>
      appointmentFilter === "ALL"
        ? appts
        : appts.filter((a) => a.status === appointmentFilter),
    [appts, appointmentFilter],
  );

  const addServiceSlot = () =>
    setServiceSlots((items) => [...items, { ...EMPTY_SLOT }]);
  const removeServiceSlot = (index) =>
    setServiceSlots((items) => items.filter((_, i) => i !== index));
  const updateServiceSlot = (index, key, value) =>
    setServiceSlots((items) =>
      items.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );

  return (
    <Layout>
      <div className="space-y-7">
        <section className="rounded-[28px] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Business workspace
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                {business?.name || "Business dashboard"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Configure services, service-specific availability, and
                appointments from one focused workspace.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">
            {error}
          </div>
        )}
        {loading ? (
          <Loader label="Loading business workspace..." />
        ) : (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Step 1
                    </p>
                    <h2 className="mt-1 text-xl font-bold">Create a service</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Availability is now configured per service and per date.
                    </p>
                  </div>
                </div>
                <form
                  className="mt-6 space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    run(async () => {
                      await api("/business/services", {
                        method: "POST",
                        token,
                        // body: {
                        //   name: serviceName,
                        //   durationMinutes: Number(duration),
                        //   availability: serviceSlots,
                        // },
                        body: {
                          name: serviceName,
                          durationMinutes: Number(duration),
                          availability: serviceSlots.map((slot) =>
                            availabilityMode === "WEEKLY"
                              ? {
                                  mode: "WEEKLY",
                                  dayOfWeek: Number(slot.dayOfWeek),
                                  startTime: slot.startTime,
                                  endTime: slot.endTime,
                                }
                              : {
                                  mode: "DATE",
                                  date: slot.date,
                                  startTime: slot.startTime,
                                  endTime: slot.endTime,
                                },
                          ),
                        },
                      });
                      setServiceName("");
                      setDuration(30);
                      setAvailabilityMode("DATE");
                      setServiceSlots([{ ...EMPTY_SLOT }]);
                    });
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
                    <label className="text-sm font-medium">
                      Service name
                      <input
                        required
                        className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-500"
                        placeholder="Consultation"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                      />
                    </label>
                    <label className="text-sm font-medium">
                      Duration
                      <input
                        required
                        className="mt-2 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-slate-500"
                        type="number"
                        min="5"
                        max="1440"
                        step="5"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                      />
                      <span className="mt-1 block text-xs font-normal text-slate-400">
                        Minutes
                      </span>
                    </label>
                  </div>
                  {/* <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Service availability</h3>
                    <p className="text-xs text-slate-500">
                      Add one or more date/time windows for this service.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addServiceSlot}
                    className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                  >
                    + Add date
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {serviceSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                    >
                      <label className="text-xs font-semibold text-slate-600">
                        Date
                        <input
                          required
                          min={today}
                          type="date"
                          className="mt-1 w-full rounded-lg border bg-white p-2.5 font-normal"
                          value={slot.date}
                          onChange={(e) =>
                            updateServiceSlot(index, "date", e.target.value)
                          }
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Start
                        <input
                          required
                          type="time"
                          className="mt-1 w-full rounded-lg border bg-white p-2.5 font-normal"
                          value={slot.startTime}
                          onChange={(e) =>
                            updateServiceSlot(
                              index,
                              "startTime",
                              e.target.value,
                            )
                          }
                        />
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        End
                        <input
                          required
                          type="time"
                          className="mt-1 w-full rounded-lg border bg-white p-2.5 font-normal"
                          value={slot.endTime}
                          onChange={(e) =>
                            updateServiceSlot(index, "endTime", e.target.value)
                          }
                        />
                      </label>
                      <button
                        type="button"
                        disabled={serviceSlots.length === 1}
                        onClick={() => removeServiceSlot(index)}
                        className="rounded-lg px-3 py-2 text-sm text-red-600 disabled:text-slate-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div> */}
                  <div>
                    <div>
                      <h3 className="font-semibold">Service availability</h3>
                      <p className="text-xs text-slate-500">
                        Choose recurring weekly availability or specific
                        calendar dates.
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAvailabilityMode("DATE");
                          setServiceSlots([{ ...EMPTY_SLOT }]);
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                          availabilityMode === "DATE"
                            ? "bg-white shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        Specific dates
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAvailabilityMode("WEEKLY");
                          setServiceSlots([{ ...EMPTY_WEEKLY_SLOT }]);
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                          availabilityMode === "WEEKLY"
                            ? "bg-white shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        Weekly recurring
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        {availabilityMode === "DATE"
                          ? "Add availability for specific dates."
                          : "Add recurring availability by weekday."}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setServiceSlots((items) => [
                            ...items,
                            availabilityMode === "WEEKLY"
                              ? { ...EMPTY_WEEKLY_SLOT }
                              : { ...EMPTY_SLOT },
                          ])
                        }
                        className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                      >
                        + Add{" "}
                        {availabilityMode === "WEEKLY" ? "weekday" : "date"}
                      </button>
                    </div>

                    <div className="mt-3 space-y-3">
                      {serviceSlots.map((slot, index) => (
                        <div
                          key={index}
                          className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                        >
                          {availabilityMode === "DATE" ? (
                            <label className="text-xs font-semibold text-slate-600">
                              Date
                              <input
                                required
                                min={today}
                                type="date"
                                className="mt-1 w-full rounded-lg border bg-white p-2.5 font-normal"
                                value={slot.date}
                                onChange={(e) =>
                                  setServiceSlots((items) =>
                                    items.map((item, i) =>
                                      i === index
                                        ? { ...item, date: e.target.value }
                                        : item,
                                    ),
                                  )
                                }
                              />
                            </label>
                          ) : (
                            <label className="text-xs font-semibold text-slate-600">
                              Weekday
                              <select
                                required
                                className="mt-1 w-full rounded-lg border bg-white p-2.5 font-normal"
                                value={slot.dayOfWeek}
                                onChange={(e) =>
                                  setServiceSlots((items) =>
                                    items.map((item, i) =>
                                      i === index
                                        ? {
                                            ...item,
                                            dayOfWeek: Number(e.target.value),
                                          }
                                        : item,
                                    ),
                                  )
                                }
                              >
                                {DAYS_OF_WEEK.map((day) => (
                                  <option key={day.value} value={day.value}>
                                    {day.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}

                          <label className="text-xs font-semibold text-slate-600">
                            Start
                            <input
                              required
                              type="time"
                              className="mt-1 w-full rounded-lg border bg-white p-2.5 font-normal"
                              value={slot.startTime}
                              onChange={(e) =>
                                setServiceSlots((items) =>
                                  items.map((item, i) =>
                                    i === index
                                      ? { ...item, startTime: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>

                          <label className="text-xs font-semibold text-slate-600">
                            End
                            <input
                              required
                              type="time"
                              className="mt-1 w-full rounded-lg border bg-white p-2.5 font-normal"
                              value={slot.endTime}
                              onChange={(e) =>
                                setServiceSlots((items) =>
                                  items.map((item, i) =>
                                    i === index
                                      ? { ...item, endTime: e.target.value }
                                      : item,
                                  ),
                                )
                              }
                            />
                          </label>

                          <button
                            type="button"
                            disabled={serviceSlots.length === 1}
                            onClick={() =>
                              setServiceSlots((items) =>
                                items.filter((_, i) => i !== index),
                              )
                            }
                            className="rounded-lg px-3 py-2 text-sm text-red-600 disabled:text-slate-300"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    disabled={busy}
                    className="w-full rounded-xl bg-slate-950 p-3.5 font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                  >
                    {busy ? "Saving…" : "Create service & availability"}
                  </button>
                </form>
              </div>

              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Step 2
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  Manage service availability
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add another date/time window to an existing service.
                </p>
                {services.length === 0 ? (
                  <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    Create your first service to add availability.
                  </div>
                ) : (
                  // <form
                  //   className="mt-6 space-y-4"
                  //   onSubmit={(e) => {
                  //     e.preventDefault();
                  //     run(() =>
                  //       api("/business/availability", {
                  //         method: "POST",
                  //         token,
                  //         body: { serviceId: extraServiceId, ...extraSlot },
                  //       }),
                  //     );
                  //   }}
                  // >
                  //   <label className="block text-sm font-medium">
                  //     Service
                  //     <select
                  //       className="mt-2 w-full rounded-xl border p-3"
                  //       value={extraServiceId}
                  //       onChange={(e) => setExtraServiceId(e.target.value)}
                  //     >
                  //       {services.map((s) => (
                  //         <option key={s._id} value={s._id}>
                  //           {s.name}
                  //         </option>
                  //       ))}
                  //     </select>
                  //   </label>
                  //   <div className="grid gap-3 sm:grid-cols-3">
                  //     <label className="text-sm font-medium">
                  //       Date
                  //       <input
                  //         required
                  //         min={today}
                  //         type="date"
                  //         className="mt-2 w-full rounded-xl border p-3 font-normal"
                  //         value={extraSlot.date}
                  //         onChange={(e) =>
                  //           setExtraSlot({ ...extraSlot, date: e.target.value })
                  //         }
                  //       />
                  //     </label>
                  //     <label className="text-sm font-medium">
                  //       Start
                  //       <input
                  //         required
                  //         type="time"
                  //         className="mt-2 w-full rounded-xl border p-3 font-normal"
                  //         value={extraSlot.startTime}
                  //         onChange={(e) =>
                  //           setExtraSlot({
                  //             ...extraSlot,
                  //             startTime: e.target.value,
                  //           })
                  //         }
                  //       />
                  //     </label>
                  //     <label className="text-sm font-medium">
                  //       End
                  //       <input
                  //         required
                  //         type="time"
                  //         className="mt-2 w-full rounded-xl border p-3 font-normal"
                  //         value={extraSlot.endTime}
                  //         onChange={(e) =>
                  //           setExtraSlot({ ...extraSlot, endTime: e.target.value })
                  //         }
                  //       />
                  //     </label>
                  //   </div>
                  //   <button
                  //     disabled={busy}
                  //     className="w-full rounded-xl border border-slate-300 p-3 font-semibold hover:bg-slate-50 disabled:opacity-50"
                  //   >
                  //     Add availability
                  //   </button>
                  // </form>
                  <form
                    className="mt-6 space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();

                      run(() =>
                        api("/business/availability", {
                          method: "POST",
                          token,
                          body:
                            extraAvailabilityMode === "WEEKLY"
                              ? {
                                  serviceId: extraServiceId,
                                  mode: "WEEKLY",
                                  dayOfWeek: Number(extraSlot.dayOfWeek),
                                  startTime: extraSlot.startTime,
                                  endTime: extraSlot.endTime,
                                }
                              : {
                                  serviceId: extraServiceId,
                                  mode: "DATE",
                                  date: extraSlot.date,
                                  startTime: extraSlot.startTime,
                                  endTime: extraSlot.endTime,
                                },
                        }),
                      );
                    }}
                  >
                    <label className="block text-sm font-medium">
                      Service
                      <select
                        className="mt-2 w-full rounded-xl border p-3"
                        value={extraServiceId}
                        onChange={(e) => setExtraServiceId(e.target.value)}
                      >
                        {services.map((s) => (
                          <option key={s._id} value={s._id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => {
                          setExtraAvailabilityMode("DATE");
                          setExtraSlot({ ...EMPTY_SLOT });
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                          extraAvailabilityMode === "DATE"
                            ? "bg-white shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        Specific date
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setExtraAvailabilityMode("WEEKLY");
                          setExtraSlot({ ...EMPTY_WEEKLY_SLOT });
                        }}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                          extraAvailabilityMode === "WEEKLY"
                            ? "bg-white shadow-sm"
                            : "text-slate-500"
                        }`}
                      >
                        Weekly
                      </button>
                    </div>

                    {extraAvailabilityMode === "DATE" ? (
                      <label className="block text-sm font-medium">
                        Date
                        <input
                          required
                          min={today}
                          type="date"
                          className="mt-2 w-full rounded-xl border p-3 font-normal"
                          value={extraSlot.date}
                          onChange={(e) =>
                            setExtraSlot({
                              ...extraSlot,
                              date: e.target.value,
                            })
                          }
                        />
                      </label>
                    ) : (
                      <label className="block text-sm font-medium">
                        Weekday
                        <select
                          required
                          className="mt-2 w-full rounded-xl border p-3"
                          value={extraSlot.dayOfWeek}
                          onChange={(e) =>
                            setExtraSlot({
                              ...extraSlot,
                              dayOfWeek: Number(e.target.value),
                            })
                          }
                        >
                          {DAYS_OF_WEEK.map((day) => (
                            <option key={day.value} value={day.value}>
                              {day.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="text-sm font-medium">
                        Start
                        <input
                          required
                          type="time"
                          className="mt-2 w-full rounded-xl border p-3 font-normal"
                          value={extraSlot.startTime}
                          onChange={(e) =>
                            setExtraSlot({
                              ...extraSlot,
                              startTime: e.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="text-sm font-medium">
                        End
                        <input
                          required
                          type="time"
                          className="mt-2 w-full rounded-xl border p-3 font-normal"
                          value={extraSlot.endTime}
                          onChange={(e) =>
                            setExtraSlot({
                              ...extraSlot,
                              endTime: e.target.value,
                            })
                          }
                        />
                      </label>
                    </div>

                    <button
                      disabled={busy}
                      className="w-full rounded-xl border border-slate-300 p-3 font-semibold hover:bg-slate-50 disabled:opacity-50"
                    >
                      {busy ? "Saving…" : "Add availability"}
                    </button>
                  </form>
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Catalog
                  </p>
                  <h2 className="mt-1 text-xl font-bold">Services</h2>
                </div>
                <span className="text-sm text-slate-500">
                  {services.length} service{services.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {services.length === 0 && (
                  <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500 lg:col-span-2">
                    No services yet.
                  </div>
                )}
                {services.map((s) => (
                  <article
                    key={s._id}
                    className="rounded-2xl border border-slate-200 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">{s.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {s.durationMinutes} minutes
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          run(() =>
                            api(`/business/services/${s._id}`, {
                              method: "PATCH",
                              token,
                              body: {
                                status:
                                  s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              },
                            }),
                          )
                        }
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${s.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {s.status}
                      </button>
                    </div>
                    <div className="mt-5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Scheduled availability
                      </div>
                      {s.availability?.length ? (
                        <div className="mt-2 space-y-2">
                          {s.availability.map((a) => (
                            <div
                              key={a._id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm"
                            >
                              {/* <span>{formatDate(a.date)}</span> */}
                              <span>
                                {a.mode === "WEEKLY" ? "Weekly · " : ""}
                                {formatAvailability(a)}
                              </span>
                              <span className="font-semibold">
                                {a.startTime}–{a.endTime}
                              </span>
                              <button
                                onClick={() =>
                                  run(() =>
                                    api(`/business/availability/${a._id}`, {
                                      method: "DELETE",
                                      token,
                                    }),
                                  )
                                }
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">
                          No dates configured yet.
                        </p>
                      )}
                    </div>
                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        onClick={() =>
                          run(() =>
                            api(`/business/services/${s._id}`, {
                              method: "PATCH",
                              token,
                              body: {
                                status:
                                  s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              },
                            }),
                          )
                        }
                        className={`rounded-xl border px-3.5 py-2 text-sm font-semibold ${s.status === "ACTIVE" ? "border-slate-200 hover:bg-slate-50" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
                      >
                        {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Delete ${s.name}? Its availability will be removed and confirmed appointments for this service will be cancelled.`,
                            )
                          )
                            run(() =>
                              api(`/business/services/${s._id}`, {
                                method: "DELETE",
                                token,
                              }),
                            );
                        }}
                        className="rounded-xl bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                      >
                        Delete service
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Operations
                  </p>
                  <h2 className="mt-1 text-xl font-bold">Appointments</h2>
                </div>
                <select
                  className="rounded-lg border p-2.5 text-sm"
                  value={appointmentFilter}
                  onChange={(e) => setAppointmentFilter(e.target.value)}
                >
                  <option value="ALL">All statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="NO_SHOW">No show</option>
                </select>
              </div>
              <div className="mt-5 space-y-3">
                {filteredAppointments.length === 0 && (
                  <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                    No appointments match this filter.
                  </div>
                )}
                {filteredAppointments.map((a) => (
                  <div
                    key={a._id}
                    className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-semibold">
                        {a.serviceId?.name || "Service"} · {a.customerName}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {new Date(a.startAt).toLocaleString()} ·{" "}
                        {a.customerEmail}
                      </div>
                    </div>
                    {a.status === "CONFIRMED" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            run(() =>
                              api(`/business/appointments/${a._id}`, {
                                method: "PATCH",
                                token,
                                body: { status: "COMPLETED" },
                              }),
                            )
                          }
                          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-slate-50"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() =>
                            run(() =>
                              api(`/business/appointments/${a._id}`, {
                                method: "PATCH",
                                token,
                                body: { status: "CANCELLED" },
                              }),
                            )
                          }
                          className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
