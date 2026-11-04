/**
 * Student LMS Auth Context
 */

import { createContext, useContext, useState, useEffect } from "react";
import api, { setAuthSession, clearAuthSession, getStoredSession } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const initial = getStoredSession();
  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);
  const [student, setStudent] = useState(initial.student);
  const [isLoading, setIsLoading] = useState(Boolean(initial.token));

  useEffect(() => {
    async function verifySession() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.get("/api/auth/me");
        setUser(data.user);
        if (data.student) {
          setStudent(data.student);
          setAuthSession(token, data.user, data.student);
        }
      } catch (err) {
        console.warn("[Auth] Session invalid or expired:", err.message);
        clearAuthSession();
        setToken("");
        setUser(null);
        setStudent(null);
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, [token]);

  const login = async (identifier, password) => {
    setIsLoading(true);
    try {
      const data = await api.post("/api/auth/login", {
        identifier,
        password,
      });

      const authToken = data.token;
      const authUser = data.user;
      const authStudent = data.student;

      setToken(authToken);
      setUser(authUser);
      setStudent(authStudent);
      setAuthSession(authToken, authUser, authStudent);

      return { success: true, user: authUser, student: authStudent };
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthSession();
    setToken("");
    setUser(null);
    setStudent(null);
  };

  const value = {
    token,
    user,
    student,
    isAuthenticated: Boolean(token && (student || user)),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
