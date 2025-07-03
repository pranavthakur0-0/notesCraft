// React context shim for compatibility
import React from 'react';

export const createContext = React.createContext;
export default {
  createContext: React.createContext,
}; 