'use client';
import React, { useEffect } from 'react';
import { motion } from '../lib/motion';
import PropTypes from 'prop-types';
import { FiFileText, FiFile } from 'react-icons/fi';
import useAppStore from '../stores/appStore';

function HomePage({ onNavigate }) {
  // Get setState from Zustand store
  const setState = useAppStore((state) => state.setState);
  
  // When the HomePage is mounted, ensure we set to 'home' to show welcome screen
  useEffect(() => {
    // Always set to 'home' to ensure welcome screen is shown using Zustand store
    setState({
      selectedNotebook: 'home',
      currentView: 'welcome'
    });
  }, [setState]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: 'beforeChildren',
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <motion.div className="welcome-screen">
      <motion.div
        className="welcome-screen__container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants} className="welcome-screen__title">
          Welcome Back
        </motion.h1>
        <motion.p variants={itemVariants} className="welcome-screen__subtitle">
          Choose an option to get started
        </motion.p>

        <div className="welcome-screen__options">
          <motion.div
            className="welcome-screen__option-card"
            variants={itemVariants}
            whileHover={{
              y: -5,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('create-note')}
          >
            <div className="welcome-screen__option-icon">
              <FiFileText />
            </div>
            <h2 className="welcome-screen__option-title">Add Text Note</h2>
            <p className="welcome-screen__option-description">
              Create a new text note from scratch
            </p>
          </motion.div>

          <motion.div
            className="welcome-screen__option-card"
            variants={itemVariants}
            whileHover={{
              y: -5,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            whileTap={{ scale: 0.98 }}
            // onClick={() => onNavigate('upload-pdf')}
            style={{ position: 'relative', filter: 'blur(1px)', opacity: 0.8 }}
          >
            <div 
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                zIndex: 10,
                borderRadius: 'inherit'
              }}
            >
              <span 
                style={{
                  backgroundColor: '#4f46e5', 
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontWeight: 'bold',
                  transform: 'rotate(-5deg)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                Coming Soon
              </span>
            </div>
            <div className="welcome-screen__option-icon">
              <FiFile />
            </div>
            <h2 className="welcome-screen__option-title">Add PDF Document</h2>
            <p className="welcome-screen__option-description">
              Upload and annotate PDF documents
            </p>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}

HomePage.propTypes = {
  onNavigate: PropTypes.func.isRequired,
};

export default HomePage;
