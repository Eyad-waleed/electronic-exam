import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, Flag, ArrowLeft, Home } from 'lucide-react';
import { useExamStore } from '../store/examStore';

const ReviewScreen = () => {
  const {
    examQuestions,
    userAnswers,
    deferredQuestions,
    reviewFilter,
    examMode,
    currentSection,
    exitReviewMode,
    goToQuestion,
    completeExam,
    getQuestionStats
  } = useExamStore();

  const stats = getQuestionStats();
  
  // Get filtered questions based on current filter
  const getFilteredQuestions = () => {
    switch (reviewFilter) {
      case 'answered':
        return examQuestions.filter(q => userAnswers[q.question_number] !== undefined);
      case 'unanswered':
        return examQuestions.filter(q => userAnswers[q.question_number] === undefined);
      case 'deferred':
        return examQuestions.filter(q => deferredQuestions[q.question_number]);
      default:
        return examQuestions;
    }
  };

  const filteredQuestions = getFilteredQuestions();

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

  const getQuestionStatus = (questionNumber) => {
    const isAnswered = userAnswers[questionNumber] !== undefined;
    const isDeferred = deferredQuestions[questionNumber];
    
    if (isAnswered && isDeferred) {
      return { status: 'answered-deferred', label: 'مجاب ومؤجل', color: 'bg-blue-100 text-blue-800' };
    } else if (isAnswered) {
      return { status: 'answered', label: 'مجاب', color: 'bg-green-100 text-green-800' };
    } else if (isDeferred) {
      return { status: 'deferred', label: 'مؤجل', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'unanswered', label: 'غير مجاب', color: 'bg-red-100 text-red-800' };
    }
  };

  const handleQuestionClick = (questionIndex) => {
    goToQuestion(questionIndex);
  };

  const getQuestionDisplayNumber = (question) => {
    // Find the actual index of this question in the original exam questions array
    const actualIndex = examQuestions.findIndex(q => q.question_number === question.question_number);
    return actualIndex + 1; // Display as 1-based index
  };

  const getQuestionSection = (question) => {
    const actualIndex = examQuestions.findIndex(q => q.question_number === question.question_number);
    return Math.floor(actualIndex / 13) + 1; // Calculate section (1-based)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      {/* Header - Mobile Optimized */}
      <div className="bg-blue-900 text-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">مراجعة جميع الأسئلة</h1>
          {examMode === 'sectioned' && (
            <p className="text-blue-200 text-sm sm:text-base">القسم {currentSection}</p>
          )}
          <Button 
            variant="ghost" 
            className="absolute top-3 right-3 sm:top-6 sm:right-6 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm border border-white/30 px-3 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 text-sm sm:text-base" 
            onClick={() => window.location.href = '/'}
          >
            <Home className="h-4 w-4 sm:h-6 sm:w-6 ml-1 sm:ml-2" />
            <span className="font-bold hidden sm:inline">الصفحة الرئيسية</span>
            <span className="font-bold sm:hidden">الرئيسية</span>
          </Button>
        </div>
      </div>

      {/* Statistics Cards - Mobile Optimized */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-xs sm:text-sm text-gray-600">إجمالي الأسئلة</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.deferred}</div>
              <div className="text-xs sm:text-sm text-gray-600">أسئلة مؤجلة</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{stats.unanswered}</div>
              <div className="text-xs sm:text-sm text-gray-600">أسئلة غير مجابة</div>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.answered}</div>
              <div className="text-xs sm:text-sm text-gray-600">أسئلة مجابة</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Info - Mobile Optimized */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-base sm:text-lg font-semibold text-center sm:text-right">
            {reviewFilter === 'all' && `عرض ${filteredQuestions.length} من ${stats.total} سؤال`}
            {reviewFilter === 'answered' && `عرض ${filteredQuestions.length} سؤال مجاب`}
            {reviewFilter === 'unanswered' && `عرض ${filteredQuestions.length} سؤال غير مجاب`}
            {reviewFilter === 'deferred' && `عرض ${filteredQuestions.length} سؤال مؤجل`}
          </div>
          <Button variant="outline" onClick={exitReviewMode} className="flex items-center gap-1 sm:gap-2 px-3 py-2 text-sm sm:text-base">
            <ArrowLeft className="h-4 w-4" />
            العودة للاختبار
          </Button>
        </div>

        {/* Questions Grid - Mobile Optimized */}
        {filteredQuestions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {filteredQuestions.map((question) => {
              const questionStatus = getQuestionStatus(question.question_number);
              const displayNumber = getQuestionDisplayNumber(question);
              const questionSection = getQuestionSection(question);
              
              return (
                <Card 
                  key={question.question_number} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-r-4 border-blue-500"
                  onClick={() => handleQuestionClick(examQuestions.findIndex(q => q.question_number === question.question_number))}
                >
                  <CardHeader className="pb-1 sm:pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 sm:gap-2">
                        {questionStatus.status === 'answered' ? (
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        )}
                        <span className="font-bold text-sm sm:text-base">السؤال {displayNumber}</span>
                      </div>
                      <Badge variant="secondary" className={`${questionStatus.color} text-xs sm:text-sm px-2 py-1`}>
                        {questionStatus.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                      <span>{getQuestionTypeLabel(question.type)}</span>
                      {examMode === 'sectioned' && (
                        <span>القسم {questionSection}</span>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 sm:p-4 pt-0">
                    <div className="text-sm text-gray-700 line-clamp-3">
                      {question.passage && (
                        <div className="text-xs text-gray-500 mb-1 sm:mb-2 italic">
                          {question.passage.substring(0, 100)}...
                        </div>
                      )}
                      <div className="font-medium text-sm sm:text-base">
                        {question.question.length > 100 
                          ? `${question.question.substring(0, 100)}...`
                          : question.question
                        }
                      </div>
                    </div>
                    
                    {userAnswers[question.question_number] !== undefined && (
                      <div className="mt-2 sm:mt-3 p-2 bg-green-50 rounded text-xs sm:text-sm">
                        <span className="font-medium text-green-800">الإجابة المختارة: </span>
                        <span className="text-green-700">
                          {question.choices[userAnswers[question.question_number]]}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-12">
            <div className="text-gray-500 text-base sm:text-lg mb-3 sm:mb-4">
              {reviewFilter === 'answered' && 'لا توجد أسئلة مجابة'}
              {reviewFilter === 'unanswered' && 'لا توجد أسئلة غير مجابة'}
              {reviewFilter === 'deferred' && 'لا توجد أسئلة مؤجلة'}
              {reviewFilter === 'all' && 'لا توجد أسئلة'}
            </div>
            <Button onClick={exitReviewMode} className="px-4 py-2 text-sm sm:text-base">العودة للاختبار</Button>
          </div>
        )}

        {/* Action Buttons - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4 sm:pt-6">
          <Button 
            onClick={exitReviewMode}
            variant="outline"
            className="flex items-center gap-1 sm:gap-2 px-4 py-2 text-sm sm:text-base w-full sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            إنهاء المراجعة
          </Button>
          
          <Button 
            onClick={completeExam}
            className="bg-red-600 hover:bg-red-700 flex items-center gap-1 sm:gap-2 px-4 py-2 text-sm sm:text-base w-full sm:w-auto"
          >
            <Flag className="h-4 w-4" />
            إنهاء الاختبار
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReviewScreen;


