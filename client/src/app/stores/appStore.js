import { create } from 'zustand';

const useAppStore = create((set) => ({
  // Navigation state
  currentPage: 'home',  // 'auth', 'home', 'generator', 'note-detail', 'notebook-selector'
  currentView: 'welcome', // 'welcome', 'notes', 'settings'

  // Input state
  inputType: 'text', // 'text', 'pdf'

  // Notebook state
  notebooks: [],
  selectedNotebook: 'home', // 'home' is special navigation state, not a notebook

  // Notes state
  notes: [],
  selectedNote: null,

  // Batch update method to prevent re-renders
  setState: (updates) => set((state) => ({ ...updates })),

  // Individual actions
  setCurrentPage: (page) => set({ currentPage: page }),
  setCurrentView: (view) => set({ currentView: view }),
  setInputType: (type) => set({ inputType: type }),
  setSelectedNotebook: (notebookId) => set({ selectedNotebook: notebookId }),
  setSelectedNote: (noteId) => set({ selectedNote: noteId }),

  // Notebook actions
  addNotebook: (notebook) =>
    set((state) => ({
      notebooks: [...state.notebooks, notebook]
    })),

  setNotebooks: (notebooks) =>
    set({ notebooks }),

  updateNotebook: (notebookId, data) =>
    set((state) => ({
      notebooks: state.notebooks.map((notebook) =>
        notebook.id === notebookId
          ? { ...notebook, ...data }
          : notebook
      )
    })),

  deleteNotebook: (notebookId) =>
    set((state) => ({
      notebooks: state.notebooks.filter((notebook) => notebook.id !== notebookId),
      // Reset selected notebook if deleted
      selectedNotebook: state.selectedNotebook === notebookId ? 'home' : state.selectedNotebook
    })),

  // Note actions
  addNote: (note) =>
    set((state) => ({
      notes: [...state.notes, note]
    })),

  setNotes: (notes) =>
    set({ notes }),
  
  setNotebookNotes: (notebookId, notebookNotes) =>
    set((state) => {
      // Filter out old notes for this notebook
      const filteredNotes = state.notes.filter(note => note.notebook !== notebookId);
      // Add new notes for this notebook
      return {
        notes: [...filteredNotes, ...notebookNotes]
      };
    }),

  updateNote: (noteId, data) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === noteId
          ? { ...note, ...data }
          : note
      )
    })),

  deleteNote: (noteId) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== noteId),
      // Reset selected note if deleted
      selectedNote: state.selectedNote === noteId ? null : state.selectedNote
    })),

  // Reset state
  resetState: () => set({
    currentPage: 'auth',
    currentView: 'welcome',
    inputType: 'text',
    selectedNotebook: 'home',
    selectedNote: null
  })
}));

export default useAppStore;
