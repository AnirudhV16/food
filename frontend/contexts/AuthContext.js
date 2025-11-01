// frontend/contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? user.email : 'No user');
      setUser(user);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const signup = async (email, password) => {
    try {
      console.log('Creating new account for:', email);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Signup successful:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Signup error:', error.code, error.message);
      return { success: false, error: error };
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login for:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Login error:', error.code, error.message);
      return { success: false, error: error };
    }
  };

  const logout = async () => {
    try {
      console.log('Attempting logout...');
      await signOut(auth);
      console.log('✅ Logout successful');
      setUser(null); // Immediately clear user state
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};