'use client';
import React, { useState, useEffect } from 'react';
import { motion } from '../lib/motion';
import PropTypes from 'prop-types';
import Sidebar from '../components/Sidebar';
import NoteDetail from '../components/NoteDetail';
import useAppStore from '../stores/appStore';
import useAuthStore from '../stores/authStore';

const NoteDetailPage = ({ onBack, noteId, setCurrentPage}) => {
  // Get data from Zustand store
  const selectedNotebook = useAppStore((state) => state.selectedNotebook);
  const notes = useAppStore((state) => state.notes);
  const setState = useAppStore((state) => state.setState);
  
  // Get auth token
  const token = useAuthStore((state) => state.token);
  
  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNote = async () => {
      if (!noteId || !token) return;
      
      // Try to find note in store first
      const foundNote = notes.find(n => n.id === noteId);
      if (foundNote) {
        setNote(foundNote);
        return;
      }
      
      // If not found in store, fetch from API
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes/${noteId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch note');
        }
        
        const data = await response.json();
        setNote(data.data.note);
      } catch (error) {
        console.error('Error fetching note:', error);
        setError('Failed to load note. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNote();
  }, [noteId, notes, token]);

  const handleNotebookSelect = (notebookId) => {
    // Update state in Zustand store
    setState({ selectedNotebook: notebookId });
  };

  return (
    <div className="app-container">
      <Sidebar
        setCurrentPage={setCurrentPage}
        selectedNotebook={selectedNotebook}
        onNotebookSelect={handleNotebookSelect}
      />

      <main className="main-content">
        {isLoading ? (
          <div className="loading">Loading note...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : note ? (
          <NoteDetail note={note} onBack={onBack} />
        ) : (
          <div className="not-found">Note not found</div>
        )}
      </main>
    </div>
  );
};

NoteDetailPage.propTypes = {
  onBack: PropTypes.func.isRequired,
  noteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

NoteDetailPage.defaultProps = {
  noteId: null
};

export default NoteDetailPage;
