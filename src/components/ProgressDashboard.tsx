import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Scale, Utensils, Dumbbell, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { format, subDays, parseISO } from 'date-fns';

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

interface WorkoutData {
  date: string;
  workouts_completed: number;
  total_workouts: number;
}

export function ProgressDashboard({ user }: ProgressDashboardProps) {
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [nutritionData, setNutritionData] = useState<NutritionData[]>([]);
  const [workoutData, setWorkoutData] = useState<WorkoutData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

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

      // Load actual workout completion data from daily_logs
      const workoutCompletionData: WorkoutData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(endDate, i), 'yyyy-MM-dd');
        
        // Get workout plan for this day
        const dayOfWeek = format(subDays(endDate, i), 'EEEE');
        const { data: workoutPlan } = await supabase
          .from('workout_plans')
          .select('id, exercises')
          .eq('user_id', user.id)
          .eq('day', dayOfWeek)
          .single();

        let workouts_completed = 0;
        let total_workouts = 0;

        if (workoutPlan && workoutPlan.exercises) {
          const exercises = workoutPlan.exercises as any[];
          total_workouts = exercises.length;

          // Check completion for each exercise
          for (let index = 0; index < exercises.length; index++) {
            const exercise = exercises[index];
            // Use the same ID generation logic as in DayDetailView
            const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
            const name = `${workoutPlan.id}-${exercise.name}-${index}`;
            
            let hash = 0;
            for (let j = 0; j < name.length; j++) {
              hash = ((hash << 5) - hash + name.charCodeAt(j)) & 0xffffffff;
            }
            const hex = Math.abs(hash).toString(16).padStart(8, '0');
            const exerciseId = `${hex.slice(0,8)}-${hex.slice(0,4)}-4${hex.slice(1,4)}-8${hex.slice(4,7)}-${hex}${hex.slice(0,4)}`;

            const { data: log } = await supabase
              .from('daily_logs')
              .select('completed')
              .eq('user_id', user.id)
              .eq('date', date)
              .eq('item_id', exerciseId)
              .eq('item_type', 'exercise')
              .single();

            if (log?.completed) {
              workouts_completed++;
            }
          }
        }

        workoutCompletionData.push({
          date,
          workouts_completed,
          total_workouts
        });
      }
      
      setWorkoutData(workoutCompletionData);

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

  const getWorkoutCompletionRate = () => {
    if (workoutData.length === 0) return 0;
    
    const totalCompleted = workoutData.reduce((acc, day) => acc + day.workouts_completed, 0);
    const totalWorkouts = workoutData.reduce((acc, day) => acc + day.total_workouts, 0);
    
    return Math.round((totalCompleted / totalWorkouts) * 100);
  };

  const weightTrend = getWeightTrend();
  const avgNutrition = getAverageNutrition();
  const workoutRate = getWorkoutCompletionRate();
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
              Workout Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{workoutRate}%</div>
            <div className="text-sm text-white/70">Completion rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="weight" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/10">
          <TabsTrigger value="weight" className="data-[state=active]:bg-white/20">Weight</TabsTrigger>
          <TabsTrigger value="nutrition" className="data-[state=active]:bg-white/20">Nutrition</TabsTrigger>
          <TabsTrigger value="workouts" className="data-[state=active]:bg-white/20">Workouts</TabsTrigger>
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
              <CardTitle className="text-white">Workout Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workoutData.slice(-7).reverse().map((day, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-white/70">{format(parseISO(day.date), 'MMM d')}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">{day.workouts_completed}/{day.total_workouts}</span>
                      <Badge 
                        variant={day.workouts_completed === day.total_workouts ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {Math.round((day.workouts_completed / day.total_workouts) * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}