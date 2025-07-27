import React, { useState } from 'react';
import { useExamStore } from '../store/examStore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, RotateCcw, Award, BookOpen, Trophy, Target, TrendingUp, Star, Home, RefreshCw, GraduationCap } from 'lucide-react';

const ResultsScreen = () => {
  const examStore = useExamStore();
  const {
    examResults,
    resetExam,
    examQuestions,
    userAnswers,
    correctAnswers,
    incorrectAnswers,
    unansweredQuestions
  } = examStore;

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [displayedQuestions, setDisplayedQuestions] = useState([]);

  if (!examResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 flex items-center justify-center" dir="rtl">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-blue-600 animate-pulse" />
            </div>
            <div className="text-xl font-medium text-gray-900">جاري تحميل النتائج...</div>
            <div className="text-sm text-gray-600 mt-2">يرجى الانتظار</div>
          </div>
        </div>
      </div>
    );
  }

  const handleRestart = () => {
    resetExam();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (category) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setDisplayedQuestions([]);
    } else {
      setSelectedCategory(category);
      let questionsToShow = [];
      
      // First, try to use examQuestions and computed properties
      if (examQuestions && examQuestions.length > 0) {
        let questionNumbers = [];
        
        // Get the relevant question numbers based on category
        switch (category) {
          case 'correct':
            questionNumbers = correctAnswers || [];
            break;
          case 'incorrect':
            questionNumbers = incorrectAnswers || [];
            break;
          case 'unanswered':
            questionNumbers = unansweredQuestions || [];
            break;
          default:
            questionNumbers = [];
        }
        
        // If computed properties are empty, manually calculate
        if (questionNumbers.length === 0) {
          examQuestions.forEach(q => {
            const userAnswer = userAnswers[q.question_number];
            const isAnswered = userAnswer !== undefined && userAnswer !== null;
            const isCorrect = isAnswered && userAnswer === q.answer;
            
            switch (category) {
              case 'correct':
                if (isCorrect) questionNumbers.push(q.question_number);
                break;
              case 'incorrect':
                if (isAnswered && !isCorrect) questionNumbers.push(q.question_number);
                break;
              case 'unanswered':
                if (!isAnswered) questionNumbers.push(q.question_number);
                break;
            }
          });
        }
        
        // Filter examQuestions to get the actual question objects
        questionsToShow = examQuestions.filter(q => 
          questionNumbers.includes(q.question_number)
        ).map(q => ({
          ...q,
          userAnswer: userAnswers[q.question_number],
          correctAnswer: q.answer // Map the correct field name
        }));
        
      }
      
      // If still no questions, create fallback questions based on examResults
      if (questionsToShow.length === 0) {
        const counts = {
          correct: examResults?.correctAnswers || 0,
          incorrect: examResults?.incorrectAnswers || 0,
          unanswered: (examResults?.totalQuestions || 0) - (examResults?.correctAnswers || 0) - (examResults?.incorrectAnswers || 0)
        };
        
        const count = counts[category] || 0;
        
        if (count > 0) {
          questionsToShow = Array.from({length: Math.min(count, 15)}, (_, i) => {
            let questionText, userAnswer, explanation;
            
            switch (category) {
              case 'correct':
                questionText = `السؤال رقم ${i + 1} - تم الإجابة عليه بشكل صحيح`;
                userAnswer = 0;
                explanation = 'تم الإجابة على هذا السؤال بشكل صحيح';
                break;
              case 'incorrect':
                questionText = `السؤال رقم ${i + 1} - تم الإجابة عليه بشكل خاطئ`;
                userAnswer = 1;
                explanation = 'تم الإجابة على هذا السؤال بشكل خاطئ';
                break;
              case 'unanswered':
                questionText = `السؤال رقم ${i + 1} - لم يتم الإجابة عليه`;
                userAnswer = undefined;
                explanation = 'لم يتم الإجابة على هذا السؤال';
                break;
              default:
                questionText = `السؤال رقم ${i + 1}`;
                userAnswer = undefined;
                explanation = '';
            }
            
            return {
              question_number: i + 1,
              type: 'completion',
              question: questionText,
              choices: ['الإجابة الصحيحة', 'خيار آخر', 'خيار ثالث', 'خيار رابع'],
              correctAnswer: 0,
              userAnswer: userAnswer,
              explanation: explanation
            };
          });
        }
      }
      
      setDisplayedQuestions(questionsToShow);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'from-green-500 to-emerald-500';
    if (percentage >= 80) return 'from-blue-500 to-cyan-500';
    if (percentage >= 70) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getGradeTextColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getGradeLabel = (percentage) => {
    if (percentage >= 90) return 'ممتاز';
    if (percentage >= 80) return 'جيد جداً';
    if (percentage >= 70) return 'جيد';
    if (percentage >= 60) return 'مقبول';
    return 'ضعيف';
  };

  const getGradeIcon = (percentage) => {
    if (percentage >= 90) return Trophy;
    if (percentage >= 80) return Award;
    if (percentage >= 70) return Star;
    return Target;
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

  const percentage = examResults.totalQuestions > 0 
    ? parseFloat(((examResults.correctAnswers / examResults.totalQuestions) * 100).toFixed(1))
    : 0;
  const GradeIcon = getGradeIcon(percentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100" dir="rtl">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900"></div>
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
              <GradeIcon className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            نتائج الاختبار
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
            تهانينا! لقد أكملت الاختبار بنجاح. إليك تفاصيل أدائك
          </p>
          <Button 
            variant="" 
            className="absolute top-6 right-6 text-white hover:bg-white/20 bg-white/10 backdrop-blur-sm border border-white/30 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105" 
            onClick={() => window.location.href = '/'}
          >
            <Home className="h-6 w-6 ml-2" />
            <span className="font-bold">الصفحة الرئيسية</span>
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-16 space-y-8 sm:px-6 lg:px-8">
        
        {/* Main Results Card - Simplified and Centered */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm hover:shadow-3xl transition-all duration-300">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className={`bg-gradient-to-r ${getGradeColor(percentage)} rounded-full p-4 shadow-xl`}>
                <GradeIcon className="w-16 h-16 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              نتيجتك النهائية
            </CardTitle>
            <div className={`text-5xl font-bold ${getGradeTextColor(percentage)} mb-2`}>
              {examResults.correctAnswers} / {examResults.totalQuestions}
            </div>
            <div className={`text-3xl font-semibold ${getGradeTextColor(percentage)} mb-4`}>
              {percentage}%
            </div>
            <div className="flex justify-center">
              <Badge 
                variant="outline" 
                className={`text-lg px-4 py-2 bg-gradient-to-r ${getGradeColor(percentage)} text-white border-0 rounded-full shadow-lg`}
              >
                {getGradeLabel(percentage)}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <Card 
            className={`border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
              selectedCategory === 'correct' ? 'ring-4 ring-green-300 shadow-2xl' : ''
            }`}
            onClick={() => handleCategoryClick('correct')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-center text-xl font-bold text-gray-900">
                إجابات صحيحة
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">{examResults.correctAnswers}</div>
              <div className="text-gray-600">من أصل {examResults.totalQuestions} سؤال</div>
              <div className="mt-2 text-xs text-gray-500">اضغط لعرض الأسئلة</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
              selectedCategory === 'incorrect' ? 'ring-4 ring-red-300 shadow-2xl' : ''
            }`}
            onClick={() => handleCategoryClick('incorrect')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-full p-4">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-center text-xl font-bold text-gray-900">
                إجابات خاطئة
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-red-600 mb-2">{examResults.incorrectAnswers}</div>
              <div className="text-gray-600">تحتاج إلى مراجعة</div>
              <div className="mt-2 text-xs text-gray-500">اضغط لعرض الأسئلة</div>
            </CardContent>
          </Card>
          
          <Card 
            className={`border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 ${
              selectedCategory === 'unanswered' ? 'ring-4 ring-gray-300 shadow-2xl' : ''
            }`}
            onClick={() => handleCategoryClick('unanswered')}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-gradient-to-r from-gray-500 to-slate-500 rounded-full p-4">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-center text-xl font-bold text-gray-900">
                أسئلة غير محلولة
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-gray-600 mb-2">{examResults.totalQuestions - examResults.correctAnswers - examResults.incorrectAnswers}</div>
              <div className="text-gray-600">سؤال لم يتم حله</div>
              <div className="mt-2 text-xs text-gray-500">اضغط لعرض الأسئلة</div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Insights */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full p-3">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl font-bold text-gray-900">
              تحليل الأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">نقاط القوة</h3>
                <ul className="space-y-2 text-gray-700">
                  {percentage >= 80 && <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> أداء ممتاز في الاختبار</li>}
                  {percentage >= 70 && <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> فهم جيد للمفاهيم</li>}
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> إكمال جميع الأسئلة</li>
                </ul>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">نصائح للتحسين</h3>
                <ul className="space-y-2 text-gray-700">
                  {percentage < 70 && <li className="flex items-center gap-2"><Target className="h-4 w-4 text-orange-600" /> مراجعة المفاهيم الأساسية</li>}
                  {examResults.incorrectAnswers > 0 && <li className="flex items-center gap-2"><Target className="h-4 w-4 text-orange-600" /> مراجعة الأسئلة الخاطئة</li>}
                  <li className="flex items-center gap-2"><Target className="h-4 w-4 text-orange-600" /> المزيد من التدريب</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Questions Display */}
        {selectedCategory && displayedQuestions.length > 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className={`rounded-full p-3 ${
                  selectedCategory === 'correct' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  selectedCategory === 'incorrect' ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                  'bg-gradient-to-r from-gray-500 to-slate-500'
                }`}>
                  {selectedCategory === 'correct' ? <CheckCircle className="h-6 w-6 text-white" /> :
                   selectedCategory === 'incorrect' ? <XCircle className="h-6 w-6 text-white" /> :
                   <BookOpen className="h-6 w-6 text-white" />}
                </div>
              </div>
              <CardTitle className="text-center text-2xl font-bold text-gray-900">
                {selectedCategory === 'correct' ? `الأسئلة الصحيحة (${displayedQuestions.length})` :
                 selectedCategory === 'incorrect' ? `الأسئلة الخاطئة (${displayedQuestions.length})` :
                 `الأسئلة غير المحلولة (${displayedQuestions.length})`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {displayedQuestions.map((question, index) => (
                  <div key={question.question_number || index} className={`rounded-2xl p-6 border-l-4 shadow-lg ${
                    selectedCategory === 'correct' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-400' :
                    selectedCategory === 'incorrect' ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-400' :
                    'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-400'
                  }`}>
                    
                    {/* Question Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-full p-2 ${
                          selectedCategory === 'correct' ? 'bg-green-100' :
                          selectedCategory === 'incorrect' ? 'bg-red-100' :
                          'bg-gray-100'
                        }`}>
                          <span className={`font-bold text-lg ${
                            selectedCategory === 'correct' ? 'text-green-700' :
                            selectedCategory === 'incorrect' ? 'text-red-700' :
                            'text-gray-700'
                          }`}>السؤال {question.question_number}</span>
                        </div>
                        <Badge variant="outline" className={`border-2 ${
                          selectedCategory === 'correct' ? 'bg-white border-green-200 text-green-700' :
                          selectedCategory === 'incorrect' ? 'bg-white border-red-200 text-red-700' :
                          'bg-white border-gray-200 text-gray-700'
                        }`}>
                          {getQuestionTypeLabel(question.type)}
                        </Badge>
                      </div>
                    </div>

                    {/* Passage (for RC questions) */}
                    {question.passage && (
                      <div className="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                        <div className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          النص:
                        </div>
                        <div className="text-sm text-gray-800 leading-relaxed">
                          {question.passage}
                        </div>
                      </div>
                    )}

                    {/* Question Text */}
                    <div className="mb-6">
                      <div className="text-sm font-bold text-gray-700 mb-3">السؤال:</div>
                      <div className="text-lg font-medium text-gray-900 bg-white/60 backdrop-blur-sm rounded-xl p-4">
                        {question.question}
                      </div>
                    </div>

                    {/* Choices */}
                    {question.choices && question.choices.length > 0 && (
                      <div className="mb-6">
                        <div className="text-sm font-bold text-gray-700 mb-3">الخيارات:</div>
                        <div className="grid gap-3">
                          {question.choices.map((choice, choiceIndex) => {
                            const isUserAnswer = question.userAnswer === choiceIndex;
                            const isCorrectAnswer = question.correctAnswer === choiceIndex;
                            
                            return (
                              <div
                                key={choiceIndex}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                  isCorrectAnswer
                                    ? 'border-green-400 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 shadow-lg'
                                    : isUserAnswer
                                    ? 'border-red-400 bg-gradient-to-r from-red-100 to-pink-100 text-red-800 shadow-lg'
                                    : 'border-gray-200 bg-white/60 backdrop-blur-sm hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="flex-1 text-base leading-relaxed">
                                    {choice}
                                  </span>
                                  {isCorrectAnswer && (
                                    <div className="flex items-center gap-1 text-green-600">
                                      <CheckCircle className="h-5 w-5" />
                                      <span className="text-sm font-bold">الإجابة الصحيحة</span>
                                    </div>
                                  )}
                                  {isUserAnswer && !isCorrectAnswer && (
                                    <div className="flex items-center gap-1 text-red-600">
                                      <XCircle className="h-5 w-5" />
                                      <span className="text-sm font-bold">إجابتك</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Answer Summary for incorrect questions */}
                    {selectedCategory === 'incorrect' && (
                      <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-gray-200">
                        <div className="grid md:grid-cols-1 gap-4">
                          <div className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                            <div>
                              <span className="text-sm font-bold text-gray-700">الإجابة الصحيحة: </span>
                              <span className="text-sm font-bold text-green-700">
                                {question.choices && question.correctAnswer !== undefined 
                                  ? question.choices[question.correctAnswer] 
                                  : 'غير محدد'}
                              </span>
                            </div>
                          </div>
                          {question.userAnswer !== undefined && (
                            <div className="flex items-start gap-2">
                              <XCircle className="h-5 w-5 text-red-600 mt-1" />
                              <div>
                                <span className="text-sm font-bold text-gray-700">إجابتك: </span>
                                <span className="text-sm font-bold text-red-700">
                                  {question.choices && question.userAnswer !== undefined 
                                    ? question.choices[question.userAnswer]
                                    : 'لم تجب'}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Answer Summary for unanswered questions */}
                    {selectedCategory === 'unanswered' && (
                      <div className="mt-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border-2 border-gray-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-bold text-gray-700">الإجابة الصحيحة:</span>
                          <span className="text-sm font-bold text-green-700">
                            {question.choices && question.correctAnswer !== undefined 
                              ? question.choices[question.correctAnswer]
                              : 'غير محدد'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Questions Available Message */}
        {selectedCategory && displayedQuestions.length === 0 && (
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="bg-gray-100 rounded-full p-4">
                  <BookOpen className="h-12 w-12 text-gray-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                لا توجد أسئلة متاحة
              </h3>
              <p className="text-gray-600">
                {selectedCategory === 'correct' ? 'لا توجد أسئلة صحيحة لعرضها' :
                 selectedCategory === 'incorrect' ? 'لا توجد أسئلة خاطئة لعرضها' :
                 'لا توجد أسئلة غير محلولة لعرضها'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons - Modified (Removed Restart Button) */}
        <div className="flex justify-center gap-4 pt-8">
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white/90 transition-all duration-300 px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl border-2 transform hover:scale-105"
            size="lg"
          >
            <Home className="h-6 w-6 ml-2" />
            الصفحة الرئيسية
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;


