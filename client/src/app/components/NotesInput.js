import React, { useState } from 'react';
import { motion, AnimatePresence } from '../lib/motion';
import { FiFile, FiUploadCloud, FiFileText, FiHash } from 'react-icons/fi';
import PropTypes from 'prop-types';

function NotesInput({ onGenerateNotes, inputType, setInputType }) {
  const [noteText, setNoteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [topic, setTopic] = useState('');

  const handleInputChange = (e) => {
    setNoteText(e.target.value);
  };

  const handleTopicChange = (e) => {
    setTopic(e.target.value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileName(file.name);

      // For PDF files, you'd use a PDF reader library here
      // For this example, we'll just read it as text
      const reader = new FileReader();
      reader.onload = (event) => {
        setNoteText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleGenerateClick = () => {
    if (inputType === 'topic' && topic.trim()) {
      onGenerateNotes(topic, true); // Pass true as second parameter to indicate it's a topic
    } else if (noteText.trim()) {
      onGenerateNotes(noteText);
    }
  };

  return (
    <div className="generated-notes__split-view-container">
      <div className="generated-notes__split-view-header">
        <h3>
          {inputType === 'text' ? 'Input Text' : 
           inputType === 'pdf' ? 'Upload PDF' : 
           'Enter Topic'}
        </h3>
        <div className="generated-notes__split-view-header-actions">
          {/* eslint-disable-next-line react/button-has-type */}
          <motion.button
            className="generated-notes__split-view-header-button"
            onClick={() => {
              if (inputType === 'text') {
                setInputType('pdf');
              } else if (inputType === 'pdf') {
                setInputType('topic');
              } else {
                setInputType('text');
              }
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {inputType === 'text' ? (
              <>
                <FiFile />
                <span>Switch to PDF</span>
              </>
            ) : inputType === 'pdf' ? (
              <>
                <FiHash />
                <span>Switch to Topic</span>
              </>
            ) : (
              <>
                <FiFileText />
                <span>Switch to Text</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="generated-notes">
        <AnimatePresence mode="wait">
          {inputType === 'text' ? (
            <motion.div
              key="text-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="motion-div"
              style={{height: 'fit-content'}}
            >
              <textarea
                className="generated-notes-input"
                placeholder="Start typing your note here..."
                value={noteText}
                onChange={handleInputChange}
              />
            </motion.div>
          ) : inputType === 'pdf' ? (
            <motion.div
              key="pdf-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center"
              style={{ height: '100%' }}
            >
              <div className="text-center mb-4">
                <FiUploadCloud size={48} color="#6c5ce7" />
                <h3 className="mt-3 mb-2">Upload PDF Document</h3>
                <p className="text-secondary mb-4">
                  Upload a PDF to generate notes from its content
                </p>

                <label className="btn btn-primary" htmlFor="pdf-file-input">
                  Choose PDF
                  <input
                    id="pdf-file-input"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>

                {fileName && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <FiFile /> {fileName}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="topic-input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="motion-div"
              style={{height: 'fit-content'}}
            >
              <div className="text-center mb-4">
                <FiHash size={48} color="#6c5ce7" />
                <h3 className="mt-3 mb-2">Generate Notes from Topic</h3>
                <p className="text-secondary mb-4">
                  Just enter a topic and AI will generate detailed notes for you
                </p>
                <input
                  type="text"
                  className="generated-notes-topic-input"
                  placeholder="Enter a topic (e.g., Quantum Physics, Climate Change, Machine Learning)..."
                  value={topic}
                  onChange={handleTopicChange}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="generated-notes__split-view-footer">
        <div className="generated-notes__split-view-footer-info">
          {inputType === 'topic' 
            ? (topic ? `Topic: ${topic}` : 'No topic entered yet')
            : (noteText ? `${noteText.length} characters` : 'No text entered yet')}
        </div>
        <div className="generated-notes__split-view-footer-actions">
          <motion.button
            className="btn btn-primary"
            onClick={handleGenerateClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={
              (inputType === 'topic' && !topic.trim()) || 
              ((inputType === 'text' || inputType === 'pdf') && !noteText.trim())
            }
          >
            Generate Notes
          </motion.button>
        </div>
      </div>
    </div>
  );
}

NotesInput.propTypes = {
  onGenerateNotes: PropTypes.func.isRequired,
  inputType: PropTypes.string,
  setInputType: PropTypes.func,
};

NotesInput.defaultProps = {
  inputType: 'text',
  setInputType: () => {},
};

export default NotesInput;
