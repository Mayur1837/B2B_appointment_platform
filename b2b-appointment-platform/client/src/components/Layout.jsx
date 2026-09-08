import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const labels = {
  SYSTEM_OWNER: "Platform Owner",
  BUSINESS_ADMIN: "Business Admin",
  CUSTOMER: "Customer",
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const home =
    user?.role === "SYSTEM_OWNER"
      ? "/owner"
      : user?.role === "BUSINESS_ADMIN"
        ? "/admin"
        : "/customer-appointments";

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-3.5 sm:px-6">
          <Link to={home} className="group flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950
             text-sm font-black text-white shadow-sm"
            >
              B
            </div>
            <div>
              <div className="text-base font-extrabold tracking-tight">
                BookFlow
              </div>
              <div className="text-[11px] font-medium text-slate-400">
                Appointment platform
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2.5">
            {user?.role === "CUSTOMER" && (
              <Link
                to="/customer-appointments"
                className={`hidden rounded-xl px-3 py-2 text-sm font-semibold sm:block ${
                  location.pathname === "/customer-appointments"
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                My appointments
              </Link>
            )}
            <div className="hidden text-right md:block">
              <div className="text-sm font-semibold">{user?.name}</div>
              <div className="text-[11px] font-medium text-slate-400">
                {labels[user?.role]}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold
               text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}
