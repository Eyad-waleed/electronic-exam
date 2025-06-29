import React from "react";
import { useExamStore } from "../store/examStore";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, BookOpen, BarChart3, Target, Flag, GraduationCap, Award, Home } from 'lucide-react';

const SectionReview = () => {
  const {
    currentSection,
    examQuestions,
    userAnswers,
    deferredQuestions,
    exitSectionReview,
    goToQuestion,
    timerActive,
    timeRemaining,
    examMode,
    completeExam
  } = useExamStore();

  // Calculate total sections
  const totalSections = Math.max(...examQuestions.map(q => q.section));
  const isLastSection = currentSection === totalSections;

  // Get current section questions
  const sectionQuestions = examQuestions.filter(q => q.section === currentSection);
  
  // Calculate section statistics
  const sectionStats = {
    total: sectionQuestions.length,
    answered: 0,
    unanswered: 0,
    deferred: 0
  };

  sectionQuestions.forEach(question => {
    if (userAnswers[question.question_number] !== undefined) {
      sectionStats.answered++;
    } else {
      sectionStats.unanswered++;
    }
    
    if (deferredQuestions[question.question_number]) {
      sectionStats.deferred++;
    }
  });

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getQuestionTypeLabel = (type) => {
    const typeLabels = {
      analogy: 'التناظر اللفظي',
      completion: 'إكمال الجمل',
      error: 'الخطأ السياقي',
      rc: 'استيعاب المقروء',
      odd: 'المفردة الشاذة'
    };
    return typeLabels[type] || type;
  };

  const handleQuestionClick = (questionNumber) => {
    const globalIndex = examQuestions.findIndex(q => q.question_number === questionNumber);
    if (globalIndex !== -1) {
      exitSectionReview(); // Exit section review mode
      goToQuestion(globalIndex);
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to top
    }
  };

  const handleNextSection = () => {
    if (isLastSection) {
      completeExam();
    } else {
      // Move to next section
      const nextSectionFirstQuestion = examQuestions.find(q => q.section === currentSection + 1);
      if (nextSectionFirstQuestion) {
        const questionIndex = examQuestions.findIndex(q => q.question_number === nextSectionFirstQuestion.question_number);
        if (questionIndex !== -1) {
          exitSectionReview();
          goToQuestion(questionIndex);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }
  };

  const completionPercentage = Math.round((sectionStats.answered / sectionStats.total) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      {/* Enhanced Header - Mobile Optimized */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4 sm:mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 sm:p-4">
                  <BookOpen className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">
                مراجعة القسم {currentSection}
              </h1>
              <p className="text-base sm:text-xl text-white/90 mb-4 sm:mb-6">
                راجع إجاباتك قبل الانتقال للقسم التالي
              </p>
              
              {/* Progress Indicator - Mobile Optimized */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 max-w-sm mx-auto">
                <div className="text-white text-base sm:text-lg font-medium mb-1 sm:mb-2">
                  نسبة الإنجاز: {completionPercentage}%
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 sm:h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-emerald-400 h-2 sm:h-3 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {timerActive && (
                <div className="mt-4 sm:mt-6 bg-red-500/20 backdrop-blur-sm rounded-lg px-4 py-2 sm:px-6 sm:py-3 inline-flex items-center gap-1 sm:gap-2 border border-red-300/30">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-red-200" />
                  <span className="text-red-200 font-semibold text-sm sm:text-lg">
                    الوقت المتبقي: {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
            <Button 
              variant="" 
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm border border-white/30 px-3 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base" 
              onClick={() => window.location.href = '/'}
            >
              <Home className="h-4 w-4 sm:h-6 sm:w-6 ml-1 sm:ml-2" />
              <span className="font-bold hidden sm:inline">الصفحة الرئيسية</span>
              <span className="font-bold sm:hidden">الرئيسية</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Enhanced Statistics Cards - Mobile Optimized */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-4">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full p-2 sm:p-3">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">{sectionStats.total}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">إجمالي الأسئلة</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-4">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-2 sm:p-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1 sm:mb-2">{sectionStats.answered}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">مُجابة</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-4">
                  <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-full p-2 sm:p-3">
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-red-600 mb-1 sm:mb-2">{sectionStats.unanswered}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">غير مُجابة</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="flex items-center justify-center mb-2 sm:mb-4">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-full p-2 sm:p-3">
                    <Flag className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-amber-600 mb-1 sm:mb-2">{sectionStats.deferred}</div>
                <div className="text-xs sm:text-sm text-gray-600 font-medium">مؤجلة</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Questions Grid - Mobile Optimized */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex items-center justify-center mb-2 sm:mb-4">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full p-2 sm:p-3">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                أسئلة القسم {currentSection}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {sectionQuestions.sort((a, b) => a.question_number - b.question_number).map((question, index) => {
                  const isAnswered = userAnswers[question.question_number] !== undefined;
                  const isDeferred = deferredQuestions[question.question_number];
                  
                  return (
                    <div
                      key={question.question_number}
                      className={`relative p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-105 border-2 ${
                        isAnswered 
                          ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100' 
                          : isDeferred
                          ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100'
                          : 'border-red-300 bg-gradient-to-br from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100'
                      }`}
                      onClick={() => handleQuestionClick(question.question_number)}
                    >
                      {/* Status Icon */}
                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                        {isAnswered ? (
                          <div className="bg-green-500 rounded-full p-1 sm:p-2">
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                        ) : isDeferred ? (
                          <div className="bg-amber-500 rounded-full p-1 sm:p-2">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                        ) : (
                          <div className="bg-red-500 rounded-full p-1 sm:p-2">
                            <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Question Number */}
                      <div className="text-center mb-2 sm:mb-4 mt-1 sm:mt-2">
                        <div className="text-lg sm:text-2xl font-bold text-gray-800">
                          {question.question_number}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 font-medium">
                          السؤال
                        </div>
                      </div>
                      
                      {/* Question Type Badge */}
                      <div className="text-center mb-2 sm:mb-4">
                        <Badge 
                          variant="outline" 
                          className={`px-2 py-0.5 sm:px-3 sm:py-1 text-xs font-medium rounded-full border-2 ${
                            isAnswered 
                              ? 'border-green-300 text-green-700 bg-green-100' 
                              : isDeferred
                              ? 'border-amber-300 text-amber-700 bg-amber-100'
                              : 'border-red-300 text-red-700 bg-red-100'
                          }`}
                        >
                          {getQuestionTypeLabel(question.type)}
                        </Badge>
                      </div>
                      
                      {/* Question Preview */}
                      <div className="text-xs sm:text-sm text-gray-700 text-center line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-4 leading-relaxed">
                        {question.question}
                      </div>
                      
                      {/* Status Label */}
                      <div className="text-center">
                        <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold ${
                          isAnswered 
                            ? 'bg-green-200 text-green-800' 
                            : isDeferred
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-red-200 text-red-800'
                        }`}>
                          {isAnswered ? 'مُجابة' : isDeferred ? 'مؤجلة' : 'غير مُجابة'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Action Buttons - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 sm:pt-6">
            <Button
              onClick={() => { 
                exitSectionReview(); 
                // Navigate to the first question of the current section
                const firstQuestionOfSection = examQuestions.find(q => q.section === currentSection);
                if (firstQuestionOfSection) {
                  const questionIndex = examQuestions.findIndex(q => q.question_number === firstQuestionOfSection.question_number);
                  if (questionIndex !== -1) {
                    goToQuestion(questionIndex);
                  }
                }
                window.scrollTo({ top: 0, behavior: 'smooth' }); 
              }}
              className="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 transition-all duration-300 px-4 py-2 sm:px-8 sm:py-4 text-sm sm:text-lg font-bold rounded-lg shadow-lg hover:shadow-xl border-2 border-gray-300 hover:border-gray-400 transform hover:scale-105 w-full sm:w-auto"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
              العودة للقسم {currentSection}
            </Button>
            
            <div className="text-center w-full sm:w-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 sm:px-6 sm:py-2 border-2 border-blue-300 shadow-lg">
                <div className="text-blue-700 text-xs sm:text-sm font-medium">
                  القسم {currentSection} من {totalSections}
                </div>
                <div className="w-24 sm:w-32 bg-blue-200 rounded-full h-1.5 sm:h-2 mt-1 mx-auto">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(currentSection / totalSections) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <Button
              onClick={handleNextSection}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-300 px-4 py-2 sm:px-8 sm:py-4 text-sm sm:text-lg font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 w-full sm:w-auto"
              size="sm"
            >
              {isLastSection ? 'إنهاء الاختبار' : `الانتقال للقسم ${currentSection + 1}`}
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SectionReview;

