import React, { useState } from 'react';
import { motion } from '../lib/motion';
import {
  FiArrowLeft,
  FiDownload,
  FiEdit,
  FiTrash2,
  FiShare2,
  FiMessageCircle
} from 'react-icons/fi';
import jsPDF from 'jspdf';

const NoteDetail = ({ note, onBack }) => {
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [question, setQuestion] = useState('');

  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(22);
    doc.text(note.title, 20, 20);

    // Add date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Created: ${new Date(note.createdAt).toLocaleDateString()}`, 20, 30);

    // Add content
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    const splitText = doc.splitTextToSize(note.content, 170);
    doc.text(splitText, 20, 40);

    // Add supporting content if available
    if (note.supporting) {
      doc.addPage();
      doc.setFontSize(16);
      doc.text('Additional Information', 20, 20);
      doc.setFontSize(12);
      const supportingText = doc.splitTextToSize(note.supporting, 170);
      doc.text(supportingText, 20, 30);
    }

    // Save PDF
    doc.save(`${note.title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <motion.div
      className="note-detail"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button className="note-detail__back" onClick={onBack}>
        <FiArrowLeft /> Back to Notes
      </button>

      <div className="note-detail__header">
        <h2>{note.title}</h2>
        <div className="note-detail__actions">
          <motion.button
            className="btn btn-outline btn-icon"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowQuestionInput(!showQuestionInput)}
          >
            <FiMessageCircle />
          </motion.button>
          <motion.button
            className="btn btn-outline btn-icon"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiEdit />
          </motion.button>
          <motion.button
            className="btn btn-outline btn-icon"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FiShare2 />
          </motion.button>
          <motion.button
            className="btn btn-outline btn-icon"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleDownloadPDF}
          >
            <FiDownload />
          </motion.button>
          <motion.button
            className="btn btn-outline btn-icon"
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(229, 62, 62, 0.1)', color: '#e53e3e' }}
            whileTap={{ scale: 0.9 }}
          >
            <FiTrash2 />
          </motion.button>
        </div>
      </div>

      <div className="note-detail__content">
        <div className="note-detail__meta">
          <span className="note-detail__date">
            Created: {new Date(note.createdAt).toLocaleDateString()}
          </span>
          <span className="note-detail__meta-separator">•</span>
          <span className="note-detail__date">
            Last updated: {new Date(note.updatedAt).toLocaleDateString()}
          </span>
        </div>

        <div className="note-detail__text">
          {note.content}
        </div>

        {note.supporting && (
          <div className="note-detail__supporting">
            <h4>Additional Information</h4>
            <div className="supporting-content">
              {note.supporting}
            </div>
          </div>
        )}

        {note.rawInput && note.rawInput.content && (
          <div className="note-detail__raw-input">
            <h4>Original Content</h4>
            <div className="raw-content">
              {note.rawInput.content}
            </div>
          </div>
        )}
      </div>

      {showQuestionInput && (
        <motion.div
          className="note-detail__question-input"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
        >
          <div className="note-detail__question-container">
            <input
              type="text"
              className="note-detail__question-field"
              placeholder="Ask a question about this note..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <motion.button
              className="btn btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Ask
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NoteDetail;
