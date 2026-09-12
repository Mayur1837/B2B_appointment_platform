// import { Navigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
// export default function ProtectedRoute({ role, children }) {
//   const { user } = useAuth();
//   if (!user) return <Navigate to="/login" replace />;
//   if (role && user.role !== role) return <Navigate to="/" replace />;
//   return children;
// }
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "./Loader";

export default function ProtectedRoute({ role, children }) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return <Loader fullScreen label="Checking your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}
