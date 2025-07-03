import { create } from 'zustand';

const useAuthStore = create((set) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  viewPreference: 'split', // Default view preference

  // Actions
  login: async (token, user) => {
    // Set authenticated immediately with provided token and user
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      viewPreference: user.viewPreference || 'split' // Use user's preference or default to split
    });
    return { success: true };
  },

  // Update view preference
  updateViewPreference: async (preference) => {
    set({ viewPreference: preference });
    return { success: true };
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      // Simulated registration success for now
      // In a real app, you would make an API call here
      const user = {
        name,
        email,
        id: `user-${Date.now()}`,
        viewPreference: 'split' // Default view preference for new users
      };

      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        viewPreference: 'split'
      });

      return { success: true };
    } catch (err) {
      set({
        error: err.message || 'Failed to register',
        isLoading: false
      });
      return { success: false, error: err.message };
    }
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      viewPreference: 'split' // Reset to default on logout
    });
  },

  clearError: () => set({ error: null })
}));

export default useAuthStore;
