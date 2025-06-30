import React from 'react';
import { useExamStore } from './store/examStore';
import StartScreen from './components/StartScreen';
import QuestionDisplay from './components/QuestionDisplay';
import SectionReview from './components/SectionReview';
import ReviewScreen from './components/ReviewScreen';
import ResultsScreen from './components/ResultsScreen';
import './App.css';
import { Analytics } from "@vercel/analytics/react"

function App() {
  const { 
    examStarted, 
    examCompleted, 
    reviewMode, 
    sectionReviewMode,
    examResults 
  } = useExamStore();

  return (
    <><div className="App">
      {/* Show results screen if exam is completed */}
      {examCompleted && examResults && <ResultsScreen />}

      {/* Show section review if in section review mode */}
      {examStarted && sectionReviewMode && !examCompleted && <SectionReview />}

      {/* Show review screen if in review mode */}
      {examStarted && reviewMode && !sectionReviewMode && !examCompleted && <ReviewScreen />}

      {/* Show question display if exam is started */}
      {examStarted && !reviewMode && !sectionReviewMode && !examCompleted && <QuestionDisplay />}

      {/* Show start screen by default */}
      {!examStarted && !examCompleted && <StartScreen />}
    </div><Analytics /></>
  );
}

export default App;

