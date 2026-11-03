import { createContext, useContext } from 'react';
export const LearningPathContext = createContext({ showHidden: false, filters: [], expandAll: false });
export const useLearningPathDisplay = () => useContext(LearningPathContext);
