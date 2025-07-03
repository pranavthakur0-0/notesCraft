/**
 * LLM Service for handling LLM interactions in the client
 */
import api from './apiService';

/**
 * Service for interacting with LLMs
 */
const llmService = {
  /**
   * Ask a question about note content
   * @param {string} token - Auth token
   * @param {string} noteId - Note ID
   * @param {string} question - Question to ask
   * @param {string} rawContext - Raw context
   * @param {string} noteContent - Note content
   * @returns {Promise} - Response from API
   */
  askQuestion: async (token, noteId, question, rawContext, noteContent) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notes/${noteId}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          rawContext,
          generatedNote: noteContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get answer');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error asking question:', error);
      throw error;
    }
  },

  /**
   * Generate notes from a topic
   * @param {string} token - Auth token
   * @param {string} topic - The topic to generate notes about
   * @param {string} notebookId - ID of the notebook to save to
   * @returns {Promise} - Response from API with generated notes
   */
  generateNotesFromTopic: async (token, topic, notebookId) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/raw-inputs/generate-from-topic`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic,
          notebook: notebookId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate notes from topic');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating notes from topic:', error);
      throw error;
    }
  }
};

export default llmService; 