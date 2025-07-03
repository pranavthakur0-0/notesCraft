'use client';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import NotesInput from '../components/NotesInput';
import GeneratedNotesView from '../components/GeneratedNotesView';
import useAuthStore from '../stores/authStore';
import useAppStore from '../stores/appStore';
import Note from '../models/noteModel';
import llmService from '../services/llmService';

function NotesGeneratorPage({
  inputType: initialInputType,
  notebookId,
  onBack,
}) {
  const [inputType, setInputType] = useState(initialInputType || 'text');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Get auth token
  const token = useAuthStore((state) => state.token);
  
  // Get app state from Zustand
  const notebooks = useAppStore((state) => state.notebooks);
  const notes = useAppStore((state) => state.notes);
  const addNote = useAppStore((state) => state.addNote);
  const updateNote = useAppStore((state) => state.updateNote);
  const setNotes = useAppStore((state) => state.setNotes);
  
  // Current notebook and notes
  const [notebookData, setNotebookData] = useState(null);
  const [notebookNotes, setNotebookNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState(null);

  // Fetch notebook data
  useEffect(() => {
    const fetchNotebookData = async () => {
      if (notebookId === 'home' || !notebookId || !token) return;
      
      setIsLoading(true);
      setError('');
      try {
        // Try to find notebook in store first
        const foundNotebook = notebooks.find(nb => nb.id === notebookId);
        if (foundNotebook) {
          setNotebookData(foundNotebook);
        }
        
        // Fetch notes for this notebook
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes?notebook=${notebookId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch notes');
        }
        
        const data = await response.json();
        const fetchedNotes = data.data.notes.map(note => Note.fromAPI(note));
        
        // Update local state
        setNotebookNotes(fetchedNotes);
        
        // Set current note if we have any
        if (fetchedNotes.length > 0) {
          setCurrentNote(fetchedNotes[0]);
        }
      } catch (error) {
        console.error('Error fetching notebook data:', error);
        setError('Failed to load notebook data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchNotebookData();
  }, [notebookId, notebooks, token]);

  const handleGenerateNotes = async (text, isTopic = false) => {
    if (!text.trim() || !notebookId || notebookId === 'home') return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      let responseData;
      
      if (isTopic) {
        // Generate notes from topic using the new API endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/raw-inputs/generate-from-topic`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            topic: text,
            notebook: notebookId
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate notes from topic');
        }
        
        responseData = await response.json();
      } else {
        // Create note object for regular text
        const noteData = {
          content: text,
          notebook: notebookId
        };
        
        // Save to API using the existing multi notes endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/raw-inputs/multi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(noteData)
        });
        
        if (!response.ok) {
          // Check for rate limit response
          if (response.status === 429) {
            const errorData = await response.json();
            
            if (errorData.limitReached) {
              const resetTime = new Date(errorData.nextReset);
              const formattedTime = resetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const formattedDate = resetTime.toLocaleDateString([], { month: 'short', day: 'numeric' });
              
              throw new Error(`Daily limit reached: You've used all 10 LLM requests for today. Limit resets at midnight (${formattedTime} on ${formattedDate}).`);
            }
          }
          
          throw new Error('Failed to generate notes');
        }
        
        responseData = await response.json();
      }
      
      // Process the response
      console.log(responseData);
      
      if (responseData.data && responseData.data.notes && Array.isArray(responseData.data.notes)) {
        // Process multiple notes from response
        const newNotes = responseData.data.notes.map(note => Note.fromAPI(note));
        
        // Update Zustand store with all new notes
        newNotes.forEach(note => addNote(note));
        
        // Set the first note as current note
        if (newNotes.length > 0) {
          setCurrentNote(newNotes[0]);
        }
        
        // Update local state with all new notes
        setNotebookNotes(prev => [...newNotes, ...prev]);
      } else if (responseData.data && responseData.data.note) {
        // Handle single note response (backward compatibility)
        const newNote = Note.fromAPI(responseData.data.note);
        addNote(newNote);
        setCurrentNote(newNote);
        setNotebookNotes(prev => [newNote, ...prev]);
      }
    } catch (error) {
      console.error('Error generating notes:', error);
      setError(error.message || 'Failed to generate notes. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="notes-generator">
      {isLoading && (
        <div className="notes-generator__loading">
          <div className="notes-generator__loading-indicator">
            <div className="notes-generator__loading-spinner" />
            <p>Loading notebook content...</p>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="notes-generator__loading">
          <div className="notes-generator__loading-indicator">
            <div className="notes-generator__loading-spinner" />
            <p>Generating and saving notes...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="notes-generator__error">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !isGenerating && (
        <div className="notes-generator__content">
          {/* {notebookData && (
            <div className="notes-generator__header">
              <h2>{notebookData.name}</h2>
            </div>
          )} */}

          {currentNote ? (
            <GeneratedNotesView
              notebookName={notebookData?.name}
              generatedNotes={currentNote.content}
              rawInputID={notebookData?.latestRawInput}
              selectedNotebook={notebookId}
              noteId={currentNote.id}
            />
          ) : (
            <div className="notes-generator__input-container">
              <NotesInput
                onGenerateNotes={handleGenerateNotes}
                inputType={inputType}
                setInputType={setInputType}
              />
            </div>
          )}
          
          {notebookNotes.length > 0 && !currentNote && (
            <div className="notes-generator__existing-notes">
              <h3>Your existing notes</h3>
              <ul className="notes-list">
                {notebookNotes.map(note => (
                  <li key={note.id} className="notes-list-item">
                    <button onClick={() => setCurrentNote(note)}>
                      {note.title || 'Untitled Note'} - {new Date(note.createdAt).toLocaleDateString()}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

NotesGeneratorPage.propTypes = {
  inputType: PropTypes.string,
  notebookId: PropTypes.string,
  // We still define onBack and setCurrentPage in propTypes for TypeScript compatibility,
  // even though we're not using them in this component
  onBack: PropTypes.func,
  setCurrentPage: PropTypes.func,
};

NotesGeneratorPage.defaultProps = {
  inputType: 'text',
  notebookId: null,
  onBack: () => {},
  setCurrentPage: () => {},
};

export default NotesGeneratorPage;
