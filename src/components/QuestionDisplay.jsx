import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ChevronLeft, Clock, Flag, Filter, BarChart3, BookOpen, GraduationCap, Target, CheckCircle, Home, X, ZoomIn } from 'lucide-react';
import { useExamStore } from '../store/examStore';

const QuestionDisplay = () => {
  const [isTextEnlarged, setIsTextEnlarged] = useState(false);

  const {
    examQuestions,
    currentQuestionIndex,
    currentSection,
    userAnswers,
    deferredQuestions,
    examMode,
    timerActive,
    timeRemaining,
    selectAnswer,
    toggleDeferred,
    nextQuestion,
    previousQuestion,
    getQuestionStats,
    getCurrentExamInfo,
    goToQuestion // Assuming this function exists in the store
  } = useExamStore();

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

  // Allow navigation for all question types - removed answer requirement
  const canProceed = true;

  // Check if there are any deferred questions
  const hasDeferredQuestions = Object.values(deferredQuestions).some(deferred => deferred);
  
  // Find the first deferred question index
  const getFirstDeferredQuestionIndex = () => {
    for (let i = 0; i < examQuestions.length; i++) {
      if (deferredQuestions[examQuestions[i].question_number]) {
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
    // If it's the last question and there are deferred questions, go to first deferred question
    if (isLastQuestion && hasDeferredQuestions) {
      const firstDeferredIndex = getFirstDeferredQuestionIndex();
      if (firstDeferredIndex !== -1) {
        // If goToQuestion function exists, use it; otherwise use a fallback
        if (typeof goToQuestion === 'function') {
          goToQuestion(firstDeferredIndex);
        } else {
          // Fallback: you might need to implement this based on your store structure
          // This is a placeholder - adjust according to your actual store implementation
          console.log('Navigate to deferred question at index:', firstDeferredIndex);
        }
      }
    } else {
      nextQuestion();
    }
  };

  const handlePrevious = () => {
    previousQuestion();
  };

  const handleTextEnlarge = () => {
    setIsTextEnlarged(true);
  };

  const handleCloseEnlargedText = () => {
    setIsTextEnlarged(false);
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
    if (isLastQuestion && hasDeferredQuestions) {
      return 'لديك أسئلة مؤجلة';
    }
    return 'التالي';
  };

  const getNextButtonMobileText = () => {
    if (isLastQuestion && hasDeferredQuestions) {
      return 'أسئلة مؤجلة';
    }
    return 'التالي';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      {/* Enhanced Header - Mobile Optimized */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900"></div>
        <div className="">
          <div className="mx-auto px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-4 py-1 sm:py-2 border border-white/30">
                  <div className="text-white font-bold text-sm sm:text-lg">
                    السؤال {currentQuestionIndex + 1} من {examQuestions.length}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                {examInfo.type === 'all' && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-2 sm:px-4 py-1 sm:py-2 border border-white/30 hidden md:block">
                    <div className="text-white font-medium text-sm sm:text-base">القسم {currentSection}</div>
                  </div>
                )}
                {timerActive && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2 border border-white/30">
                    <div className={`font-bold text-base sm:text-lg flex items-center gap-2 ${timeRemaining < 300 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="text-lg sm:text-xl font-extrabold tracking-wide">{formatTime(timeRemaining)}</span>
                    </div>
                  </div>
                )}
                <Button 
                  variant="" 
                  className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 px-3 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 flex-shrink-0" 
                  onClick={() => window.location.href = '/'}
                >
                  <Home className="h-4 w-4 sm:h-6 sm:w-6 ml-1 sm:ml-2" />
                  <span className="font-bold hidden sm:inline">الصفحة الرئيسية</span>
                  <span className="font-bold sm:hidden">الرئيسية</span>
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

      {/* Main Content - Mobile Optimized */}
      <div className="pt-3 sm:pt-4 pb-3 sm:pb-4 min-h-screen px-2 sm:px-4 lg:px-8">
        <div className="px-2 sm:px-4 py-4 sm:py-8 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-4 sm:gap-8">
            {/* Question Area - Mobile Optimized */}
            <div className="lg:col-span-3">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-white/20 p-4 sm:p-8">
                {/* Question Type and Status - Mobile Optimized */}
                <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs sm:text-sm bg-gradient-to-r from-gray-700 to-gray-800 text-white px-2 sm:px-4 py-1 sm:py-2 font-medium rounded-full border-0">
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
                  <Card className="mb-4 sm:mb-6 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
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

                {/* Question text - Mobile Optimized */}
                <div className="text-base sm:text-lg font-medium leading-relaxed mb-4 sm:mb-8 text-gray-900 text-center">
                  {currentQuestion.question}
                </div>

                {/* Answer choices - Mobile Optimized */}
                <div className="space-y-3 sm:space-y-4 max-w-4xl mx-auto">
                  <RadioGroup 
                    value={selectedAnswer?.toString() || ''} 
                    onValueChange={(value) => handleAnswerSelect(parseInt(value))}
                    className="space-y-2 sm:space-y-3"
                  >
                    {currentQuestion.choices && currentQuestion.choices.map((choice, index) => (
                      <div 
                        key={index} 
                        className={`flex items-center space-x-2 sm:space-x-3 space-x-reverse p-3 sm:p-4 rounded-lg sm:rounded-xl transition-all duration-300 border-2 bg-white/60 backdrop-blur-sm cursor-pointer ${
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
                          className="flex-1 cursor-pointer text-base sm:text-lg leading-relaxed text-right text-gray-800 font-medium pointer-events-none"
                        >
                          {choice}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </div>

            {/* Enhanced Sidebar - Mobile Optimized */}
            <div className="lg:col-span-1">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Instructions - Mobile Optimized */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
                    <div className="flex items-center justify-center mb-3 sm:mb-4">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-full p-2 sm:p-3">
                        <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-center text-lg sm:text-xl font-bold text-gray-900">
                      {getQuestionTypeLabel(currentQuestion.type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="text-gray-700 text-xs sm:text-sm leading-relaxed text-center">
                      {getQuestionTypeExplanation(currentQuestion.type)}
                    </div>
                  </CardContent>
                </Card>

                {/* Stats - Mobile Optimized */}
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
                    <div className="flex items-center justify-center mb-3 sm:mb-4">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-2 sm:p-3">
                        <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                      </div>
                    </div>
                    <CardTitle className="text-center text-lg sm:text-xl font-bold text-gray-900">
                      إحصائيات الاختبار
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-green-200">
                      <div className="flex justify-between items-center">
                        <span className="text-green-700 font-medium text-sm sm:text-base">مجاب عليها:</span>
                        <span className="font-bold text-xl sm:text-2xl text-green-800">{stats.answered}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium text-sm sm:text-base">غير مجاب:</span>
                        <span className="font-bold text-xl sm:text-2xl text-gray-800">{stats.unanswered}</span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 border-orange-200">
                      <div className="flex justify-between items-center">
                        <span className="text-orange-700 font-medium text-sm sm:text-base">مؤجلة:</span>
                        <span className="font-bold text-xl sm:text-2xl text-orange-800">{stats.deferred}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Defer Button - Mobile Optimized with proper spacing */}
              <div className="mt-4 sm:mt-6 mb-20 sm:mb-4 text-center">
                <Button
                  onClick={handleDeferToggle}
                  className={`w-full transition-all duration-300 rounded-lg sm:rounded-xl h-12 sm:h-12 font-bold text-sm sm:text-base ${
                    isDeferred 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600' 
                      : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
                  } shadow-lg hover:shadow-xl transform hover:scale-105`}
                  size="lg"
                >
                  <Flag className="h-4 w-4 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
                  {isDeferred ? 'إلغاء التأجيل' : 'تأجيل السؤال'}
                </Button>
              </div>
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
                disabled={isFirstQuestion}
                className="bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 px-3 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 flex-shrink-0"
                size="sm"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-1 sm:ml-2" />
                <span className="hidden sm:inline">السابق</span>
                <span className="sm:hidden">السابق</span>
              </Button>

              {/* Progress - Mobile Optimized */}
              <div className="text-center flex-1 max-w-xs sm:max-w-none">
                <div className="">
                  <div className="text-white text-xs sm:text-sm font-medium">
                    التقدم: {Math.round(((currentQuestionIndex + 1) / examQuestions.length) * 100)}%
                  </div>
                  <div className="w-20 sm:w-32 bg-white/20 rounded-full h-1.5 sm:h-2 mt-1 mx-auto">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-emerald-400 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / examQuestions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Next Button - Mobile Optimized with conditional text and styling */}
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                className={`backdrop-blur-sm text-white hover:bg-white/30 transition-all duration-300 px-3 sm:px-8 py-2 sm:py-3 text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed border border-white/30 flex-shrink-0 ${
                  isLastQuestion && hasDeferredQuestions 
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 animate-pulse' 
                    : 'bg-white/20'
                }`}
                size="sm"
              >
                <span className="hidden sm:inline">{getNextButtonText()}</span>
                <span className="sm:hidden">{getNextButtonMobileText()}</span>
                {isLastQuestion && hasDeferredQuestions ? (
                  <Flag className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                ) : (
                  <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;

