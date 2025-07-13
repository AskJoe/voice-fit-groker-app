import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Check, Clock, Target, Users, Utensils, Dumbbell, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface MealPlan {
  id: string;
  meal_type: string;
  details: {
    items: string[];
    calories: number;
    protein: number;
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

interface FitnessTrackerProps {
  user: User;
  onSignOut: () => void;
}

export function FitnessTracker({ user, onSignOut }: FitnessTrackerProps) {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      initializePlans();
    }
  }, [user]);

  async function initializePlans() {
    try {
      setLoading(true);
      
      // Check if meal plans exist
      const { data: existingMeals } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id);
      
      if (!existingMeals || existingMeals.length === 0) {
        // Insert default meals
        const defaultMeals = [
          { 
            meal_type: 'Breakfast', 
            details: { 
              items: ['3 large eggs (scrambled or boiled)', '1 medium bagel (plain)', '1 cup plain Greek yogurt'], 
              calories: 600, 
              protein: 50 
            } 
          },
          { 
            meal_type: 'Lunch', 
            details: { 
              items: ['6 oz grilled chicken breast', '1 cup cooked white rice', '1 oz almonds'], 
              calories: 550, 
              protein: 55 
            } 
          },
          { 
            meal_type: 'Dinner', 
            details: { 
              items: ['8 oz grilled steak (lean cut, e.g., sirloin)', '1 medium sweet potato (baked, ~130g)', '1 oz walnuts'], 
              calories: 650, 
              protein: 60 
            } 
          },
          { 
            meal_type: 'Snack', 
            details: { 
              items: ['2 large eggs (hard-boiled)', '1/2 cup cooked pasta (plain)'], 
              calories: 300, 
              protein: 45 
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

  const getTodayWorkout = () => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[new Date().getDay()];
    return workoutPlans.find(plan => plan.day.toLowerCase() === todayName);
  };

  const getTotalDailyNutrition = () => {
    return mealPlans.reduce((total, meal) => ({
      calories: total.calories + meal.details.calories,
      protein: total.protein + meal.details.protein
    }), { calories: 0, protein: 0 });
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

  const todayWorkout = getTodayWorkout();
  const totalNutrition = getTotalDailyNutrition();

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

        {/* Daily Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
                <Target className="h-4 w-4" />
                Daily Nutrition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1 text-white">{totalNutrition.calories} kcal</div>
              <div className="text-sm text-white/70">{totalNutrition.protein}g protein</div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
                <Calendar className="h-4 w-4" />
                Today's Workout
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todayWorkout && todayWorkout.exercises.length > 0 ? (
                <div>
                  <div className="text-2xl font-bold mb-1 text-white">{todayWorkout.day}</div>
                  <div className="text-sm text-white/70">{todayWorkout.exercises.length} exercises</div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl font-bold mb-1 text-white">Rest Day</div>
                  <div className="text-sm text-white/70">Recovery time</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-white">
                <Clock className="h-4 w-4" />
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1 text-white">6/7</div>
              <div className="text-sm text-white/70">workout days planned</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="meals" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="meals" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary">
              <Utensils className="h-4 w-4" />
              Meal Plans
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary">
              <Dumbbell className="h-4 w-4" />
              Workout Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meals" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {mealPlans.map((meal) => (
                <Card key={meal.id} className="h-full bg-white shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {meal.meal_type}
                      <Badge variant="secondary">
                        {meal.details.calories} kcal
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {meal.details.protein}g protein
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {meal.details.items.map((item, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Check className="h-3 w-3 mt-1 text-primary shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="workouts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {workoutPlans.map((workout) => (
                <Card key={workout.id} className="h-full bg-white shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {workout.day}
                      {workout.exercises.length === 0 ? (
                        <Badge variant="outline">Rest Day</Badge>
                      ) : (
                        <Badge variant="secondary">
                          {workout.exercises.length} exercises
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workout.exercises.length > 0 ? (
                      <div className="space-y-3">
                        {workout.exercises.map((exercise, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="font-medium text-sm mb-1">{exercise.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {exercise.sets} sets × {exercise.rep_range} reps
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2" />
                        <p>Recovery day - take a well-deserved rest!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}