import React, { useState } from 'react';
import { motion } from '../lib/motion';
import useAuthStore from '../stores/authStore';

function RegisterPage({ onNavigate, onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get the login action from auth store
  const login = useAuthStore((state) => state.login);

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/register`;
      console.log(apiUrl);
      
      // Check if API is reachable first
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If response is not okay, throw an error with response message
        throw new Error(data.message || 'Registration failed');
      }

      // Store user data in Zustand store - navigation will be handled by App's useEffect
      login(data.token, data.data.user);
      
      // No need to set app state or navigate directly
      // Navigation will be handled automatically by the App component's useEffect
    } catch (err) {
      // Enhanced error handling to provide more specific error messages
      console.error('Error during registration:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Connection failed. Please ensure the API server is running.',
      );
    } finally {
      // Ensuring loading state is reset
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page register-page">
      <motion.div
        className="auth-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="auth-header">
          <h1>Create an Account</h1>
          <p>Sign up to start using NoteCraft</p>
        </div>

        {error && (
          <motion.div
            className="auth-error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name" id="name-label">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              aria-labelledby="name-label"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" id="email-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              aria-labelledby="email-label"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" id="password-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              aria-labelledby="password-label"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" id="confirmPassword-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              aria-labelledby="confirmPassword-label"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button type="button" className="text-button" onClick={onLogin}>
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default RegisterPage;
