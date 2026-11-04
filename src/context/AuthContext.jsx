import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setAuthToken } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    setTeacher(null);
  }, []);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = localStorage.getItem('lms_token');
        if (!token) {
          setLoading(false);
          return;
        }
        const data = await api.me();
        setUser(data.user);
        setTeacher(data.teacher || null);
      } catch (err) {
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    setAuthToken(data.token);
    setUser(data.user);
    setTeacher(data.teacher || null);
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, teacher, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);