import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('krakenUser');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const signup = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('krakenUsers') || '[]');
    if (users.find(u => u.email === email)) {
      throw new Error('Email already registered');
    }
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      avatar: name.charAt(0).toUpperCase(),
      createdAt: new Date().toISOString(),
      isGuest: false,
    };
    users.push({ ...newUser, password });
    localStorage.setItem('krakenUsers', JSON.stringify(users));
    localStorage.setItem('krakenUser', JSON.stringify(newUser));
    setUser(newUser);
    return newUser;
  };

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('krakenUsers') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) {
      throw new Error('Invalid email or password');
    }
    const { password: _, ...userData } = found;
    localStorage.setItem('krakenUser', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const guestLogin = () => {
    const guestUser = {
      id: 'guest-' + Date.now(),
      name: 'Guest',
      email: null,
      avatar: 'G',
      isGuest: true,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('krakenUser', JSON.stringify(guestUser));
    setUser(guestUser);
    return guestUser;
  };

  const logout = () => {
    localStorage.removeItem('krakenUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, guestLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
