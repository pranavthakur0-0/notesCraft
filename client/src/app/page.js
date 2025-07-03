'use client';

import React, { useMemo, useCallback, memo, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from './lib/motion';
import HomePage from './pages/HomePage';
import NotesGeneratorPage from './pages/NotesGeneratorPage';
import NoteDetailPage from './pages/NoteDetailPage';
import NotebookSelectorPage from './pages/NotebookSelectorPage';
import AuthPage from './pages/AuthPage';
import Sidebar from './components/Sidebar';
import useAuthStore from './stores/authStore';
import useAppStore from './stores/appStore';
import './styles/index.scss';

// Memoize the Sidebar component to prevent unnecessary re-renders
const MemoizedSidebar = memo(({ selectedNotebook, onNotebookSelect, onLogout }) => (
  <Sidebar
    selectedNotebook={selectedNotebook}
    onNotebookSelect={onNotebookSelect}
    onLogout={onLogout}
  />
));
MemoizedSidebar.displayName = 'MemoizedSidebar';

export default function App() {
  // Extract state values individually to avoid selector function issues
  const currentPage = useAppStore((state) => state.currentPage);
  const currentView = useAppStore((state) => state.currentView);
  const inputType = useAppStore((state) => state.inputType);
  const selectedNotebook = useAppStore((state) => state.selectedNotebook);
  const setState = useAppStore((state) => state.setState);

  // Auth state - extract individually
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  // Verify authentication status from the server
  useEffect(() => {
    const verifyAuth = async () => {
      // Skip check if we're already not authenticated
      if (!token) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          // If not authenticated, log out
          logout();
          setState({
            currentPage: 'auth',
            currentView: 'welcome',
            selectedNotebook: 'home'
          });
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        // On error, log out
        logout();
        setState({
          currentPage: 'auth',
          currentView: 'welcome',
          selectedNotebook: 'home'
        });
      }
    };
    
    verifyAuth();
  }, [token, logout, setState]);

  // Force redirect to home page when authenticated
  useEffect(() => {
    if (isAuthenticated && (currentPage === 'auth' || currentPage === '')) {
      setState({
        currentPage: 'home',
        currentView: 'welcome',
        selectedNotebook: 'home'
      });
    }
  }, [isAuthenticated, currentPage, setState]);

  const handleNotebookSelect = useCallback((notebookId) => {
    setState({
      selectedNotebook: notebookId,
      currentPage: 'generator'
    });
  }, [setState]);

  const handleSidebarNotebookSelect = useCallback((notebookId) => {
    if (notebookId === 'home') {
      setState({
        selectedNotebook: notebookId,
        currentPage: 'home',
        currentView: 'welcome'
      });
    } else {
      setState({
        selectedNotebook: notebookId,
        currentPage: 'generator'
      });
    }
  }, [setState]);

  const handleNavigate = useCallback((page) => {
    // Handle authentication redirect
    if (!isAuthenticated && page !== 'auth') {
      setState({ currentPage: 'auth' });
      return;
    }

    // If we're authenticated and trying to go to auth page, redirect to home
    if (isAuthenticated && page === 'auth') {
      setState({ 
        currentPage: 'home',
        currentView: 'welcome',
        selectedNotebook: 'home' 
      });
      return;
    }

    // Prevent unnecessary state updates
    if (page === currentPage) {
      return;
    }

    // Use a single setState call for each case to batch updates
    switch (page) {
      case 'create-note':
        setState({
          inputType: 'text',
          currentPage: 'notebook-selector'
        });
        break;
      case 'upload-pdf':
        setState({
          inputType: 'pdf',
          currentPage: 'notebook-selector'
        });
        break;
      case 'generator':
        if (!selectedNotebook || selectedNotebook === 'home') {
          setState({ currentPage: 'notebook-selector' });
        } else {
          setState({ currentPage: 'generator' });
        }
        break;
      case 'home':
        setState({
          selectedNotebook: 'home',
          currentPage: 'home',
          currentView: 'welcome',
          inputType: 'text'
        });
        break;
      default:
        setState({ currentPage: page });
    }
  }, [currentPage, isAuthenticated, selectedNotebook, setState]);

  const handleLogout = useCallback(() => {
    logout();
    setState({
      currentPage: 'auth',
      currentView: 'welcome',
      selectedNotebook: 'home'
    });
  }, [logout, setState]);

  const getPageKey = useMemo(() => {
    return currentPage === 'generator'
      ? `${currentPage}-${selectedNotebook}`
      : currentPage;
  }, [currentPage, selectedNotebook]);

  // Render the current page based on state
  const renderPage = useCallback(() => {
    if (!isAuthenticated) {
      return <AuthPage onNavigate={handleNavigate} />;
    }

    switch (currentPage) {
      case 'auth':
        // Don't show auth page when already authenticated
        return <HomePage onNavigate={handleNavigate} />;
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'generator':
        return (
          <NotesGeneratorPage
            onBack={() => handleNavigate('home')}
            inputType={inputType}
            notebookId={selectedNotebook}
            key={selectedNotebook} // Force re-render when notebook changes
          />
        );
      case 'note-detail':
        return <NoteDetailPage onBack={() => handleNavigate('home')} />;
      case 'notebook-selector':
        return (
          <NotebookSelectorPage
            onBack={() => handleNavigate('home')}
            onNotebookSelect={handleNotebookSelect}
            inputType={inputType}
          />
        );
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  }, [currentPage, handleNavigate, handleNotebookSelect, inputType, isAuthenticated, selectedNotebook]);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="app-container">
              {isAuthenticated && (
                <MemoizedSidebar
                  selectedNotebook={selectedNotebook}
                  onNotebookSelect={handleSidebarNotebookSelect}
                  onLogout={handleLogout}
                />
              )}

              <div className={`main-content ${!isAuthenticated ? 'full-width' : ''}`}>
                <AnimatePresence mode="wait" initial={false}>
                  <div 
                    key={currentPage === 'generator' ? `${currentPage}-${selectedNotebook}` : currentPage}
                    className="page-container"
                  >
                    {renderPage()}
                  </div>
                </AnimatePresence>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}