// frontend/contexts/AuthContext.js - ENHANCED DEBUG VERSION
import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../services/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  console.log('useAuth called, context exists?', !!context);
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔐 Setting up auth listener...');
    console.log('Auth object:', auth);
    console.log('Auth currentUser:', auth.currentUser?.email);
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('🔔 Auth state changed!');
      if (firebaseUser) {
        console.log('✅ User logged in:', firebaseUser.email);
        console.log('User UID:', firebaseUser.uid);
      } else {
        console.log('❌ No user logged in');
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => {
      console.log('🧹 Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const signup = async (email, password) => {
    try {
      console.log('📝 Creating account for:', email);
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
      console.log('🔑 Attempting login for:', email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', result.user.email);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Login error:', error.code, error.message);
      return { success: false, error: error };
    }
  };

  const logout = async () => {
    console.log('=== LOGOUT FUNCTION CALLED ===');
    console.log('Current user before logout:', user?.email);
    console.log('Auth currentUser before logout:', auth.currentUser?.email);
    
    try {
      console.log('Calling Firebase signOut...');
      await signOut(auth);
      
      console.log('✅ Firebase signOut completed');
      console.log('Auth currentUser after signOut:', auth.currentUser);
      
      // Update local state
      setUser(null);
      console.log('✅ Local user state cleared');
      
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
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

  console.log('AuthProvider render - user:', user?.email, 'loading:', loading);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};