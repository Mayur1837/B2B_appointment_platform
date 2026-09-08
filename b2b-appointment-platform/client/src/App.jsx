import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import CustomerLogin from "./pages/CustomerLogin";
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import BookingPage from "./pages/BookingPage";
import ManageBooking from "./pages/ManageBooking";
import CustomerAppointments from "./pages/CustomerAppointments";
export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/customer-login" element={<CustomerLogin />} />
      <Route
        path="/customer-appointments"
        element={
          <ProtectedRoute role="CUSTOMER">
            <CustomerAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/owner"
        element={
          <ProtectedRoute role="SYSTEM_OWNER">
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="BUSINESS_ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/book/:slug" element={<BookingPage />} />
      <Route path="/booking/:token" element={<ManageBooking />} />
      <Route
        path="/"
        element={
          <Navigate
            to={
              user
                ? user.role === "SYSTEM_OWNER"
                  ? "/owner"
                  : user.role === "BUSINESS_ADMIN"
                    ? "/admin"
                    : user.role === "CUSTOMER"
                      ? "/customer-appointments"
                      : "/login"
                : "/login"
            }
            replace
          />
        }
      />
    </Routes>
  );
}
