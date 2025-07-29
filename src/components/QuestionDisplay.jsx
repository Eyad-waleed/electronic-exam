import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Clock, Flag, Filter, BarChart3, BookOpen, GraduationCap, Target, CheckCircle, Home, X, ZoomIn, RotateCcw } from 'lucide-react';
import { useExamStore } from '../store/examStore';

const QuestionDisplay = () => {
  const [isTextEnlarged, setIsTextEnlarged] = useState(false);
  const [isInstructionModalOpen, setIsInstructionModalOpen] = useState(false);

  const {
    examQuestions,
    currentQuestionIndex,
    currentSection,
    userAnswers,
    deferredQuestions,
    examMode,
    reviewMode,
    timerActive,
    timeRemaining,
    sectionReviewMode,
    hasSeenSectionReview,
    returnedFromSectionReview,
    reviewedSection,
    hideDeferButton,
    selectAnswer,
    toggleDeferred,
    nextQuestion,
    previousQuestion,
    getQuestionStats,
    getCurrentExamInfo,
    goToQuestion,
    setReviewMode,
    goToSectionReview
  } = useExamStore();

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle keyboard events if we're not in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      // Check if we should show deferred questions button
      const currentQuestionNumber = currentQuestionIndex + 1;
      const isLastQuestionInSection = currentQuestionNumber % 13 === 0;
      
      let shouldShowDeferredButton = false;
      
      if (examMode === 'combined') {
        // For combined sectioned exam, only show deferred button at the end of entire exam
        shouldShowDeferredButton = isLastQuestion && hasDeferredQuestionsInCurrentSection();
      } else {
        // For regular sectioned exam
        shouldShowDeferredButton = 
          (isLastQuestionInSection && !isLastQuestion && examMode === 'sectioned' && hasDeferredQuestionsInCurrentSection()) ||
          (isLastQuestion && hasDeferredQuestionsInCurrentSection());
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          // Disable keyboard navigation for next button when deferred questions button should be shown
          if (canProceed && !shouldShowDeferredButton) {
            handleNext();
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          if (canGoPrevious()) {
            handlePrevious();
          }
          break;
        default:
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentQuestionIndex, examQuestions, deferredQuestions, examMode, currentSection]); // Dependencies to ensure the effect updates when these change

    // Function to calculate the display question number based on exam mode
  const getDisplayQuestionNumber = () => {
    if (examMode === 'sectioned') {
      // For sectioned mode: show 1-13 for each section
      const questionInSection = (currentQuestionIndex % 13) + 1;
      return questionInSection;
    } else {
      // For single section mode: show 1-65
      return currentQuestionIndex + 1;
    }
  };

  // Function to calculate total questions for display
  const getTotalQuestionsDisplay = () => {
    if (examMode === 'sectioned') {
      // For sectioned mode: show 13 as total for each section
      return 13;
    } else {
      // For single section mode: show total number of questions (65)
      return examQuestions.length;
    }
  };

  // Function to highlight choice words in red for contextual error questions
  const highlightChoiceWords = (questionText, choices, questionType) => {
    if (questionType !== 'error' || !choices || !questionText) {
      return questionText;
    }

    let highlightedText = questionText;
    
    // Sort choices by length (longest first) to avoid partial matches
    const sortedChoices = [...choices].sort((a, b) => b.length - a.length);
    
    // Function to remove diacritics (tashkeel) from Arabic text
    const removeDiacritics = (text) => {
      return text.replace(/[\u064B-\u0652\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, "");
    };
    
    // Function to normalize hamza variations
    const normalizeHamza = (text) => {
      return text
        .replace(/[أإآ]/g, 'ا') // Normalize alif with hamza
        .replace(/[ؤ]/g, 'و')   // Normalize waw with hamza
        .replace(/[ئ]/g, 'ي');  // Normalize yaa with hamza
    };

    // Function to get the core word by removing common prefixes and suffixes
    const getCoreWord = (word) => {
      // First, remove punctuation from the word
      let cleanedWord = word.replace(/[،,\.؛;:!؟?]/g, '');
      
      let core = normalizeHamza(removeDiacritics(cleanedWord));
      
      // Handle compound prefixes more carefully
      // First remove 'و' if it's at the beginning
      core = core.replace(/^و/, '');
      
      // Then handle 'ب' + 'ال' combination (بال)
      if (core.startsWith('بال')) {
        core = core.substring(3); // Remove 'بال'
      }
      // Handle 'ل' + 'ال' combination (لال)
      else if (core.startsWith('لال')) {
        core = core.substring(3); // Remove 'لال'
      }
      // Handle 'ب' + other combinations
      else if (core.startsWith('ب')) {
        core = core.substring(1); // Remove 'ب'
        // If what remains starts with 'ال', remove it too
        if (core.startsWith('ال')) {
          core = core.substring(2);
        }
      }
      // Handle 'ل' + other combinations
      else if (core.startsWith('ل')) {
        core = core.substring(1); // Remove 'ل'
        // If what remains starts with 'ال', remove it too
        if (core.startsWith('ال')) {
          core = core.substring(2);
        }
      }
      // Handle standalone 'ال'
      else if (core.startsWith('ال')) {
        core = core.substring(2); // Remove 'ال'
      }
      
      // Remove other common prefixes
      core = core.replace(/^(ف|ك|س)/, '');
      
      // Remove common suffixes (including the problematic 'ا' vs 'و' endings)
      // First handle the specific case of 'وا' vs 'و' endings
      if (core.endsWith('وا')) {
        core = core.slice(0, -2) + 'و'; // Replace 'وا' with 'و'
      }
      
      // Then handle other common suffixes
      core = core.replace(/(ه|ها|هم|هن|ك|كم|كن|ي|نا|ون|ين|ات)$/, '');
      
      return core;
    };
    
    sortedChoices.forEach(choice => {
      if (choice && choice.trim()) {
        const trimmedChoice = choice.trim();
        
        // Extract individual words from the choice, ignoring punctuation and parentheses
        // This regex splits on spaces, parentheses, brackets, commas, periods, semicolons, colons
        const wordsInChoice = trimmedChoice.split(/[\s\(\)\[\]،,\.؛;:]+/).filter(word => word.length > 0);
        
        // For each word in the choice, find and highlight it in the question
        wordsInChoice.forEach(wordInChoice => {
          const coreWordInChoice = getCoreWord(wordInChoice);
          
          // Split the question into words and check each word
          const wordsInQuestion = questionText.split(/\s+/);
          
          wordsInQuestion.forEach(wordInQuestion => {
            const coreWordInQuestion = getCoreWord(wordInQuestion);
            
            // If the core words match, highlight the original word in the question
            if (coreWordInQuestion === coreWordInChoice && coreWordInChoice.length > 0) {
              // Make sure we haven't already highlighted this word
              if (!highlightedText.includes(`<span style="color: red; font-weight: bold;">${wordInQuestion}</span>`)) {
                highlightedText = highlightedText.replace(wordInQuestion, `<span style="color: red; font-weight: bold;">${wordInQuestion}</span>`);
              }
            }
          });
        });
      }
    });

    return highlightedText;
  };

  // Function to render highlighted text
  const renderHighlightedText = (text) => {
    return <div dangerouslySetInnerHTML={{ __html: text }} />;
  };

  if (!examQuestions || examQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center" dir="rtl">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-8 shadow-xl mx-4">
          <div className="bg-blue-100 rounded-full p-3 sm:p-4 w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-pulse" />
          </div>
          <div className="text-lg sm:text-xl font-medium text-gray-900">جاري تحميل الأسئلة...</div>
          <div className="text-sm text-gray-600 mt-2">يرجى الانتظار</div>
        </div>
      </div>
    );
  }

  const currentQuestion = examQuestions[currentQuestionIndex];
  const selectedAnswer = userAnswers[currentQuestion.question_number];
  const isDeferred = deferredQuestions[currentQuestion.question_number];
  const isLastQuestion = currentQuestionIndex === examQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const examInfo = getCurrentExamInfo();

  // Check if we can go to previous question (not first question and not first question of current section)
  const canGoPrevious = () => {
    if (isFirstQuestion) return false;
    
    // Allow going back if examMode is not 'sectioned' (i.e., combined test)
    if (examMode !== 'sectioned') {
      return true;
    }

    const currentQuestionNumber = currentQuestionIndex + 1;
    const isFirstQuestionInSection = (currentQuestionNumber - 1) % 13 === 0;
    
    // If we're at the first question of a section and it's not the very first question, prevent going back
    if (isFirstQuestionInSection && currentQuestionIndex > 0) {
      return false;
    }
    
    return true;
  };

  // Allow navigation for all question types - removed answer requirement
  const canProceed = true;

  // Check if there are any deferred questions in the current section
  const hasDeferredQuestionsInCurrentSection = () => {
    const isLastQuestion = currentQuestionIndex === examQuestions.length - 1;

    if (isLastQuestion) {
        return examQuestions.some(q => deferredQuestions[q.question_number]);
    }
    // Original logic
    return examQuestions
      .filter(q => q.section === currentSection)
      .some(q => deferredQuestions[q.question_number]);
  };
  
  // Find the first deferred question index in the current section
  const getFirstDeferredQuestionIndexInCurrentSection = () => {
    const isLastQuestion = currentQuestionIndex === examQuestions.length - 1;

    if (isLastQuestion) {
        for (let i = 0; i < examQuestions.length; i++) {
            const question = examQuestions[i];
            if (deferredQuestions[question.question_number]) {
                return i;
            }
        }
        return -1;
    }
    // Original logic
    for (let i = 0; i < examQuestions.length; i++) {
      const question = examQuestions[i];
      if (question.section === currentSection && deferredQuestions[question.question_number]) {
        return i;
      }
    }
    return -1;
  };

  const handleAnswerSelect = (choiceIndex) => {
    selectAnswer(currentQuestion.question_number, choiceIndex);
  };

  const handleDeferToggle = () => {
    toggleDeferred(currentQuestion.question_number);
  };

  const handleNext = () => {
    // Check if this is the last question in the current section for sectioned exams
    const currentQuestionNumber = currentQuestionIndex + 1;
    const isLastQuestionInSection = currentQuestionNumber % 13 === 0;
    
    // For combined sectioned exam, only check at the end of the entire exam
    if (examMode === 'combined') {
      // If it's the last question and there are deferred questions, go to first deferred question
      if (isLastQuestion && hasDeferredQuestionsInCurrentSection()) {
        const firstDeferredIndex = getFirstDeferredQuestionIndexInCurrentSection();
        if (firstDeferredIndex !== -1) {
          if (typeof goToQuestion === 'function') {
            goToQuestion(firstDeferredIndex);
          } else {
            console.log('Navigate to deferred question at index:', firstDeferredIndex);
          }
          return;
        }
      }
    } else {
      // For regular sectioned exam
      // If it's the end of a section in a sectioned exam and there are deferred questions in the current section
      if (isLastQuestionInSection && !isLastQuestion && examMode === 'sectioned' && hasDeferredQuestionsInCurrentSection()) {
        const firstDeferredIndex = getFirstDeferredQuestionIndexInCurrentSection();
        if (firstDeferredIndex !== -1) {
          if (typeof goToQuestion === 'function') {
            goToQuestion(firstDeferredIndex);
          } else {
            console.log('Navigate to deferred question at index:', firstDeferredIndex);
          }
          return;
        }
      }
      
      // If it's the last question and there are deferred questions in the current section, go to first deferred question in current section
      if (isLastQuestion && hasDeferredQuestionsInCurrentSection()) {
        const firstDeferredIndex = getFirstDeferredQuestionIndexInCurrentSection();
        if (firstDeferredIndex !== -1) {
          if (typeof goToQuestion === 'function') {
            goToQuestion(firstDeferredIndex);
          } else {
            console.log('Navigate to deferred question at index:', firstDeferredIndex);
          }
          return;
        }
      }
    }
    
    nextQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevious = () => {
    // Allow going back if examMode is not 'sectioned' (i.e., combined test)
    if (examMode !== 'sectioned') {
      previousQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Check if we're at the first question of the current section
    const currentQuestionNumber = currentQuestionIndex + 1;
    const isFirstQuestionInSection = (currentQuestionNumber - 1) % 13 === 0;
    
    // If we're at the first question of a section and it's not the very first question, prevent going back
    if (isFirstQuestionInSection && currentQuestionIndex > 0) {
      return; // Don't allow going back to previous section
    }
    
    previousQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTextEnlarge = () => {
    setIsTextEnlarged(true);
  };

  const handleCloseEnlargedText = () => {
    setIsTextEnlarged(false);
  };

  const handleOpenInstructionModal = () => {
    setIsInstructionModalOpen(true);
  };

  const handleCloseInstructionModal = () => {
    setIsInstructionModalOpen(false);
  };

  // Function to handle section review button
  const handleSectionReview = () => {
    // Navigate to section review page using the store function
    console.log("Navigating to section review page for section:", currentSection);
    goToSectionReview();
  };

  // Function to check if section review button should be shown
  const shouldShowSectionReviewButton = () => {
    // Show the button if:
    // 1. It's a sectioned exam AND we returned from section review
    // 2. OR if it's a sectioned exam AND there are deferred questions in current section AND we've seen section review
    return examMode === 'sectioned' && (
      returnedFromSectionReview || 
      (hasDeferredQuestionsInCurrentSection() && hasSeenSectionReview)
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      'analogy': 'التناظر اللفظي',
      'completion': 'إكمال الجمل',
      'error': 'الخطأ السياقي',
      'rc': 'استيعاب المقروء',
      'odd': 'المفردة الشاذة'
    };
    return labels[type] || type;
  };

  const getQuestionTypeExplanation = (type) => {
    const explanations = {
      'analogy': 'في بداية كل سؤال معنا يأتي كلمتان ترتبطان بعلاقة معينة، تتبعهما أربعة أزواج من الكلمات، واحد منها ترتبط فيه الكلمتان بعلاقة مشابهة لعلاقة بين الكلمتين في بداية السؤال. المطلوب هو اختيار الإجابة الصحيحة',
      'completion': 'يحتوي كل سؤال على جملة أو أكثر بها فراغ أو أكثر، والمطلوب اختيار الكلمة أو العبارة المناسبة لملء الفراغ من بين البدائل المعطاة',
      'error': 'يحتوي كل سؤال على جملة تحتوي على خطأ نحوي أو إملائي أو لغوي، والمطلوب تحديد موضع الخطأ',
      'rc': 'يحتوي كل سؤال على نص يليه عدة أسئلة حول محتوى النص، والمطلوب قراءة النص بعناية ثم الإجابة على الأسئلة',
      'odd': 'يحتوي كل سؤال على مجموعة من الكلمات، واحدة منها لا تنتمي للمجموعة، والمطلوب تحديد الكلمة الشاذة'
    };
    return explanations[type] || '';
  };

  const stats = getQuestionStats();

  // Determine button text and style based on whether it's the last question and there are deferred questions
  const getNextButtonText = () => {
    const currentQuestionNumber = currentQuestionIndex + 1;
    const isLastQuestionInSection = currentQuestionNumber % 13 === 0;
    
    // For combined sectioned exam, only show deferred button at the end of entire exam
    if (examMode === 'combined') {
      if (isLastQuestion && hasDeferredQuestionsInCurrentSection()) {
        return 'لديك أسئلة مؤجلة';
      }
    } else {
      // For regular sectioned exam
      // Check for deferred questions at section end for sectioned exams
      if (isLastQuestionInSection && !isLastQuestion && examMode === 'sectioned' && hasDeferredQuestionsInCurrentSection()) {
        return 'لديك أسئلة مؤجلة';
      }
      
      if (isLastQuestion && hasDeferredQuestionsInCurrentSection()) {
        return 'لديك أسئلة مؤجلة';
      }
    }
    
    if (isLastQuestion) {
      return 'انهاء الاختبار';
    } else if (isLastQuestionInSection && examMode === 'sectioned') {
      // Show "End Section" for sectioned exams at end of section
      return 'انهاء القسم';
    }
    
    return 'التالي';
  };

  const getNextButtonMobileText = () => {
    const currentQuestionNumber = currentQuestionIndex + 1;
    const isLastQuestionInSection = currentQuestionNumber % 13 === 0;
    
    // For combined sectioned exam, only show deferred button at the end of entire exam
    if (examMode === 'combined') {
      if (isLastQuestion && hasDeferredQuestionsInCurrentSection()) {
        return 'أسئلة مؤجلة';
      }
    } else {
      // For regular sectioned exam
      // Check for deferred questions at section end for sectioned exams
      if (isLastQuestionInSection && !isLastQuestion && examMode === 'sectioned' && hasDeferredQuestionsInCurrentSection()) {
        return 'أسئلة مؤجلة';
      }
      
      if (isLastQuestion && hasDeferredQuestionsInCurrentSection()) {
        return 'أسئلة مؤجلة';
      }
    }
    
    if (isLastQuestion) {
      return 'انهاء الاختبار';
    } else if (isLastQuestionInSection && examMode === 'sectioned') {
      // Show "End Section" for sectioned exams at end of section
      return 'انهاء القسم';
    }
    
    return 'التالي';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-100 pb-24 sm:pb-20" dir="rtl">
      {/* Enhanced Header - Consistent Size Across All Devices */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900"></div>
        <div className="">
          <div className="mx-auto px-4 py-4">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                  <div className="text-white font-bold text-base">
                    السؤال {getDisplayQuestionNumber()} من {getTotalQuestionsDisplay()}
                  </div>
                </div>
                {/* Progress Indicator - Hidden on mobile */}
                <div className="hidden md:flex bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/30">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-white/30 rounded-full h-2">
                      <div 
                        className="rounded-full h-2 transition-all duration-300"
                        style={{ 
                          width: `${(getDisplayQuestionNumber() / getTotalQuestionsDisplay()) * 100}%`,
                          background: 'linear-gradient(to right, #10B981 0%, #06D6A0 50%, #00F5FF 100%)'
                        }}
                      ></div>
                    </div>
                    <span className="text-white text-sm font-medium">
                      {Math.round((getDisplayQuestionNumber() / getTotalQuestionsDisplay()) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 flex-wrap">
                {examMode === 'sectioned' && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30 hidden sm:block">
                    <div className="text-white font-medium text-base">القسم {currentSection}</div>
                  </div>
                )}
                {timerActive && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/30">
                    <div className={`font-bold text-base flex items-center gap-2 ${timeRemaining < 300 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                      <Clock className="h-5 w-5" />
                      <span className="text-lg font-extrabold tracking-wide">{formatTime(timeRemaining)}</span>
                    </div>
                  </div>
                )}
                <Button 
                  variant="" 
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 px-4 py-2 text-base font-bold rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 flex-shrink-0" 
                  onClick={() => window.location.href = '/'}
                >
                  <Home className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged Text Modal */}
      {isTextEnlarged && currentQuestion.passage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseEnlargedText}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                النص المكبر
              </h3>
              <Button
                onClick={handleCloseEnlargedText}
                variant="ghost"
                className="text-white hover:bg-white/20 p-2 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="text-gray-800 leading-relaxed text-lg" style={{ lineHeight: '2' }}>
                {currentQuestion.passage}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instruction Modal */}
      {isInstructionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseInstructionModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6" />
                {getQuestionTypeLabel(currentQuestion.type)}
              </h3>
              <Button
                onClick={handleCloseInstructionModal}
                variant="ghost"
                className="text-white hover:bg-white/20 p-2 rounded-full"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="text-gray-800 leading-relaxed text-lg" style={{ lineHeight: '2' }}>
                {getQuestionTypeExplanation(currentQuestion.type)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Mobile Optimized with proper bottom spacing */}
      <div className="pt-2 sm:pt-3 lg:pt-1 xl:pt-1 min-h-screen px-2 sm:px-4 lg:px-6">
        <div className="px-2 sm:px-4 py-2 sm:py-4 lg:px-4 lg:py-2 xl:px-4 xl:py-2">
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6 auto-rows-min">
            {/* Question Area - Mobile Optimized */}
            <div className="lg:col-span-2 xl:col-span-3 2xl:col-span-4 min-w-0">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-3 sm:p-6 lg:p-4 xl:p-4 min-w-0 w-full overflow-hidden">
                {/* Question Type and Status - Mobile Optimized */}
                <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-2 xl:mb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 sm:px-4 py-1 sm:py-2 font-medium rounded-full border-0 cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
                      onClick={handleOpenInstructionModal}
                    >
                      <Target className="h-3 w-3 sm:h-4 sm:w-4 ml-1" />
                      {getQuestionTypeLabel(currentQuestion.type)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedAnswer !== undefined && (
                      <Badge variant="default" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm">
                        <CheckCircle className="h-2 w-2 sm:h-3 sm:w-3 ml-1" />
                        مجاب
                      </Badge>
                    )}
                    {isDeferred && (
                      <Badge variant="default" className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm">
                        <Flag className="h-2 w-2 sm:h-3 sm:w-3 ml-1" />
                        مؤجل
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Reading passage for RC questions - Mobile Optimized */}
                {currentQuestion.passage && (
                  <Card className="mb-3 sm:mb-4 lg:mb-2 xl:mb-2 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg p-2 sm:p-4 cursor-pointer hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
                      onClick={handleTextEnlarge}
                    >
                      <CardTitle className="text-base sm:text-lg text-center flex items-center justify-center gap-2">
                        <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
                        تكبير النص
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-1 sm:p-2">
                      <div 
                        className="text-gray-700 leading-relaxed overflow-y-auto passage-scroll text-center mx-auto text-xs sm:text-sm max-h-[150px]"
                        style={{ lineHeight: '1.8' }}
                      >
                        {currentQuestion.passage}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Question text - Mobile Optimized with highlighting for error questions */}
                <div className="text-base sm:text-lg font-medium leading-relaxed mb-3 sm:mb-6 lg:mb-3 xl:mb-3 text-gray-900 text-center break-words overflow-wrap-anywhere">
                  {currentQuestion.type === 'error' ? 
                    renderHighlightedText(highlightChoiceWords(currentQuestion.question, currentQuestion.choices, currentQuestion.type)) :
                    currentQuestion.question
                  }
                </div>

                {/* Answer choices - Mobile Optimized with proper bottom spacing */}
                <div className="space-y-2 sm:space-y-3 lg:space-y-1 xl:space-y-1 max-w-4xl mx-auto mb-6 sm:mb-8">
                  <RadioGroup 
                    value={selectedAnswer?.toString() || ''} 
                    onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                    className="space-y-2 sm:space-y-3"
                  >
                    {currentQuestion.choices && currentQuestion.choices.map((choice, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-2 sm:space-x-3 space-x-reverse p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-300 border-2 bg-white/60 backdrop-blur-sm cursor-pointer ${
                          selectedAnswer === index 
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 shadow-lg' 
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-50'
                        }`}
                        onClick={() => handleAnswerSelect(index)}
                      >
                        <RadioGroupItem 
                          value={index.toString()} 
                          id={`choice-${index}`}
                          className="flex-shrink-0 border-2 border-blue-300 w-4 h-4 sm:w-5 sm:h-5 pointer-events-none"
                        />
                        <Label 
                          htmlFor={`choice-${index}`}
                          className="flex-1 cursor-pointer text-base sm:text-lg leading-relaxed text-right text-gray-800 font-medium pointer-events-none break-words overflow-wrap-anywhere"
                        >
                          {choice}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Enhanced Sidebar - Mobile Optimized with proper bottom spacing */}
            <div className="lg:col-span-1 xl:col-span-1 2xl:col-span-1 min-w-0 w-full">
              <div className="grid grid-cols-1 gap-3 sm:gap-4 h-fit">
                {/* Stats - Mobile Optimized */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 min-w-0 w-full">
                  <CardHeader className="pb-2 sm:pb-3 p-2 sm:p-4">
                    <div className="flex items-center justify-center mb-2 sm:mb-3">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-1.5 sm:p-2">
                        <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-center text-sm sm:text-base lg:text-sm xl:text-base font-bold text-gray-900 break-words">
                      إحصائيات الاختبار
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4 pt-0">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-2 sm:p-3 border-2 border-green-200 min-w-0">
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-green-700 font-medium text-xs sm:text-sm truncate">مجاب عليها:</span>
                        <span className="font-bold text-lg sm:text-xl text-green-800 flex-shrink-0">{stats.answered}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-2 sm:p-3 border-2 border-gray-200 min-w-0">
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-gray-700 font-medium text-xs sm:text-sm truncate">غير مجاب:</span>
                        <span className="font-bold text-lg sm:text-xl text-gray-800 flex-shrink-0">{stats.unanswered}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-2 sm:p-3 border-2 border-orange-200 min-w-0">
                      <div className="flex justify-between items-center gap-1">
                        <span className="text-orange-700 font-medium text-xs sm:text-sm truncate">مؤجلة:</span>
                        <span className="font-bold text-lg sm:text-xl text-orange-800 flex-shrink-0">{stats.deferred}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Defer Button - Mobile Optimized with proper spacing to avoid footer overlap */}
              {/* Hide defer button when hideDeferButton is true OR when returned from section review */}
              {!hideDeferButton && !returnedFromSectionReview && (
                <div className="mt-3 sm:mt-4 mb-6 sm:mb-8 text-center">
                  <Button
                    onClick={handleDeferToggle}
                    disabled={selectedAnswer !== undefined}
                    className={`w-full transition-all duration-300 rounded-lg sm:rounded-xl h-10 sm:h-12 font-bold text-xs sm:text-sm lg:text-xs xl:text-sm min-w-0 ${
                      selectedAnswer !== undefined
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50'
                        : isDeferred 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                          : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                    } shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:hover:shadow-lg`}
                    size="lg"
                  >
                    <Flag className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2 flex-shrink-0" />
                    <span className="truncate">
                      {selectedAnswer !== undefined ? 'لا يمكن التأجيل بعد الإجابة' : (isDeferred ? 'إلغاء التأجيل' : 'تأجيل السؤال')}
                    </span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation Footer - Mobile Optimized */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <div className="bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900"></div>
          <div className="relative mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex justify-between items-center gap-2 sm:gap-4">
              {/* Previous Button - Mobile Optimized */}
              <Button
                onClick={handlePrevious}
                disabled={!canGoPrevious()}
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 px-3 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 flex-shrink-0"
                size="sm"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
                <span className="hidden sm:inline">السابق</span>
                <span className="sm:hidden">السابق</span>
              </Button>

              {/* Section Review Button - Only show when conditions are met */}
              {shouldShowSectionReviewButton() && (
                <Button
                  onClick={handleSectionReview}
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 px-3 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl border border-white/30 flex-shrink-0"
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
                  <span className="hidden sm:inline">مراجعة القسم</span>
                  <span className="sm:hidden">مراجعة</span>
                </Button>
              )}

              {/* Spacer to push next button to the right */}
              <div className="flex-1"></div>

              {/* Next Button - Mobile Optimized with conditional text and styling */}
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className={`backdrop-blur-sm text-white transition-all duration-300 px-3 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 flex-shrink-0 ${
                  (() => {
                    const currentQuestionNumber = currentQuestionIndex + 1;
                    const isLastQuestionInSection = currentQuestionNumber % 13 === 0;
                    
                    // Check for deferred questions at section end or exam end
                    if ((isLastQuestionInSection && !isLastQuestion && examMode === 'sectioned' && hasDeferredQuestionsInCurrentSection) || 
                        (isLastQuestion && hasDeferredQuestionsInCurrentSection)) {
                      return 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 animate-pulse';
                    }
                    
                    // Apply gradient to End Section and End Exam buttons
                    if (isLastQuestion || (isLastQuestionInSection && examMode === 'sectioned')) {
                      return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse';
                    }
                    return 'bg-white/20 hover:bg-white/30';
                  })()
                }`}
                size="sm"
              >
                <span className="hidden sm:inline">{getNextButtonText()}</span>
                <span className="sm:hidden">{getNextButtonMobileText()}</span>
                {(() => {
                  const currentQuestionNumber = currentQuestionIndex + 1;
                  const isLastQuestionInSection = currentQuestionNumber % 13 === 0;
                  
                  if ((isLastQuestionInSection && !isLastQuestion && examMode === 'sectioned' && hasDeferredQuestionsInCurrentSection) || 
                      (isLastQuestion && hasDeferredQuestionsInCurrentSection)) {
                    return <Flag className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />;
                  }
                  return <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />;
                })()}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;