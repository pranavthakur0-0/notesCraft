'use client';
import React, { useState, useEffect } from 'react';
import { motion } from '../lib/motion';
import PropTypes from 'prop-types';
import {
  FiPlus,
  FiCheck,
  FiX,
  FiBook,
  FiCalendar,
  FiClipboard,
  FiEdit3,
  FiBookmark,
} from 'react-icons/fi';
import Notebook from '../models/notebookModel';
import useAuthStore from '../stores/authStore';
import useAppStore from '../stores/appStore';

function NotebookSelectorPage({
  onBack,
  onNotebookSelect,
  inputType,
}) {
  const [isCreatingNotebook, setIsCreatingNotebook] = useState(false);
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('FiClipboard');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get notebooks from app store
  const notebooks = useAppStore((state) => state.notebooks);
  const setNotebooks = useAppStore((state) => state.setNotebooks);
  const addNotebook = useAppStore((state) => state.addNotebook);
  
  // Get auth token
  const token = useAuthStore((state) => state.token);

  // Fetch notebooks from API when component mounts
  useEffect(() => {
    const fetchNotebooks = async () => {
      if (!token) return;
      console.log('fetching notebooks');
      setIsLoading(true);
      setError('');
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
        setNotebooks(data.data.notebooks.map(notebook => Notebook.fromAPI(notebook)));
      } catch (error) {
        console.error('Error fetching notebooks:', error);
        setError('Failed to load notebooks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotebooks();
  }, [token, setNotebooks]);

  const iconOptions = [
    { id: 'FiCalendar', component: <FiCalendar /> },
    { id: 'FiClipboard', component: <FiClipboard /> },
    { id: 'FiEdit3', component: <FiEdit3 /> },
    { id: 'FiBookmark', component: <FiBookmark /> },
  ];

  const getIconComponent = (iconName) => {
    const foundIcon = iconOptions.find((opt) => opt.id === iconName);
    return foundIcon ? foundIcon.component : <FiBook />;
  };

  const handleCreateNotebook = () => {
    setIsCreatingNotebook(true);
  };

  const handleSaveNotebook = async () => {
    if (newNotebookTitle.trim()) {
      setIsLoading(true);
      setError('');
      
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
        const newNotebook = Notebook.fromAPI(data.data.notebook);
        
        // Add to local state
        addNotebook(newNotebook);
        
        // Reset form state
        setIsCreatingNotebook(false);
        setNewNotebookTitle('');
        
        // Select the newly created notebook
        onNotebookSelect(newNotebook.id);
      } catch (error) {
        console.error('Error creating notebook:', error);
        setError('Failed to create notebook. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectNotebook = (notebookId) => {
    // Update selected notebook in Zustand store
    useAppStore.getState().setState({
      selectedNotebook: notebookId
    });

    // Navigate to notebook
    onNotebookSelect(notebookId);
  };

  return (
    <div className="notebook-select">
      <div className="notebook-select__header">
        <h1 className="notebook-select__title">Select a Notebook</h1>
      </div>

      <p className="notebook-select__subtitle">
        {inputType === 'text'
          ? 'Select an empty notebook or create a new one for your text note'
          : 'Select an empty notebook or create a new one for your PDF document'}
      </p>

      <div className="notebook-select__grid">


        {/* Create new notebook card */}
        {isCreatingNotebook ? (
          <motion.div
            className="notebook-select__card notebook-select__card--create"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h3 className="notebook-select__card-title">New Notebook</h3>
            <input
              type="text"
              className="notebook-select__card-input"
              placeholder="Notebook name..."
              value={newNotebookTitle}
              onChange={(e) => setNewNotebookTitle(e.target.value)}
              // Using ref instead of autoFocus for better accessibility
              ref={(input) => input && setTimeout(() => input.focus(), 50)}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                width: '100%',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease'
              }}
            />

            <div className="notebook-select__card-icons">
              {iconOptions.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  className={`notebook-select__card-icon-btn ${selectedIcon === icon.id ? 'active' : ''}`}
                  onClick={() => setSelectedIcon(icon.id)}
                >
                  {icon.component}
                </button>
              ))}
            </div>

            <div className="notebook-select__card-actions">
              <motion.button
                type="button"
                className="btn btn-outline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsCreatingNotebook(false)}
              >
                <FiX /> Cancel
              </motion.button>
              <motion.button
                type="button"
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveNotebook}
                disabled={!newNotebookTitle.trim()}
              >
                <FiCheck /> Create
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="notebook-select__card notebook-select__card--add"
            whileHover={{
              y: -5,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreateNotebook}
          >
            <div className="notebook-select__card-icon">
              <FiPlus />
            </div>
            <h3 className="notebook-select__card-title">
              Create New Notebook
            </h3>
            <p className="notebook-select__card-count">
              Create a fresh notebook
            </p>
          </motion.div>
        )}
             {notebooks
              .filter(notebook => notebook.latestRawInput === null)
              .map((notebook) => (
              <motion.div
                key={notebook.id}
                className="notebook-select__card"
                whileHover={{
                  y: -5,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectNotebook(notebook.id)}
          >
            <div className="notebook-select__card-icon">
              {getIconComponent(notebook.icon)}
            </div>
            <h3 className="notebook-select__card-title">{notebook.name}</h3>
            <p className="notebook-select__card-count">Empty notebook</p>
          </motion.div>))}

        {/* Show a message if there are no empty notebooks */}
        {notebooks.length === 0 && !isCreatingNotebook && (
          <motion.div
            className="notebook-select__card notebook-select__card--empty-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="notebook-select__card-title">
              No Empty Notebooks
            </h3>
            <p className="notebook-select__card-count">
              Create a new notebook to continue
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

NotebookSelectorPage.propTypes = {
  onBack: PropTypes.func.isRequired,
  onNotebookSelect: PropTypes.func.isRequired,
  inputType: PropTypes.string.isRequired,
};

export default NotebookSelectorPage;
