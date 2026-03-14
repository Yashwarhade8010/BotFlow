import { createContext, useContext, useState, useEffect } from 'react';
import { AuthAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bf_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('bf_token');
    if (token) {
      AuthAPI.me()
        .then(res => setUser(res.data.data.user))
        .catch(() => clearSession())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setSession = ({ accessToken, refreshToken, user }) => {
    localStorage.setItem('bf_token',   accessToken);
    localStorage.setItem('bf_refresh', refreshToken);
    localStorage.setItem('bf_user',    JSON.stringify(user));
    setUser(user);
  };

  const clearSession = () => {
    localStorage.removeItem('bf_token');
    localStorage.removeItem('bf_refresh');
    localStorage.removeItem('bf_user');
    setUser(null);
  };

  const login = async (email, password) => {
    const res = await AuthAPI.login({ email, password });
    setSession(res.data.data);
    return res.data.data;
  };

  const register = async (data) => {
    const res = await AuthAPI.register(data);
    setSession(res.data.data);
    return res.data.data;
  };

  const logout = () => {
    clearSession();
    window.location.href = '/login';
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('bf_user', JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
