'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from '../lib/motion';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import useAuthStore from '../stores/authStore';

const AuthPage = ({ onNavigate }) => {
  const [authMode, setAuthMode] = useState('login');
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      onNavigate('home');
    }
  }, [isAuthenticated, onNavigate]);

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-page-container">
        <div className="auth-logo">
          <motion.div
            className="logo-container"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1>NoteCraft</h1>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {authMode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <LoginPage onNavigate={onNavigate} onRegister={toggleAuthMode} />
            </motion.div>
          ) : (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RegisterPage onNavigate={onNavigate} onLogin={toggleAuthMode} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
