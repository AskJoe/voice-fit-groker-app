import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronLeft, ChevronRight, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { DayDetailView } from '@/components/DayDetailView';
import { WeightEntry } from '@/components/WeightEntry';
import { ProgressDashboard } from '@/components/ProgressDashboard';
import { addWeeks, subWeeks, format } from 'date-fns';

interface MealPlan {
  id: string;
  meal_type: string;
  details: {
    items: string[];
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

interface WorkoutPlan {
  id: string;
  day: string;
  exercises: Array<{
    name: string;
    sets: number;
    rep_range: string;
  }>;
}

interface DailyLog {
  id: string;
  item_id: string;
  item_type: 'meal' | 'exercise';
  completed: boolean;
  modified_details?: any;
  date: string;
}

interface FitnessTrackerProps {
  user: User;
  onSignOut: () => void;
}

export function FitnessTracker({ user, onSignOut }: FitnessTrackerProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [foodEntries, setFoodEntries] = useState<Array<{
    id: string;
    meal: string;
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  }>>([]);
  const [exerciseEntries, setExerciseEntries] = useState<Array<{
    id: string;
    exercise_name: string;
    exercise_type: 'cardio' | 'strength';
    sets?: number | null;
    reps?: number | null;
    weight?: number | null;
    duration_minutes?: number | null;
    distance?: number | null;
    calories_burned?: number | null;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeView, setActiveView] = useState<'calendar' | 'dashboard'>('calendar');
  const { toast } = useToast();

  useEffect(() => {
    if (user?.id) {
      initializePlans();
    }
  }, [user?.id]);

  useEffect(() => {
    if (user && mealPlans.length > 0) {
      refreshData();
    }
  }, [user, selectedDate, mealPlans]);

  async function initializePlans() {
    try {
      setLoading(true);
      
      // Check if meal plans exist
      const { data: existingMeals, count } = await supabase
        .from('meal_plans')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      
      if (!existingMeals || count === 0) {
        // Insert default meals
        const defaultMeals = [
          { 
            meal_type: 'Breakfast', 
            details: { 
              items: ['2 large eggs', '1 slice whole grain toast', '1/2 cup oatmeal'], 
              calories: 450, 
              protein: 25,
              fat: 15,
              carbs: 35
            } 
          },
          { 
            meal_type: 'Lunch', 
            details: { 
              items: ['4 oz grilled chicken breast', '1 cup brown rice', 'Mixed vegetables'], 
              calories: 500, 
              protein: 40,
              fat: 12,
              carbs: 45
            } 
          },
          { 
            meal_type: 'Dinner', 
            details: { 
              items: ['5 oz lean protein', '1 medium sweet potato', 'Green salad'], 
              calories: 550, 
              protein: 45,
              fat: 18,
              carbs: 40
            } 
          },
          { 
            meal_type: 'Snack', 
            details: { 
              items: ['Greek yogurt', 'Mixed nuts (1 oz)'], 
              calories: 300, 
              protein: 15,
              fat: 12,
              carbs: 20
            } 
          }
        ];
        
        const { data: insertedMeals } = await supabase
          .from('meal_plans')
          .insert(defaultMeals.map(m => ({ ...m, user_id: user.id })))
          .select();
        
        setMealPlans((insertedMeals as unknown as MealPlan[]) || []);
      } else {
        setMealPlans(existingMeals as unknown as MealPlan[]);
      }

      // Check if workout plans exist
      const { data: existingWorkouts } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('user_id', user.id);
      
      if (!existingWorkouts || existingWorkouts.length === 0) {
        // Insert default weekly workouts
        const defaultWorkouts = [
          { 
            day: 'Monday', 
            exercises: [
              { name: 'Bench Press (barbell or dumbbell)', sets: 4, rep_range: '8-12' }, 
              { name: 'Incline Press (dumbbell)', sets: 4, rep_range: '8-12' }, 
              { name: 'Tricep Dips (using bench)', sets: 4, rep_range: '8-12' }
            ] 
          },
          { 
            day: 'Tuesday', 
            exercises: [
              { name: 'Long Swim or Bike Ride', sets: 1, rep_range: '30-60 min (moderate pace)' }
            ] 
          },
          { 
            day: 'Wednesday', 
            exercises: [
              { name: 'Pull-Ups (assisted if needed)', sets: 4, rep_range: '8-12' }, 
              { name: 'Bent-Over Rows (barbell)', sets: 4, rep_range: '8-12' }, 
              { name: 'Bicep Curls (dumbbell)', sets: 4, rep_range: '8-12' }
            ] 
          },
          { 
            day: 'Thursday', 
            exercises: [
              { name: 'Long Run', sets: 1, rep_range: '30-60 min (steady pace)' }
            ] 
          },
          { 
            day: 'Friday', 
            exercises: [
              { name: 'Overhead Press (barbell)', sets: 4, rep_range: '8-12' }, 
              { name: 'Lateral Raises (dumbbell)', sets: 4, rep_range: '8-12' }, 
              { name: 'Squats (barbell)', sets: 4, rep_range: '8-12' }
            ] 
          },
          { 
            day: 'Saturday', 
            exercises: [] 
          },
          { 
            day: 'Sunday', 
            exercises: [
              { name: 'Deadlifts (barbell)', sets: 4, rep_range: '8-12' }, 
              { name: 'Push-Ups', sets: 4, rep_range: '8-12' }
            ] 
          }
        ];
        
        const { data: insertedWorkouts } = await supabase
          .from('workout_plans')
          .insert(defaultWorkouts.map(w => ({ ...w, user_id: user.id })))
          .select();
        
        setWorkoutPlans((insertedWorkouts as unknown as WorkoutPlan[]) || []);
      } else {
        setWorkoutPlans(existingWorkouts as unknown as WorkoutPlan[]);
      }
      
      toast({
        title: "Plans initialized!",
        description: "Your meal and workout plans are ready.",
      });
    } catch (error) {
      console.error('Error initializing plans:', error);
      toast({
        title: "Error",
        description: "Failed to initialize your plans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const loadDailyLogs = async () => {
    try {
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'));
      
      setDailyLogs((logs as DailyLog[]) || []);
    } catch (error) {
      console.error('Error loading daily logs:', error);
    }
  };

  const loadFoodEntries = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('Loading food entries for date:', dateStr);
      
      const { data: food, error } = await supabase
        .from('food')
        .select('*')
        .eq('user_id', user.id)
        .filter('date', 'gte', `${dateStr}T00:00:00`)
        .filter('date', 'lt', `${dateStr}T23:59:59`);
      
      if (error) {
        console.error('Error loading food entries:', error);
        return;
      }
      
      console.log('Food entries loaded:', food);
      setFoodEntries((food as any[]) || []);
    } catch (error) {
      console.error('Error loading food entries:', error);
    }
  };

  const loadExerciseEntries = async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      console.log('Loading exercise entries for date:', dateStr);
      
      const { data: exercises, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)
        .filter('date', 'gte', `${dateStr}T00:00:00`)
        .filter('date', 'lt', `${dateStr}T23:59:59`);
      
      if (error) {
        console.error('Error loading exercise entries:', error);
        return;
      }
      
      console.log('Exercise entries loaded:', exercises);
      setExerciseEntries((exercises as any[]) || []);
    } catch (error) {
      console.error('Error loading exercise entries:', error);
    }
  };

  const refreshData = async () => {
    await Promise.all([loadDailyLogs(), loadFoodEntries(), loadExerciseEntries()]);
  };

  const getWorkoutForDay = (date: Date) => {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    return workoutPlans.find(plan => plan.day === dayName);
  };

  const handleToggleComplete = async (itemId: string, itemType: 'meal' | 'exercise', completed: boolean) => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingLog = dailyLogs.find(log => log.item_id === itemId && log.item_type === itemType);

      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('daily_logs')
          .update({ completed })
          .eq('id', existingLog.id);

        if (error) throw error;

        setDailyLogs(prev => prev.map(log => 
          log.id === existingLog.id ? { ...log, completed } : log
        ));
      } else {
        // Create new log
        const { data, error } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user.id,
            date: dateStr,
            item_type: itemType,
            item_id: itemId,
            completed
          })
          .select()
          .maybeSingle();

        if (error) throw error;

        setDailyLogs(prev => [...prev, data as DailyLog]);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast({
        title: "Error",
        description: "Failed to update completion status.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDetails = async (itemId: string, itemType: 'meal' | 'exercise', details: any) => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const existingLog = dailyLogs.find(log => log.item_id === itemId && log.item_type === itemType);

      if (existingLog) {
        // Update existing log
        const { error } = await supabase
          .from('daily_logs')
          .update({ modified_details: details })
          .eq('id', existingLog.id);

        if (error) throw error;

        setDailyLogs(prev => prev.map(log => 
          log.id === existingLog.id ? { ...log, modified_details: details } : log
        ));
      } else {
        // Create new log with modifications
        const { data, error } = await supabase
          .from('daily_logs')
          .insert({
            user_id: user.id,
            date: dateStr,
            item_type: itemType,
            item_id: itemId,
            completed: false,
            modified_details: details
          })
          .select()
          .maybeSingle();

        if (error) throw error;

        setDailyLogs(prev => [...prev, data as DailyLog]);
      }

      toast({
        title: "Updated!",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error updating details:', error);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
    setSelectedDate(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
    setSelectedDate(prev => addWeeks(prev, 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">FitTracker</h1>
              <p className="text-white/80">Welcome back, {user.email?.split('@')[0]}!</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </Button>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white/80">Setting up your fitness plans...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const workoutForSelectedDay = getWorkoutForDay(selectedDate);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">FitTracker</h1>
            <p className="text-white/80">Welcome back, {user.email?.split('@')[0]}!</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-white/10 rounded-lg p-1">
              <Button
                variant={activeView === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('calendar')}
                className={activeView === 'calendar' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}
              >
                <CalendarIcon className="w-4 h-4 mr-1" />
                Calendar
              </Button>
              <Button
                variant={activeView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveView('dashboard')}
                className={activeView === 'dashboard' ? 'bg-white text-black' : 'text-white hover:bg-white/20'}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Dashboard
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>

        {activeView === 'calendar' ? (
          <>
            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous Week
              </Button>
              
              <div className="flex items-center gap-2">
                {format(selectedDate, 'EEEE') === 'Friday' && (
                  <WeightEntry 
                    user={user} 
                    selectedDate={selectedDate}
                    onWeightSaved={() => {
                      // Could trigger a refresh of dashboard data here
                    }}
                  />
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextWeek}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Next Week
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Weekly Calendar */}
            <div className="mb-8">
              <WeeklyCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                weekStartsOn={0}
              />
            </div>

            {/* Day Detail View */}
            <DayDetailView
              selectedDate={selectedDate}
              mealPlans={mealPlans}
              workoutPlan={workoutForSelectedDay}
              dailyLogs={dailyLogs}
              userId={user.id}
              foodEntries={foodEntries}
              exerciseEntries={exerciseEntries}
              onToggleComplete={handleToggleComplete}
              onUpdateDetails={handleUpdateDetails}
              onRefresh={refreshData}
            />
          </>
        ) : (
          <ProgressDashboard user={user} />
        )}
      </div>
    </div>
  );
}