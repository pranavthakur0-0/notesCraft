'use client';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion } from '../lib/motion';
import PropTypes from 'prop-types';
import { shallow } from 'zustand/shallow';
import {
  FiHome,
  FiEdit3,
  FiPlusCircle,
  FiBookmark,
  FiCalendar,
  FiClipboard,
  FiCheck,
  FiX,
  FiBook,
  FiLogOut,
} from 'react-icons/fi';
import useAuthStore from '../stores/authStore';
import useAppStore from '../stores/appStore';

function Sidebar({ onNotebookSelect, selectedNotebook, onLogout }) {
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('FiClipboard');
  const [isLoading, setIsLoading] = useState(false);

  // Get user and token from auth store with proper memoization
  const user = useAuthStore(state => state.user);
  const token = useAuthStore(state => state.token);

  // Get notebooks and add notebook action from app store
  const notebooks = useAppStore(state => state.notebooks);
  const setNotebooks = useAppStore(state => state.setNotebooks);
  const addNotebook = useAppStore(state => state.addNotebook);

  // Get the setState action
  const setState = useAppStore(state => state.setState);

  // Fetch notebooks from API when component mounts
  useEffect(() => {
    const fetchNotebooks = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notebooks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch notebooks');
        }
        
        const data = await response.json();
        setNotebooks(data.data.notebooks);
      } catch (error) {
        console.error('Error fetching notebooks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotebooks();
  }, [token, setNotebooks]);

  const sidebarVariants = {
    hidden: { x: -250, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  const iconOptions = [
    { id: 'FiCalendar', component: <FiCalendar /> },
    { id: 'FiClipboard', component: <FiClipboard /> },
    { id: 'FiEdit3', component: <FiEdit3 /> },
    { id: 'FiBookmark', component: <FiBookmark /> },
  ];

  // Function to render the correct icon component
  const getIconComponent = (iconName) => {
    const iconObj = iconOptions.find((opt) => opt.id === iconName);
    // If icon is a component, return it directly
    if (React.isValidElement(iconName)) return iconName;
    // If icon is found by name, return its component
    if (iconObj) return iconObj.component;
    // Default icon
    return <FiBook />;
  };

  const handleAddNotebook = () => {
    // Use setState directly instead of setCurrentPage
    setState({
      inputType: 'text',
      currentPage: 'notebook-selector'
    });
  };

  const handleSaveNotebook = async () => {
    if (newNotebookTitle.trim()) {
      setIsLoading(true);
      
      try {
        // Create notebook via API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notebooks`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: newNotebookTitle.trim(),
            icon: selectedIcon
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create notebook');
        }
        
        const data = await response.json();
        
        // Add notebook to store
        addNotebook(data.data.notebook);
        
        // Reset form
        setIsCreatingNotebook(false);
        setNewNotebookTitle('');
      } catch (error) {
        console.error('Error creating notebook:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCancelCreate = () => {
    setIsCreatingNotebook(false);
    setNewNotebookTitle('');
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <motion.div
      className="sidebar"
      initial="hidden"
      animate="visible"
      variants={sidebarVariants}
    >
      <h1 className="sidebar__title">Notecraft</h1>

      <div className="sidebar__section">
        <div className="sidebar__nav">
          <motion.a
            href="#"
            className={`sidebar__nav-item ${selectedNotebook === 'home' ? 'sidebar__nav-item--active' : ''}`}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setState({
                currentPage: 'home',
                currentView: 'welcome',
                selectedNotebook: 'home'
              });
            }}
          >
            <FiHome /> Home
          </motion.a>
        </div>
      </div>

      <div className="sidebar__section">
        <h2 className="sidebar__section-title">Notebooks</h2>
        <div className="sidebar__nav">
          {notebooks.map((notebook) => (
            <motion.a
              key={notebook.id}
              href="#"
              className={`sidebar__nav-item ${selectedNotebook === notebook.id ? 'sidebar__nav-item--active' : ''}`}
              onClick={() => onNotebookSelect(notebook.id)}
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              {typeof notebook.icon === 'string'
                ? getIconComponent(notebook.icon)
                : notebook.icon}{' '}
              {notebook.name}
            </motion.a>
          ))}
        </div>

        {isCreatingNotebook ? (
          <div className="sidebar__create-notebook">
            <div className="sidebar__create-notebook-input-group">
              <input
                type="text"
                className="sidebar__create-notebook-input"
                placeholder="Notebook name..."
                value={newNotebookTitle}
                onChange={(e) => setNewNotebookTitle(e.target.value)}
                ref={(input) => input && input.focus()}
              />
              <div className="sidebar__create-notebook-icons">
                {iconOptions.map((icon) => (
                  <button
                    key={icon.id}
                    type="button"
                    className={`sidebar__create-notebook-icon-btn ${selectedIcon === icon.id ? 'active' : ''}`}
                    onClick={() => setSelectedIcon(icon.id)}
                  >
                    {icon.component}
                  </button>
                ))}
              </div>
            </div>
            <div className="sidebar__create-notebook-actions">
              <motion.button
                type="button"
                className="sidebar__create-notebook-btn sidebar__create-notebook-btn--cancel"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancelCreate}
              >
                <FiX /> Cancel
              </motion.button>
              <motion.button
                type="button"
                className="sidebar__create-notebook-btn sidebar__create-notebook-btn--save"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveNotebook}
                disabled={!newNotebookTitle.trim()}
              >
                <FiCheck /> Save
              </motion.button>
            </div>
          </div>
        ) : (
          <motion.button
            type="button"
            className="sidebar__add-button"
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAddNotebook}
          >
            <FiPlusCircle /> New Notebook
          </motion.button>
        )}
      </div>

      <div className="sidebar__footer">
        <motion.button
          type="button"
          className="sidebar__footer-button sidebar__logout-button"
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
        >
          <FiLogOut /> Logout
        </motion.button>
      </div>
    </motion.div>
  );
}

Sidebar.propTypes = {
  onNotebookSelect: PropTypes.func.isRequired,
  selectedNotebook: PropTypes.string,
  onLogout: PropTypes.func,
};

Sidebar.defaultProps = {
  selectedNotebook: 'daily-notes',
  onLogout: null,
};

export default Sidebar;
