/**
 * LLM Service for handling interactions with language models
 */
const axios = require('axios');
const config = require('../config/config');

/**
 * Call Gemini API with a prompt
 * @param {string} prompt - The prompt to send to the LLM
 * @returns {Promise<string>} - The LLM's response
 */
const callGeminiAPI = async (prompt) => {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.gemini.apiKey}`,
      {
        contents: [{
          parts: [
            {
              text: prompt
            }
          ]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    throw new Error('Failed to get response from LLM: ' + (error.response?.data?.error?.message || error.message));
  }
};

/**
 * Generate notes from raw input
 * @param {string} rawInput - The raw input text
 * @returns {Promise<Array>} - Array of generated notes
 */
const generateNotes = async (rawInput) => {
  const systemPrompt = `You are a highly intelligent note extractor that breaks down complex user input into multiple detailed, structured, and insightful notes.

  Your task is to:
  - Extract as many **distinct, high-value** notes as the content allows (aim for **8–12** if applicable)
  - Each note should focus on one idea, principle, insight, or concept
  - Include **supporting formulas, examples, definitions, or technical clarifications** when relevant
  
  Each note must be:
  - Clear and self-contained (1–3 sentences of core explanation)
  - Accompanied by supporting detail if useful (e.g., formulas, rules, real-world examples)
  
  Respond in the following JSON array format:
  
  [
    {
      "title": "Short, descriptive title",
      "content": "Concise explanation or insight (1–3 sentences)",
      "supporting": "Optional: formula, example, definition, or deeper detail (if relevant)"
    },
    ...
  ]
  
  If a note has no supporting detail, leave the "supporting" field empty.
  
  Only return the JSON array — no comments, no markdown, no explanations.`;

  const prompt = `${systemPrompt}\n\nUser input: ${rawInput}`;
  const response = await callGeminiAPI(prompt);

  try {
    // Try to extract JSON array from the response
    const jsonMatch = response.match(/\[.*\]/s);
    const notesArray = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response);
    
    if (!Array.isArray(notesArray) || notesArray.length === 0) {
      throw new Error('Invalid response format');
    }
    
    return notesArray;
  } catch (parseError) {
    console.error('Error parsing LLM response:', parseError);
    throw new Error('Failed to parse LLM response into notes');
  }
};

/**
 * Answer a question about content
 * @param {string} rawContext - The raw context
 * @param {string} generatedContent - The generated content
 * @param {string} question - The question to answer
 * @returns {Promise<string>} - The answer to the question
 */
const answerQuestion = async (rawContext, generatedContent, question) => {
  const prompt = `You are an expert note analyzer and question answerer. Your task is to provide clear, accurate, and insightful answers based on the provided context.

Context Information:
1. Raw Input (Original Source):
${rawContext}

2. Generated Note Content:
${generatedContent}

User Question: ${question}

Instructions:
1. Analyze both the raw input and generated note content to provide a comprehensive answer
2. If the information in the generated note differs from the raw input, explain any discrepancies
3. If the answer requires technical details or formulas, include them
4. If the question cannot be fully answered from the provided context, acknowledge the limitations
5. Keep the answer concise but complete
6. Use bullet points or numbered lists when appropriate for clarity
7. If the question is ambiguous, address the most likely interpretation

Please provide your answer:`;

  return await callGeminiAPI(prompt);
};

module.exports = {
  callGeminiAPI,
  generateNotes,
  answerQuestion
}; 