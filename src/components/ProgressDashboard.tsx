import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Scale, Utensils, Dumbbell, Calendar, Brain, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { format, subDays, parseISO } from 'date-fns';
import { performWeeklyAnalysis, WeeklyAnalysisResult } from '@/utils/weeklyAnalysis';

interface ProgressDashboardProps {
  user: User;
}

interface WeightLog {
  date: string;
  weight: number;
}

interface NutritionData {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface ExerciseData {
  date: string;
  exercise_count: number;
  total_calories: number;
}

export function ProgressDashboard({ user }: ProgressDashboardProps) {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [nutritionData, setNutritionData] = useState<NutritionData[]>([]);
  const [exerciseData, setExerciseData] = useState<ExerciseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<WeeklyAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

  const loadWeeklyAnalysis = async () => {
    if (analysisLoading) return; // Prevent multiple calls
    
    setAnalysisLoading(true);
    try {
      const result = await performWeeklyAnalysis(user.id);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error loading weekly analysis:', error);
      setAnalysisResult({ error: 'Failed to load analysis' });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const endDate = new Date();
      const startDate = subDays(endDate, 30); // Last 30 days

      // Load weight logs
      const { data: weights } = await supabase
        .from('weight_logs')
        .select('date, weight')
        .eq('user_id', user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (weights) {
        setWeightLogs(weights.map(w => ({
          date: w.date,
          weight: w.weight
        })));
      }

      // Load nutrition completion data (simplified for now)
      // This would need more complex queries to get actual completion rates
      const mockNutritionData: NutritionData[] = [];
      for (let i = 0; i < 7; i++) {
        const date = subDays(endDate, i);
        mockNutritionData.unshift({
          date: format(date, 'yyyy-MM-dd'),
          calories: Math.floor(Math.random() * 500) + 1800,
          protein: Math.floor(Math.random() * 50) + 120,
          fat: Math.floor(Math.random() * 30) + 60,
          carbs: Math.floor(Math.random() * 100) + 150
        });
      }
      setNutritionData(mockNutritionData);

        // Load exercise data (both completed workout plan exercises and AI-added exercises)
        const exerciseLogData: ExerciseData[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = format(subDays(endDate, i), 'yyyy-MM-dd');
          
          // Get completed workout plan exercises from daily_logs
          const { data: completedExercises } = await supabase
            .from('daily_logs')
            .select('item_id, modified_details')
            .eq('user_id', user.id)
            .eq('date', date)
            .eq('item_type', 'exercise')
            .eq('completed', true);

          // Get AI-added exercises from exercises table
          const { data: aiExercises } = await supabase
            .from('exercises')
            .select('calories_burned, exercise_name, date')
            .eq('user_id', user.id)
            .gte('date', `${date}T00:00:00.000Z`)
            .lt('date', `${date}T23:59:59.999Z`);

          console.log(`Completed workout plan exercises for ${date}:`, completedExercises);
          console.log(`AI-added exercises for ${date}:`, aiExercises);
          
          // Calculate calories for completed workout plan exercises
          let workoutPlanCalories = 0;
          if (completedExercises && completedExercises.length > 0) {
            // For each completed workout plan exercise, estimate calories based on exercise type
            // This is a simplified approach - in a real app you'd want to store more detailed info
            for (const exercise of completedExercises) {
              const modifiedDetails = exercise.modified_details as any;
              if (modifiedDetails?.calories_burned) {
                workoutPlanCalories += modifiedDetails.calories_burned;
              } else {
                // Default calorie estimate for strength training exercises (could be improved)
                workoutPlanCalories += 150; // Average calories for 30-45 min strength training
              }
            }
          }
          
          const completedCount = completedExercises?.length || 0;
          const aiCount = aiExercises?.length || 0;
          const total_exercise_count = completedCount + aiCount;
          const aiCalories = aiExercises?.reduce((sum, exercise) => sum + (exercise.calories_burned || 0), 0) || 0;
          const total_calories = workoutPlanCalories + aiCalories;

          exerciseLogData.push({
            date,
            exercise_count: total_exercise_count,
            total_calories
          });
        }
      
      setExerciseData(exerciseLogData);

    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeightTrend = () => {
    if (weightLogs.length < 2) return { trend: 'neutral', change: 0 };
    
    const recent = weightLogs[weightLogs.length - 1];
    const previous = weightLogs[weightLogs.length - 2];
    const change = recent.weight - previous.weight;
    
    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      change: Math.abs(change)
    };
  };

  const getAverageNutrition = () => {
    if (nutritionData.length === 0) return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    
    return nutritionData.reduce((acc, day) => ({
      calories: acc.calories + day.calories / nutritionData.length,
      protein: acc.protein + day.protein / nutritionData.length,
      fat: acc.fat + day.fat / nutritionData.length,
      carbs: acc.carbs + day.carbs / nutritionData.length
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
  };

  const getAverageExercisesPerDay = () => {
    if (exerciseData.length === 0) return 0;
    
    const totalExercises = exerciseData.reduce((acc, day) => acc + day.exercise_count, 0);
    
    return (totalExercises / exerciseData.length).toFixed(1);
  };

  const weightTrend = getWeightTrend();
  const avgNutrition = getAverageNutrition();
  const avgExercises = getAverageExercisesPerDay();
  const latestWeight = weightLogs[weightLogs.length - 1];

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80">Loading progress data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Progress Dashboard</h3>
        <p className="text-white/70">Track your fitness journey</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white/70 flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Latest Weight
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {latestWeight ? `${latestWeight.weight} lbs` : 'No data'}
            </div>
            {weightTrend.change > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`w-4 h-4 ${weightTrend.trend === 'up' ? 'text-red-400' : 'text-green-400'}`} />
                <span className={`text-sm ${weightTrend.trend === 'up' ? 'text-red-400' : 'text-green-400'}`}>
                  {weightTrend.trend === 'up' ? '+' : '-'}{weightTrend.change.toFixed(1)} lbs
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white/70 flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Avg Daily Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Math.round(avgNutrition.calories)}
            </div>
            <div className="text-sm text-white/70">Last 7 days</div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-white/70 flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Avg Exercises/Day
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgExercises}</div>
            <div className="text-sm text-white/70">Last 7 days</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/10">
          <TabsTrigger value="weight" className="data-[state=active]:bg-white/20">Weight</TabsTrigger>
          <TabsTrigger value="nutrition" className="data-[state=active]:bg-white/20">Nutrition</TabsTrigger>
          <TabsTrigger value="workouts" className="data-[state=active]:bg-white/20">Workouts</TabsTrigger>
          <TabsTrigger value="ai-insights" className="data-[state=active]:bg-white/20 flex items-center gap-1">
            <Brain className="w-3 h-3" />
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="weight" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Weight Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {weightLogs.length > 0 ? (
                <div className="space-y-2">
                  {weightLogs.slice(-10).reverse().map((log, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-white/10 last:border-b-0">
                      <span className="text-white/70">{format(parseISO(log.date), 'MMM d, yyyy')}</span>
                      <span className="text-white font-medium">{log.weight} lbs</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/70 text-center py-4">No weight logs yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Weekly Nutrition Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-xl font-bold text-white">{Math.round(avgNutrition.calories)}</div>
                  <div className="text-sm text-white/70">Calories</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-xl font-bold text-white">{Math.round(avgNutrition.protein)}g</div>
                  <div className="text-sm text-white/70">Protein</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-xl font-bold text-white">{Math.round(avgNutrition.fat)}g</div>
                  <div className="text-sm text-white/70">Fat</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-lg">
                  <div className="text-xl font-bold text-white">{Math.round(avgNutrition.carbs)}g</div>
                  <div className="text-sm text-white/70">Carbs</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Daily Workout Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exerciseData.slice(-7).reverse().map((day, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-white/70">{format(parseISO(day.date), 'MMM d')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{day.exercise_count} exercise{day.exercise_count !== 1 ? 's' : ''}</span>
                      <Badge 
                        variant={day.exercise_count > 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {day.total_calories} cal
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Weekly Analysis
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadWeeklyAnalysis}
                  disabled={analysisLoading}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {analysisLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
                  <p className="text-white/70">Analyzing your progress...</p>
                </div>
              ) : analysisResult?.analysis ? (
                <div className="prose prose-invert max-w-none">
                  <div className="text-white/90 whitespace-pre-wrap leading-relaxed">
                    {analysisResult.analysis}
                  </div>
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-sm text-white/60">
                      Analysis updated: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ) : analysisResult?.message ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-white/40" />
                  <p className="text-white/70 mb-2">{analysisResult.message}</p>
                  <p className="text-sm text-white/50">
                    Keep logging your progress to unlock AI insights!
                  </p>
                </div>
              ) : analysisResult?.error ? (
                <div className="text-center py-8">
                  <p className="text-red-400 mb-2">⚠️ {analysisResult.error}</p>
                  <p className="text-sm text-white/50">
                    Make sure you have an OpenAI API key configured.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto mb-4 text-white/40" />
                  <p className="text-white/70">Loading analysis...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}