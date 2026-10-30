import { createContext, useContext, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('qm_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('qm_token', res.data.token);
    localStorage.setItem('qm_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('qm_token', res.data.token);
    localStorage.setItem('qm_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('qm_token');
    localStorage.removeItem('qm_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
