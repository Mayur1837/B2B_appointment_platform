// import { createContext, useContext, useEffect, useState } from "react";
// import { api } from "../lib/api";
// const C = createContext(null);
// export function AuthProvider({ children }) {
//   const [token, setToken] = useState(localStorage.getItem("token"));
//   const [user, setUser] = useState(null);
//   useEffect(() => {
//     if (token)
//       api("/auth/me", { token })
//         .then((x) => setUser(x.user))
//         .catch(() => {
//           localStorage.removeItem("token");
//           setToken(null);
//         });
//   }, [token]);
//   const login = async (email, password) => {
//     const x = await api("/auth/login", {
//       method: "POST",
//       body: { email, password },
//     });
//     localStorage.setItem("token", x.token);
//     setToken(x.token);
//     setUser(x.user);
//     return x;
//   };
//   const setSession = (nextToken, nextUser) => {
//     localStorage.setItem("token", nextToken);
//     setToken(nextToken);
//     setUser(nextUser);
//   };
//   const logout = () => {
//     localStorage.removeItem("token");
//     setToken(null);
//     setUser(null);
//   };
//   return (
//     <C.Provider value={{ token, user, login, setSession, logout }}>
//       {children}
//     </C.Provider>
//   );
// }
// export const useAuth = () => useContext(C);
import { createContext, useContext, useEffect, useState } from "react";

import { api } from "../lib/api";

const C = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const [user, setUser] = useState(null);

  const [authLoading, setAuthLoading] = useState(
    Boolean(localStorage.getItem("token")),
  );

  useEffect(() => {
    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    setAuthLoading(true);

    api("/auth/me", { token })
      .then((x) => {
        if (!cancelled) {
          setUser(x.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAuthLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (email, password) => {
    const x = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    localStorage.setItem("token", x.token);

    setToken(x.token);
    setUser(x.user);
    setAuthLoading(false);

    return x;
  };

  const setSession = (nextToken, nextUser) => {
    localStorage.setItem("token", nextToken);

    setToken(nextToken);
    setUser(nextUser);
    setAuthLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("token");

    setToken(null);
    setUser(null);
    setAuthLoading(false);
  };

  return (
    <C.Provider
      value={{
        token,
        user,
        authLoading,
        login,
        setSession,
        logout,
      }}
    >
      {children}
    </C.Provider>
  );
}

export const useAuth = () => useContext(C);
