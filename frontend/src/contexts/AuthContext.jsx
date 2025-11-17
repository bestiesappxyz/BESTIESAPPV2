import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import errorTracker from '../services/errorTracking';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      
      // Set user in error tracker
      if (user) {
        errorTracker.setUser(user.uid);
      } else {
        errorTracker.setUser(null);
      }
      
      if (user) {
        // Listen to user document changes
        const unsubscribeUser = onSnapshot(
          doc(db, 'users', user.uid),
          (doc) => {
            if (doc.exists()) {
              setUserData({ id: doc.id, ...doc.data() });
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching user data:', error);
            setLoading(false);
          }
        );
        
        return () => unsubscribeUser();
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const value = {
    currentUser,
    userData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
