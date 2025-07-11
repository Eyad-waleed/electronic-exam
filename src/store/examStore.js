import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateExam } from '../utils/dataLoader'; // Changed import

export const useExamStore = create(
  persist(
    (set, get) => ({
      // Exam configuration with user settings persistence
      examMode: 'sectioned', // 'sectioned' or 'single'
      timerMode: 'none', // 'none', 'total', 'section'
      timerDuration: 13, // minutes
      shuffleQuestions: true, // Default to true for random questions
      shuffleChoices: false,
      rcQuestionOrder: 'sequential', // New: 'sequential' or 'random' for RC questions
      
      // New configuration for question type filtering
      questionTypeFilter: 'all', // 'all' or 'specific'
      selectedQuestionType: null, // 'analogy', 'completion', 'error', 'rc', 'odd'
      
      // Exam state
      examStarted: false,
      examCompleted: false,
      currentQuestionIndex: 0,
      currentSection: 1, // Start from 1 instead of 0
      sectionReviewMode: false, // New: for section review
      
      // Questions and answers
      examQuestions: [],
      userAnswers: {}, // questionNumber -> choiceIndex
      deferredQuestions: {}, // questionNumber -> boolean
      
      // Timer
      timerActive: false,
      timeRemaining: 0,
      timerInterval: null,
      
      // Review mode
      reviewMode: false,
      reviewFilter: 'all', // 'all', 'answered', 'unanswered', 'deferred'
      
      // Results
      examResults: null,
      resultHistory: [],

      // Computed properties for correct/incorrect answers
      get correctAnswers() {
        const { examQuestions, userAnswers } = get();
        return examQuestions
          .filter(q => userAnswers[q.question_number] !== undefined && userAnswers[q.question_number] === q.answer)
          .map(q => q.question_number);
      },

      get incorrectAnswers() {
        const { examQuestions, userAnswers } = get();
        return examQuestions
          .filter(q => userAnswers[q.question_number] !== undefined && userAnswers[q.question_number] !== q.answer)
          .map(q => q.question_number);
      },

      get unansweredQuestions() {
        const { examQuestions, userAnswers } = get();
        return examQuestions
          .filter(q => userAnswers[q.question_number] === undefined)
          .map(q => q.question_number);
      },

      // Shuffle array utility
      shuffleArray: (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      },

      // Group RC questions by passage for sequential ordering
      groupRCQuestionsByPassage: (rcQuestions) => {
        const passageGroups = new Map();
        
        rcQuestions.forEach(question => {
          const passageKey = question.passage || 'no-passage';
          if (!passageGroups.has(passageKey)) {
            passageGroups.set(passageKey, []);
          }
          passageGroups.get(passageKey).push(question);
        });
        
        return Array.from(passageGroups.values());
      },

      // Initialize exam with configuration
      initializeExam: (config = {}) => {
        try {
          console.log('Initializing exam with config:', config);
          
          const examConfig = {
            shuffleQuestions: config.shuffleQuestions !== undefined ? config.shuffleQuestions : true,
            shuffleChoices: config.shuffleChoices || false,
            examMode: config.examMode || 'sectioned',
            rcQuestionOrder: config.rcQuestionOrder || 'sequential',
            questionTypeFilter: config.questionTypeFilter || 'all',
            selectedQuestionType: config.selectedQuestionType || null,
            singleSectionType: config.selectedQuestionType || null
          };

          // Generate exam questions using the generateExam function from dataLoader
          const { questions: generatedQuestions } = generateExam(examConfig);
          console.log('Generated exam questions:', generatedQuestions.length);
          
          if (!generatedQuestions || generatedQuestions.length === 0) {
            throw new Error('Failed to generate exam questions');
          }

          let processedQuestions = generatedQuestions;

          // Re-number questions sequentially
          processedQuestions = processedQuestions.map((question, index) => ({
            ...question,
            question_number: index + 1,
            original_question_number: question.question_number, // Keep original for reference
          }));

          // Assign sections based on question_number (13 questions per section)
          processedQuestions = processedQuestions.map((question, index) => ({
            ...question,
            section: Math.floor(index / 13) + 1,
          }));

          console.log('Final processed questions:', processedQuestions.length);

          // Set up timer
          const timerDuration = config.timerMode === 'none' ? 0 : (config.timerDuration || 13) * 60;
          
          // Clear any existing timer
          const { timerInterval } = get();
          if (timerInterval) {
            clearInterval(timerInterval);
          }

          set({
            examMode: examConfig.examMode,
            timerMode: config.timerMode || 'none',
            timerDuration: config.timerDuration || 13,
            shuffleQuestions: examConfig.shuffleQuestions,
            shuffleChoices: examConfig.shuffleChoices,
            rcQuestionOrder: examConfig.rcQuestionOrder,
            questionTypeFilter: examConfig.questionTypeFilter,
            selectedQuestionType: examConfig.selectedQuestionType,
            examQuestions: processedQuestions,
            examStarted: true,
            examCompleted: false,
            currentQuestionIndex: 0,
            currentSection: 1,
            sectionReviewMode: false,
            userAnswers: {},
            deferredQuestions: {},
            timerActive: config.timerMode !== 'none',
            timeRemaining: timerDuration,
            reviewMode: false,
            examResults: null,
            timerInterval: null
          });

          // Start timer if enabled
          if (config.timerMode !== 'none') {
            get().startTimer();
          }

          console.log('Exam initialized successfully');
          
        } catch (error) {
          console.error('Error initializing exam:', error);
          
          // Reset to safe state
          set({
            examStarted: false,
            examCompleted: false,
            currentQuestionIndex: 0,
            currentSection: 1,
            sectionReviewMode: false,
            examQuestions: [],
            userAnswers: {},
            deferredQuestions: {},
            timerActive: false,
            timeRemaining: 0,
            timerInterval: null,
            reviewMode: false,
            examResults: null
          });
          
          throw error; // Re-throw to be handled by the UI
        }
      },

      // Get current exam info
      getCurrentExamInfo: () => {
        const state = get();
        return {
          type: state.questionTypeFilter === 'specific' ? state.selectedQuestionType : 'all',
          mode: state.examMode,
          totalQuestions: state.examQuestions.length,
          currentSection: state.currentSection,
          rcQuestionOrder: state.rcQuestionOrder
        };
      },

      // Get question statistics
      getQuestionStats: () => {
        const { examQuestions, userAnswers, deferredQuestions, correctAnswers, incorrectAnswers } = get();
        
        if (!examQuestions || examQuestions.length === 0) {
          return {
            total: 0,
            answered: 0,
            unanswered: 0,
            deferred: 0,
            correct: 0,
            incorrect: 0,
            percentage: 0
          };
        }

        let answered = 0;
        let deferred = 0;

        examQuestions.forEach(question => {
          if (userAnswers[question.question_number] !== undefined) {
            answered++;
          }
          if (deferredQuestions[question.question_number]) {
            deferred++;
          }
        });

        const correct = correctAnswers.length;
        const incorrect = incorrectAnswers.length;
        const percentage = answered > 0 ? Math.round((correct / answered) * 100) : 0;

        return {
          total: examQuestions.length,
          answered,
          unanswered: examQuestions.length - answered,
          deferred,
          correct,
          incorrect,
          percentage
        };
      },

      // Start timer
      startTimer: () => {
        const { timerInterval } = get();
        
        // Clear existing timer
        if (timerInterval) {
          clearInterval(timerInterval);
        }

        const interval = setInterval(() => {
          const { timeRemaining } = get();
          
          if (timeRemaining <= 0) {
            get().completeExam();
            return;
          }
          
          set({ timeRemaining: timeRemaining - 1 });
        }, 1000);

        set({ timerInterval: interval });
      },

      // Stop timer
      stopTimer: () => {
        const { timerInterval } = get();
        if (timerInterval) {
          clearInterval(timerInterval);
          set({ timerInterval: null, timerActive: false });
        }
      },

      // Select answer
      selectAnswer: (questionNumber, choiceIndex) => {
        const { userAnswers, deferredQuestions } = get();
        set({
          userAnswers: {
            ...userAnswers,
            [questionNumber]: choiceIndex
          },
          deferredQuestions: {
            ...deferredQuestions,
            [questionNumber]: false // Remove deferred flag when answered
          }
        });
      },

      // Toggle deferred status
      toggleDeferred: (questionNumber) => {
        const { deferredQuestions } = get();
        const isCurrentlyDeferred = deferredQuestions[questionNumber];
        
        set({
          deferredQuestions: {
            ...deferredQuestions,
            [questionNumber]: !isCurrentlyDeferred
          }
        });
      },

      // Navigation
      nextQuestion: () => {
        const { currentQuestionIndex, examQuestions, examMode } = get();
        const nextIndex = currentQuestionIndex + 1;
        
        // Check if we're at the end of the current section in sectioned mode
        if (examMode === 'sectioned') {
          // Calculate which question number this is (1-based)
          const currentQuestionNumber = currentQuestionIndex + 1;
          
          // If this is the end of a section (questions 13, 26, 39, 52) and there are more questions
          if (currentQuestionNumber % 13 === 0 && nextIndex < examQuestions.length) {
            // Show section review before moving to next section
            set({
              sectionReviewMode: true
            });
            return;
          }
        }
        
        if (nextIndex < examQuestions.length) {
          const nextQuestion = examQuestions[nextIndex];
          const nextSection = nextQuestion.section;
          
          set({
            currentQuestionIndex: nextIndex,
            currentSection: nextSection
          });
        } else {
          // End of exam
          get().completeExam();
        }
      },

      previousQuestion: () => {
        const { currentQuestionIndex, examQuestions } = get();
        const prevIndex = currentQuestionIndex - 1;
        
        if (prevIndex >= 0) {
          const prevQuestion = examQuestions[prevIndex];
          const prevSection = prevQuestion.section;
          
          set({
            currentQuestionIndex: prevIndex,
            currentSection: prevSection
          });
        }
      },

      // Jump to specific question
      goToQuestion: (questionIndex) => {
        const { examQuestions } = get();
        
        if (questionIndex >= 0 && questionIndex < examQuestions.length) {
          const question = examQuestions[questionIndex];
          set({
            currentQuestionIndex: questionIndex,
            currentSection: question.section,
            reviewMode: false
          });
        }
      },

      // Exit review mode
      exitReviewMode: () => {
        set({ reviewMode: false });
      },

      // Complete exam
      completeExam: () => {
        const { examQuestions, userAnswers, deferredQuestions, timerInterval, resultHistory } = get();
        
        // Stop timer
        if (timerInterval) {
          clearInterval(timerInterval);
        }

        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let unansweredQuestions = 0;

        const detailedResults = examQuestions.map(question => {
          const userAnswer = userAnswers[question.question_number];
          const isDeferred = deferredQuestions[question.question_number];
          const isAnswered = userAnswer !== undefined;
          const isCorrect = isAnswered && (userAnswer === question.answer);

          if (isCorrect) {
            correctAnswers++;
          } else if (isAnswered) {
            incorrectAnswers++;
          } else {
            unansweredQuestions++;
          }

          return {
            questionId: question.id,
            questionNumber: question.question_number,
            questionType: question.type,
            userAnswer: userAnswer,
            correctAnswer: question.answer,
            isCorrect: isCorrect,
            isDeferred: isDeferred,
            isAnswered: isAnswered
          };
        });

        const results = {
          totalQuestions: examQuestions.length,
          correctAnswers,
          incorrectAnswers,
          unansweredQuestions,
          detailedResults,
          timestamp: new Date().toISOString()
        };

        set({
          examCompleted: true,
          examResults: results,
          timerActive: false,
          timerInterval: null,
          resultHistory: [...resultHistory, results]
        });

        console.log('Exam completed. Results:', results);
      },

      // Reset exam state
      resetExam: () => {
        const { timerInterval } = get();
        if (timerInterval) {
          clearInterval(timerInterval);
        }

        set({
          examStarted: false,
          examCompleted: false,
          currentQuestionIndex: 0,
          currentSection: 1,
          sectionReviewMode: false,
          examQuestions: [],
          userAnswers: {},
          deferredQuestions: {},
          timerActive: false,
          timeRemaining: 0,
          timerInterval: null,
          reviewMode: false,
          reviewFilter: 'all',
          examResults: null
        });
        console.log('Exam state reset.');
      },

      // Set review mode
      setReviewMode: (mode) => set({ reviewMode: mode }),
      setReviewFilter: (filter) => set({ reviewFilter: filter }),
      
      // Navigate to next section in review mode
      nextSection: () => {
        const { currentSection, examQuestions } = get();
        const maxSection = Math.max(...examQuestions.map(q => q.section));
        if (currentSection < maxSection) {
          set({ currentSection: currentSection + 1 });
        }
      },

      // Navigate to previous section in review mode
      previousSection: () => {
        const { currentSection } = get();
        if (currentSection > 1) {
          set({ currentSection: currentSection - 1 });
        }
      },

      // Exit section review mode
      exitSectionReview: () => {
        const { currentSection, examQuestions } = get();
        const nextQuestionIndex = currentSection * 13; // Assuming 13 questions per section
        
        set({
          sectionReviewMode: false,
          currentQuestionIndex: nextQuestionIndex < examQuestions.length ? nextQuestionIndex : examQuestions.length - 1,
          currentSection: nextQuestionIndex < examQuestions.length ? currentSection + 1 : currentSection
        });
      },

      // Set exam mode
      setExamMode: (mode) => set({ examMode: mode }),
      setTimerMode: (mode) => set({ timerMode: mode }),
      setTimerDuration: (duration) => set({ timerDuration: duration }),
      setShuffleQuestions: (shuffle) => set({ shuffleQuestions: shuffle }),
      setShuffleChoices: (shuffle) => set({ shuffleChoices: shuffle }),
      setRcQuestionOrder: (order) => set({ rcQuestionOrder: order }),
      setQuestionTypeFilter: (filter) => set({ questionTypeFilter: filter }),
      setSelectedQuestionType: (type) => set({ selectedQuestionType: type }),

      // Clear history
      clearResultHistory: () => set({ resultHistory: [] }),
    }),
    {
      name: 'exam-storage', // unique name
      getStorage: () => localStorage, // Use localStorage for persistence
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) =>
            !['examQuestions', 'userAnswers', 'deferredQuestions', 'examResults', 'timerInterval', 'timeRemaining', 'examStarted', 'examCompleted', 'currentQuestionIndex', 'currentSection', 'sectionReviewMode', 'reviewMode', 'reviewFilter'].includes(key)
          )
        ),
    }
  )
);

