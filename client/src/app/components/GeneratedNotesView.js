import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from '../lib/motion';
import {
  FiDownload,
  FiMessageCircle,
  FiX,
  FiSend,
  FiEdit,
  FiFileText,
  FiArrowLeft,
  FiTrash2,
  FiPlus,
  FiSave,
  FiColumns,
  FiCode,
  FiGrid,
  FiBookOpen,
  FiLoader
} from 'react-icons/fi';
import jsPDF from 'jspdf';
import useAuthStore from '../stores/authStore';
import useAppStore from '../stores/appStore';
import api from '../services/apiService';
import { useRouter } from 'next/navigation';
import Note from '../models/noteModel';
import llmService from '../services/llmService';

function GeneratedNotesView({
  notebookName,
  generatedNotes: propsGeneratedNotes,
  rawInputID: propRawInputID,
  selectedNotebook,
  noteId
}) {

  const [expandedNote, setExpandedNote] = useState(null);
  const [showQuestion, setShowQuestion] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split', 'notes', or 'raw'
  const [questionHistory, setQuestionHistory] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [generatedNotesState, setGeneratedNotesState] = useState(propsGeneratedNotes);
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rawContent, setRawContent] = useState('');
  const [isLoadingRawContent, setIsLoadingRawContent] = useState(false);
  const [rawContentError, setRawContentError] = useState('');
  
  // State for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Get auth token and view preference
  const token = useAuthStore(state => state.token);
  const viewPreference = useAuthStore(state => state.viewPreference);
  const updateViewPreference = useAuthStore(state => state.updateViewPreference);
  
  // Get notes from store
  const notes = useAppStore(state => state.notes);
  const updateNote = useAppStore(state => state.updateNote);
  const deleteNote = useAppStore(state => state.deleteNote);
  const notebooks = useAppStore(state => state.notebooks);
  const deleteNotebook = useAppStore(state => state.deleteNotebook);
  const setCurrentView = useAppStore(state => state.setCurrentView);
  const setCurrentPage = useAppStore(state => state.setCurrentPage);
  
  // Router for navigation
  const router = useRouter();

  // New state for custom notes
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteSupporting, setNewNoteSupporting] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [qaHistory, setQaHistory] = useState([]);

  // Function to fetch raw content for a notebook
  const fetchRawContent = useCallback(async (rawInputID) => {
    if (!token || !rawInputID || rawInputID === 'home') {
      setRawContent('');
      return;
    }
    
    setIsLoadingRawContent(true);
    setRawContentError('');
    
    try {
      const result = await api.notebook.getNotebookRawContent(token, rawInputID);
      if (result.data.rawInput.content) {
        setRawContent(result.data.rawInput.content);
      } else {
        setRawContent('No raw content available for this notebook.');
      }
    } catch (error) {
      console.error('Error fetching raw content:', error);
      setRawContentError('Failed to load raw content. Please try again.');
      setRawContent('');
    } finally {
      setIsLoadingRawContent(false);
    }
  }, [token]);

  // Use notes from Zustand store instead of localStorage
  const fetchNotesForNotebook = useCallback(async (notebookId) => {
    if (!token || !notebookId || notebookId === 'home') return;

    setIsLoading(true);
    try {
      const result = await api.note.getAllNotes(token, notebookId);
      console.log(result, "//////////////////////////");

      const processedNotes = result.data.notes.map(note => {
        return {
          ...Note.fromAPI(note),
          supporting: note.supporting || ''  // Force set supporting
        };
      });
      return processedNotes;
    } catch (error) {
      console.error('Error fetching notes for notebook:', error);
      setError('Failed to load notes. Please try again.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  // Fetch raw content when notebook changes
  useEffect(() => {
    fetchRawContent(selectedNotebook);
  }, [selectedNotebook, fetchRawContent]);

  // Filter notes based on selected notebook
  useEffect(() => {
    const fetchNotes = async () => {
      // Set filtered notes from store
      let filtered;
      if (selectedNotebook === 'home') {
        filtered = notes;
      } else {
        filtered = notes.filter(note => note.notebook === selectedNotebook);
        
        // If we don't have any notes for this notebook in store, fetch them
        if (filtered.length === 0) {
          const fetchedNotes = await fetchNotesForNotebook(selectedNotebook);
          if (fetchedNotes && fetchedNotes.length > 0) {
            filtered = fetchedNotes;
          }
        }
      }
      
      
      // Add random background colors to notes that don't have them
      filtered = filtered.map(note => {
        if (!note.bgColor) {
          return { ...note, bgColor: getRandomColor() };
        }
        return note;
      });
      
      setFilteredNotes(filtered);
    };
    
    fetchNotes();
  }, [selectedNotebook, notes, fetchNotesForNotebook]);

  // Handle notebook selection changes
  useEffect(() => {
    // Update generated notes when switching notebooks
    if (propsGeneratedNotes) {
      setGeneratedNotesState(propsGeneratedNotes);
    }
  }, [selectedNotebook, propsGeneratedNotes]);

  // Function to get notebook name
  const getNotebookName = (notebookId) => {
    // Find notebook in store
    const notebook = notebooks.find(nb => nb.id === notebookId);
    if (notebook) {
      return notebook.name;
    }
    return notebookId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Get notebook name for the title
    const notebookName = selectedNotebook === 'home'
      ? 'All Notes'
      : getNotebookName(selectedNotebook);

    // Add title
    doc.setFontSize(22);
    doc.text(`${notebookName} Notes`, 20, 20);

    // Add content
    doc.setFontSize(12);

    const contentToUse = expandedNote
      ? expandedNote.content
      : filteredNotes.map(note => `${note.title}\n${note.content}`).join('\n\n');

    const splitText = doc.splitTextToSize(contentToUse, 170);
    doc.text(splitText, 20, 40);

    // Save PDF with notebook name
    doc.save(`${notebookName.toLowerCase().replace(/\s/g, '-')}-notes.pdf`);
  };


  const handleExpandNote = (note) => {
    if (token && note.id) {
      console.log("Expanding note:", note);
      setExpandedNote(note);
      setIsLoading(true);
      api.note.getNote(token, note.id)
        .then(result => {
          const noteData = result.data.note;
          const freshNote = {
            ...Note.fromAPI(noteData),
            supporting: noteData.supporting || ''  
          };
          setExpandedNote(freshNote);
          
          // Update Q&A history from the response
          if (result.data.qaHistory) {
            setQaHistory(result.data.qaHistory);
            // Also update question history for backward compatibility
            setQuestionHistory(result.data.qaHistory.map(qa => ({
              question: qa.question,
              answer: qa.answer
            })));
          }
        })
        .catch(err => {
          console.error("Error fetching fresh note:", err);
          setExpandedNote(note);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setExpandedNote(note);
    }
    
    setQuestion('');
    setAnswer('');
  };

  const handleCloseExpandedNote = () => {
    setExpandedNote(null);
    setShowQuestion(false);
    setQuestion('');
    setAnswer('');
    setIsLoading(false);
  };

  const handleDeleteQuestion = async (index) => {
    try {
      const qaToDelete = qaHistory[index];
      if (qaToDelete._id && expandedNote?.id) {
        // Delete QA from the backend
        await api.note.deleteQA(token, expandedNote.id, qaToDelete._id);
      }
      
      // Update both states
      setQaHistory(prev => prev.filter((_, i) => i !== index));
      setQuestionHistory(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error deleting question:', error);
      setError('Failed to delete question. Please try again.');
    }
  };

  // New handlers for custom notes functionality
  const handleCreateNote = () => {
    setIsCreatingNote(true);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteSupporting('');
    setEditingNoteId(null);
  };

  const handleEditNote = (note) => {
    setIsCreatingNote(true);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setNewNoteSupporting(note.supporting || '');
    setEditingNoteId(note.id);
  };

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim() || !selectedNotebook) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      if (editingNoteId) {
        // Update existing note
        const result = await api.note.updateNote(token, editingNoteId, {
          title: newNoteTitle,
          content: newNoteContent,
          supporting: newNoteSupporting
        });
        
        // Update note in store
        const updatedNote = {
          ...Note.fromAPI(result.data.note),
          supporting: result.data.note.supporting || ''
        };
        updateNote(editingNoteId, updatedNote);
        
        // Update expanded note if it's the one being edited
        if (expandedNote && expandedNote.id === editingNoteId) {
          setExpandedNote(updatedNote);
        }
        
        // Update filtered notes
        setFilteredNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === editingNoteId ? updatedNote : note
          )
        );
      } else {
        // Create new note
        const result = await api.note.createNote(token, {
          title: newNoteTitle,
          content: newNoteContent,
          supporting: newNoteSupporting,
          rawInput: newNoteContent,
          notebook: selectedNotebook
        });
        
        // Add new note to filtered notes
        const newNote = {
          ...Note.fromAPI(result.data.note),
          supporting: result.data.note.supporting || ''
        };
        setFilteredNotes(prevNotes => [newNote, ...prevNotes]);
      }
      
      // Reset state
      setIsCreatingNote(false);
      setNewNoteTitle('');
      setNewNoteContent('');
      setNewNoteSupporting('');
      setEditingNoteId(null);
    } catch (error) {
      console.error('Error saving note:', error);
      setError('Failed to save note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelCreateNote = () => {
    setIsCreatingNote(false);
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteSupporting('');
    setEditingNoteId(null);
  };

  const handleDeleteCustomNote = (noteId) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    updateNote(noteId, null);

    if (expandedNote && expandedNote.id === noteId) {
      handleCloseExpandedNote();
    }
  };

  // Generate nice color for note cards
  const getRandomColor = () => {
    // Generate a controlled random hue (0-360)
    const hue = Math.floor(Math.random() * 360);
    
    // Use controlled saturation range for pleasant colors (40-60%)
    const saturation = Math.floor(Math.random() * 20 + 40);
    
    // Use controlled lightness range that's darker than light but not too dark (75-85%)
    const lightness = Math.floor(Math.random() * 10 + 75);
    
    // Use controlled opacity
    const opacity = 0.5;
    
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
  };

  const detectCodeContent = (text) => {
    // Simple heuristic to detect if content looks like code
    const codePatterns = [
      /function\s+\w+\s*\(/i,      // function declarations
      /class\s+\w+/i,              // class declarations
      /import\s+.*from/i,          // import statements
      /const\s+\w+\s*=/i,          // const declarations
      /let\s+\w+\s*=/i,            // let declarations
      /var\s+\w+\s*=/i,            // var declarations
      /if\s*\(.+\)\s*{/i,          // if statements
      /for\s*\(.+\)\s*{/i,         // for loops
      /while\s*\(.+\)\s*{/i,       // while loops
      /^\s*[#].*$/m,               // Python/shell comments
      /^\s*\/\/.*$/m,              // JavaScript/C/C++ comments
      /[\s\S]*[{}]\s*;?\s*$/m,     // code blocks with braces
      /^\s*<.*>[\s\S]*<\/.*>$/m,   // HTML-like content
    ];

    return codePatterns.some(pattern => pattern.test(text));
  };

  // Handle delete note from API
  const handleDeleteNote = async (noteId) => {
    if (!noteId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await api.note.deleteNote(token, noteId);
      
      // Delete note from store
      deleteNote(noteId);
      
      // Reset state if the deleted note is the expanded note
      if (expandedNote && expandedNote.id === noteId) {
        setExpandedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete notebook
  const handleDeleteNotebook = async () => {
    if (!selectedNotebook || selectedNotebook === 'home') return;
    
    // Show confirmation modal
    setShowDeleteModal(true);
  };
  
  // Confirm deletion of notebook
  const confirmDeleteNotebook = async () => {
    setShowDeleteModal(false);
    setIsLoading(true);
    setError('');
    
    try {
      // Delete notebook via API
      await api.notebook.deleteNotebook(token, selectedNotebook);
      
      // Remove notebook from store
      deleteNotebook(selectedNotebook);
      
      // Update view to show welcome screen
      setCurrentView('welcome');
      setCurrentPage('home');
      
      // Navigate back to home
      router.push('/');
    } catch (error) {
      console.error('Error deleting notebook:', error);
      setError('Failed to delete notebook. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle asking question about a note
  const handleAskQuestion = async () => {
    if (!question.trim() || isAnswering) return;
    
    setIsAnswering(true);
    setError('');
    
    try {
      // Call LLM service to get answer for the question
      const result = await llmService.askQuestion(
        token,
        expandedNote.id,
        question,
        rawContent,
        expandedNote.content
      );
      
      // Update answer state
      const responseAnswer = result?.data?.answer || "Sorry, I couldn't generate an answer.";
      setAnswer(responseAnswer);
      
      // Add to question history
      const newQA = {
        question,
        answer: responseAnswer,
        createdAt: new Date().toISOString()
      };
      
      setQaHistory(prev => [newQA, ...prev]);
      setQuestionHistory(prev => [newQA, ...prev]);
      
      // Reset question input
      setQuestion('');
    } catch (error) {
      console.error('Error asking question:', error);
      
      // Check if it's a rate limit error
      if (error.isRateLimited) {
        setError(error.message);
        setAnswer(`Rate limit reached: ${error.message}`);
      } else {
        setError('Failed to get answer. Please try again.');
        setAnswer('Sorry, an error occurred while processing your question.');
      }
    } finally {
      setIsAnswering(false);
    }
  };

  // Handle view mode change
  const handleViewModeChange = async (newMode) => {
    try {
      // Update backend
      await api.auth.updateViewPreference(token, newMode);
      // Update local state
      await updateViewPreference(newMode);
    } catch (error) {
      console.error('Failed to update view preference:', error);
    }
  };

  // Expanded Note View
  if (expandedNote) {
    return (
      <div className="note-detail">
        {isCreatingNote ? (
          <div className="create-note">
            <div className="create-note__header">
              <h3>Edit Note</h3>
              <button 
                className="btn-icon" 
                onClick={handleCancelCreateNote}
              >
                <FiX />
              </button>
            </div>

            <div className="create-note__content">
              <div className="form-group">
                <label htmlFor="note-title">Title</label>
                <input
                  id="note-title"
                  type="text"
                  className="form-control"
                  placeholder="Enter note title..."
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
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
              </div>

              <div className="form-group">
                <label htmlFor="note-content">Content</label>
                <textarea
                  id="note-content"
                  className="form-control"
                  placeholder="Enter note content..."
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={10}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#1e293b',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    width: '100%',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div className="form-group">
                <label htmlFor="note-supporting">Additional Information</label>
                <textarea
                  id="note-supporting"
                  className="form-control"
                  placeholder="Enter supporting information, formulas, or examples..."
                  value={newNoteSupporting}
                  onChange={(e) => setNewNoteSupporting(e.target.value)}
                  rows={5}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#1e293b',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    width: '100%',
                    fontSize: '0.95rem',
                    transition: 'all 0.2s ease',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div className="create-note__actions">
                <button
                  className="btn btn-secondary"
                  onClick={handleCancelCreateNote}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveNote}
                  disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
                >
                  <FiSave /> Update Note
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <button
              className="note-detail__back"
              onClick={handleCloseExpandedNote}
            >
              <FiArrowLeft /> Back to Notes
            </button>

            <div className="note-detail__header">
              <h2>{expandedNote.title}</h2>

              <div className="note-detail__actions">
                <button
                  className="btn-icon"
                  onClick={() => handleEditNote(expandedNote)}
                  aria-label="Edit note"
                >
                  <FiEdit />
                </button>
                <button
                  className="btn-icon"
                  onClick={() => setShowQuestion(!showQuestion)}
                  aria-label="Ask question"
                >
                  <FiMessageCircle />
                </button>
                <button
                  className="btn-icon"
                  onClick={handleDownloadPDF}
                  aria-label="Download PDF"
                >
                  <FiDownload />
                </button>
                <button
                  className="btn-icon btn-danger"
                  onClick={() => handleDeleteCustomNote(expandedNote.id)}
                  aria-label="Delete note"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            <div className="note-detail__content">
          
              
              <div className="note-detail__text">
                {expandedNote.content}
              </div>

              {/* Render supporting content without any conditions */}
              <div className="note-detail__supporting">
                <h4>Additional Information</h4>
                <div className="supporting-content">
                  {expandedNote.supporting || "No additional information available."}
                </div>
              </div>

              {qaHistory.length > 0 && (
                <div className="note-detail__questions" style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  background: 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ marginBottom: '1rem', color: '#333', fontSize: '1rem' }}>Questions & Answers</h3>
                  {qaHistory.map((qa, index) => (
                    <div key={qa._id || index} style={{
                      marginBottom: '1.2rem',
                      padding: '0.8rem',
                      background: 'white',
                      borderRadius: '6px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.4rem'
                      }}>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#666',
                          fontStyle: 'italic'
                        }}>
                          {new Date(qa.createdAt).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <button
                          className="btn-icon btn-sm"
                          onClick={() => handleDeleteQuestion(index)}
                          title="Delete question"
                          style={{
                            padding: '0.2rem',
                            color: '#666',
                            transition: 'color 0.2s'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.color = '#dc2626'}
                          onMouseOut={(e) => e.currentTarget.style.color = '#666'}
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, color: '#2563eb', minWidth: '1.2rem', fontSize: '0.85rem' }}>Q:</span>
                          <span style={{ flex: 1, lineHeight: 1.4, color: '#1f2937', fontSize: '0.85rem', fontWeight: 'bold' }}>{qa.question}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 600, color: '#2563eb', minWidth: '1.2rem', fontSize: '0.85rem' }}>A:</span>
                          <span style={{ flex: 1, lineHeight: 1.4, color: '#374151', fontSize: '0.85rem' }}>{qa.answer}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence>
              {showQuestion && (
                <motion.div
                  className="note-detail__question-box"
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25 }}
                >
                  <div className="question-input">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ask a question about this note..."
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      disabled={isAnswering}
                      onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
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
                    <button
                      className="btn btn-primary"
                      onClick={handleAskQuestion}
                      disabled={isAnswering || !question.trim()}
                    >
                      {isAnswering ? 'Processing...' : <FiSend />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    );
  }

  // New Note Creation Form
  if (isCreatingNote) {
    return (
      <div className="create-note">
        <div className="create-note__header">
          <h3>{editingNoteId ? 'Edit Note' : 'Create New Note'}</h3>
          <button
            className="btn-icon"
            onClick={handleCancelCreateNote}
          >
            <FiX />
          </button>
        </div>

        <div className="create-note__content">
          <div className="form-group">
            <label htmlFor="note-title">Title</label>
            <input
              id="note-title"
              type="text"
              className="form-control"
              placeholder="Enter note title..."
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
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
          </div>

          <div className="form-group">
            <label htmlFor="note-content">Content</label>
            <textarea
              id="note-content"
              className="form-control"
              placeholder="Enter note content..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={10}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                width: '100%',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="note-supporting">Additional Information</label>
            <textarea
              id="note-supporting"
              className="form-control"
              placeholder="Enter supporting information, formulas, or examples..."
              value={newNoteSupporting}
              onChange={(e) => setNewNoteSupporting(e.target.value)}
              rows={5}
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                color: '#1e293b',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                width: '100%',
                fontSize: '0.95rem',
                transition: 'all 0.2s ease',
                resize: 'vertical'
              }}
            />
          </div>

          <div className="create-note__actions">
            <button
              className="btn btn-secondary"
              onClick={handleCancelCreateNote}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveNote}
              disabled={!newNoteTitle.trim() || !newNoteContent.trim()}
            >
              <FiSave /> {editingNoteId ? 'Update Note' : 'Save Note'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-view">
      {/* Loading overlay */}
      {(isLoading || isLoadingRawContent) && (
        <div className="loading-overlay">
          <div className="loading-overlay__content">
            <FiLoader className="loading-spinner" />
            <p>Loading notebook content...</p>
          </div>
        </div>
      )}
      
      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Delete Notebook</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this notebook? This action cannot be undone.</p>
              <p className="warning">All notes in this notebook will be deleted.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDeleteNotebook}
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="notes-view__header">
        <h2 className="notes-view__title">{notebookName}</h2>
        
        <div className="notes-view__actions">
          <button 
            className="btn btn-outline"
            onClick={() => handleViewModeChange(viewPreference === 'split' ? 'grid' : 'split')}
          >
            {viewPreference === 'split' ? <FiGrid /> : <FiColumns />} 
            {viewPreference === 'split' ? 'Grid View' : 'Split View'}
          </button>
          <button 
            className="btn btn-outline"
            onClick={handleDownloadPDF}
          >
            <FiDownload /> PDF
          </button>
          {selectedNotebook !== 'home' && (
            <button 
              className="btn btn-outline btn-danger"
              onClick={handleDeleteNotebook}
              title="Delete notebook"
            >
              <FiTrash2 /> Delete Notebook
            </button>
          )}
        </div>
      </div>

      <div className="notes-view__content">
        <AnimatePresence mode="wait">
          {viewPreference === 'split' ? (
            <motion.div
              key="split-view"
              className="split-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="split-view__panel">
                <div className="panel-header">
                  <h3>Raw Input</h3>
                  {isLoadingRawContent && <span className="loading-indicator">Loading...</span>}
                </div>
                <div className="panel-content">
                  {rawContentError && (
                    <div className="error-message">{rawContentError}</div>
                  )}
                  <textarea
                    className={`raw-input ${showLineNumbers && detectCodeContent(rawContent) ? 'with-line-numbers' : ''}`}
                    value={rawContent}
                    readOnly
                    placeholder={isLoadingRawContent ? "Loading raw input..." : "No raw input available for this notebook."}
                  />
                </div>
              </div>

              <div className="split-view__panel">
                <div className="panel-header">
                  <h3>Generated Notes</h3>
                  <button
                    className="btn-icon"
                    onClick={handleCreateNote}
                    aria-label="Create new note"
                  >
                    <FiPlus />
                  </button>
                </div>
                <div className="panel-content">
                  <AnimatePresence>
                    {filteredNotes.length > 0 ? (
                      <div className="notes-grid">
                        {filteredNotes.map((note) => (
                          <motion.div
                            key={note.id}
                            className="note-card"
                            style={{ 
                              backgroundColor: note.bgColor,
                              display: 'flex',
                              flexDirection: 'column',
                              minHeight: '200px',
                              position: 'relative',
                              overflow: 'hidden'
                            }}
                            whileHover={{ 
                              scale: 1.02, 
                              boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                              y: -5
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleExpandNote(note)}
                          >
                            <button 
                              className="note-card__delete-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNote(note.id);
                              }}
                              aria-label="Delete note"
                              style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                zIndex: 2,
                                background: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '50%',
                                padding: '0.25rem',
                                border: 'none',
                                cursor: 'pointer'
                              }}
                            >
                              <FiTrash2 size={14} />
                            </button>

                            <div style={{ 
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '0.5rem'
                            }}>
                              <div className="note-card__meta" style={{ 
                                display: 'flex',
                                gap: '0.5rem',
                                alignItems: 'center',
                                margin: 0
                              }}>
                                {note.updatedAt && (
                                  <span className="note-card__date" style={{
                                    fontSize: '0.75rem',
                                    color: '#6b7280',
                                    margin: 0
                                  }}>
                                    {new Date(note.updatedAt).toLocaleDateString()}
                                  </span>
                                )}
                                {detectCodeContent(note.content) && (
                                  <span className="note-card__badge" style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#059669',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    margin: 0
                                  }}>Code</span>
                                )}
                              </div>

                              <h3 className="note-card__title" style={{
                                fontSize: '1.1rem',
                                fontWeight: 600,
                                margin: 0,
                                color: '#1f2937'
                              }}>{note.title}</h3>

                              <p className="note-card__content" style={{
                                fontSize: '0.9rem',
                                color: '#4b5563',
                                margin: 0,
                                flex: 1
                              }}>{note.content}</p>
                            </div>

                            <div style={{
                              padding: '0.5rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              position: 'sticky',
                              bottom: 0,
                              left: 0,
                              right: 0
                            }}>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {note.supporting && (
                                  <span style={{
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: '#2563eb',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.25rem',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                  }}>Info</span>
                                )}
                              </div>
                              <span style={{
                                color: '#7c3aed',
                                fontSize: '0.875rem',
                                fontWeight: 500
                              }}>Click to view</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <FiBookOpen size={48} />
                        <h3>No Notes Yet</h3>
                        <p>Your generated notes will appear here</p>
                        <button
                          className="btn btn-primary"
                          onClick={handleCreateNote}
                        >
                          <FiPlus /> Create Note
                        </button>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid-view"
              className="grid-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="panel-header">
                <h3>Notes</h3>
                <button
                  className="btn-icon"
                  onClick={handleCreateNote}
                  aria-label="Create new note"
                >
                  <FiPlus />
                </button>
              </div>

              <div className="panel-content">
                {filteredNotes.length > 0 ? (
                  <div className="notes-grid notes-grid--full">
                    {filteredNotes.map((note) => (
                      <motion.div
                        key={note.id}
                        className="note-card"
                        style={{ 
                          backgroundColor: note.bgColor,
                          display: 'flex',
                          flexDirection: 'column',
                          minHeight: '200px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        whileHover={{ 
                          scale: 1.02, 
                          boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                          y: -5
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleExpandNote(note)}
                      >
                        <button 
                          className="note-card__delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNote(note.id);
                          }}
                          aria-label="Delete note"
                          style={{
                            position: 'absolute',
                            top: '0.5rem',
                            right: '0.5rem',
                            zIndex: 2,
                            background: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '50%',
                            padding: '0.25rem',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <FiTrash2 size={14} />
                        </button>

                        <div style={{ 
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem'
                        }}>
                          <div className="note-card__meta" style={{ 
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'center',
                            margin: 0
                          }}>
                            {note.updatedAt && (
                              <span className="note-card__date" style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                margin: 0
                              }}>
                                {new Date(note.updatedAt).toLocaleDateString()}
                              </span>
                            )}
                            {detectCodeContent(note.content) && (
                              <span className="note-card__badge" style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                color: '#059669',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                margin: 0
                              }}>Code</span>
                            )}
                          </div>

                          <h3 className="note-card__title" style={{
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            margin: 0,
                            color: '#1f2937'
                          }}>{note.title}</h3>

                          <p className="note-card__content" style={{
                            fontSize: '0.9rem',
                            color: '#4b5563',
                            margin: 0,
                            flex: 1
                          }}>{note.content}</p>
                        </div>

                        <div style={{
                          padding: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          position: 'sticky',
                          bottom: 0,
                          left: 0,
                          right: 0
                        }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {note.supporting && (
                              <span style={{
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#2563eb',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.25rem',
                                fontSize: '0.75rem',
                                fontWeight: 500
                              }}>Info</span>
                            )}
                          </div>
                          <span style={{
                            color: '#7c3aed',
                            fontSize: '0.875rem',
                            fontWeight: 500
                          }}>Click to view</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <FiBookOpen size={48} />
                    <h3>No Notes Yet</h3>
                    <p>Your generated notes will appear here</p>
                    <button
                      className="btn btn-primary"
                      onClick={handleCreateNote}
                    >
                      <FiPlus /> Create Note
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

GeneratedNotesView.propTypes = {
  generatedNotes: PropTypes.string,
  rawInput: PropTypes.string,
  selectedNotebook: PropTypes.string.isRequired,
  noteId: PropTypes.string
};

GeneratedNotesView.defaultProps = {
  generatedNotes: '',
  rawInput: ''
};

export default GeneratedNotesView;
