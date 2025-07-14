import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import { Utensils, Dumbbell, Edit3, Save, X, Brain } from 'lucide-react';
import { format } from 'date-fns';
import { AddItemForm } from './AddItemForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

interface DayDetailViewProps {
  selectedDate: Date;
  mealPlans: MealPlan[];
  workoutPlan?: WorkoutPlan;
  dailyLogs: DailyLog[];
  userId: string;
  foodEntries: Array<{
    id: string;
    meal: string;
    calories: number | null;
    protein: number | null;
  }>;
  exerciseEntries: Array<{
    id: string;
    exercise_name: string;
    exercise_type: 'cardio' | 'strength';
    sets?: number | null;
    reps?: number | null;
    weight?: number | null;
    duration_minutes?: number | null;
    distance?: number | null;
    calories_burned?: number | null;
  }>;
  onToggleComplete: (itemId: string, itemType: 'meal' | 'exercise', completed: boolean) => void;
  onUpdateDetails: (itemId: string, itemType: 'meal' | 'exercise', details: any) => void;
  onRefresh: () => void;
}

export function DayDetailView({ 
  selectedDate, 
  mealPlans, 
  workoutPlan, 
  dailyLogs, 
  userId,
  foodEntries,
  exerciseEntries,
  onToggleComplete, 
  onUpdateDetails,
  onRefresh
}: DayDetailViewProps) {
  const [editingItem, setEditingItem] = useState<{ id: string; type: 'meal' | 'exercise' } | null>(null);
  const [editData, setEditData] = useState<any>({});
  const { toast } = useToast();

  const getLogForItem = (itemId: string, itemType: 'meal' | 'exercise') => {
    return dailyLogs.find(log => log.item_id === itemId && log.item_type === itemType);
  };

  const handleEditStart = (item: any, type: 'meal' | 'exercise') => {
    setEditingItem({ id: item.id, type });
    const log = getLogForItem(item.id, type);
    setEditData(log?.modified_details || (type === 'meal' ? item.details : item));
  };

  const handleEditSave = () => {
    if (editingItem) {
      onUpdateDetails(editingItem.id, editingItem.type, editData);
      setEditingItem(null);
      setEditData({});
    }
  };

  const handleEditCancel = () => {
    setEditingItem(null);
    setEditData({});
  };

  const handleDeleteFood = async (foodId: string) => {
    try {
      const { error } = await supabase
        .from('food')
        .delete()
        .eq('id', foodId);

      if (error) throw error;

      toast({
        title: "Food deleted",
        description: "Food item has been removed from your log.",
      });

      onRefresh(); // Refresh the data to update the UI
    } catch (error) {
      console.error('Error deleting food:', error);
      toast({
        title: "Error",
        description: "Failed to delete food item. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;

      toast({
        title: "Exercise deleted",
        description: "Exercise has been removed from your log.",
      });

      onRefresh(); // Refresh the data to update the UI
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getDailyNutritionTotals = () => {
    // Helper function to safely parse numeric values, handling text ranges
    const parseNumeric = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // If it's a range like "400-500", take the average
        if (value.includes('-')) {
          const parts = value.split('-').map(p => parseFloat(p.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return (parts[0] + parts[1]) / 2;
          }
        }
        // Otherwise try to parse as number
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };

    console.log('Meal plans for calculation:', mealPlans);
    const potential = mealPlans.reduce((totals, meal) => {
      const log = getLogForItem(meal.id, 'meal');
      const details = log?.modified_details || meal.details;
      console.log(`Processing meal ${meal.meal_type}:`, details);
      console.log(`Adding calories: ${parseNumeric(details.calories)}`);
      return {
        calories: totals.calories + parseNumeric(details.calories),
        protein: totals.protein + parseNumeric(details.protein),
        fat: totals.fat + parseNumeric(details.fat),
        carbs: totals.carbs + parseNumeric(details.carbs)
      };
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
    console.log('Final potential totals:', potential);

    const actual = mealPlans.reduce((totals, meal) => {
      const log = getLogForItem(meal.id, 'meal');
      // Only count calories if the meal is marked as completed
      if (log?.completed) {
        const details = log?.modified_details || meal.details;
        return {
          calories: totals.calories + parseNumeric(details.calories),
          protein: totals.protein + parseNumeric(details.protein),
          fat: totals.fat + parseNumeric(details.fat),
          carbs: totals.carbs + parseNumeric(details.carbs)
        };
      }
      return totals;
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });

    // Add AI-added food entries to actual totals
    const foodTotals = foodEntries.reduce((totals, food) => ({
      calories: totals.calories + parseNumeric(food.calories),
      protein: totals.protein + parseNumeric(food.protein),
      fat: totals.fat + 0, // food table doesn't have fat/carbs yet
      carbs: totals.carbs + 0
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

    return { 
      potential, 
      actual: {
        calories: Math.round(actual.calories + foodTotals.calories),
        protein: Math.round(actual.protein + foodTotals.protein),
        fat: Math.round(actual.fat + foodTotals.fat),
        carbs: Math.round(actual.carbs + foodTotals.carbs)
      }
    };
  };

  const nutritionTotals = getDailyNutritionTotals();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
      </div>

      {/* Daily Nutrition Summary */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="text-center text-white">Daily Nutrition Progress</CardTitle>
          <p className="text-center text-white/70 text-sm">Actual vs Target</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">
                {nutritionTotals.actual.calories}
                <span className="text-white/50 text-lg">/{nutritionTotals.potential.calories}</span>
              </div>
              <div className="text-sm text-white/70">Calories</div>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-white h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((nutritionTotals.actual.calories / nutritionTotals.potential.calories) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">
                {nutritionTotals.actual.protein}
                <span className="text-white/50 text-lg">/{nutritionTotals.potential.protein}</span>g
              </div>
              <div className="text-sm text-white/70">Protein</div>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-white h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((nutritionTotals.actual.protein / nutritionTotals.potential.protein) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">
                {nutritionTotals.actual.fat}
                <span className="text-white/50 text-lg">/{nutritionTotals.potential.fat}</span>g
              </div>
              <div className="text-sm text-white/70">Fat</div>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-white h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((nutritionTotals.actual.fat / nutritionTotals.potential.fat) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-white">
                {nutritionTotals.actual.carbs}
                <span className="text-white/50 text-lg">/{nutritionTotals.potential.carbs}</span>g
              </div>
              <div className="text-sm text-white/70">Carbs</div>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-white h-1.5 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min((nutritionTotals.actual.carbs / nutritionTotals.potential.carbs) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meals Section */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Utensils className="h-5 w-5" />
            Meals for Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mealPlans.map((meal) => {
            const log = getLogForItem(meal.id, 'meal');
            const isCompleted = log?.completed || false;
            const displayDetails = log?.modified_details || meal.details;
            const isEditing = editingItem?.id === meal.id && editingItem?.type === 'meal';
            
            return (
              <div key={meal.id} className="border border-white/20 rounded-lg p-4 bg-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={(checked) => 
                        onToggleComplete(meal.id, 'meal', checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div>
                      <h4 className="font-medium text-white">{meal.meal_type}</h4>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {displayDetails.calories} kcal
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {displayDetails.protein}g protein
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {displayDetails.fat}g fat
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {displayDetails.carbs}g carbs
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-white/70 hover:text-white"
                        onClick={() => handleEditStart(meal, 'meal')}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit {meal.meal_type}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Calories</label>
                          <Input
                            type="number"
                            value={editData.calories || displayDetails.calories}
                            onChange={(e) => setEditData({
                              ...editData,
                              calories: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Protein (g)</label>
                          <Input
                            type="number"
                            value={editData.protein || displayDetails.protein}
                            onChange={(e) => setEditData({
                              ...editData,
                              protein: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Fat (g)</label>
                          <Input
                            type="number"
                            value={editData.fat || displayDetails.fat}
                            onChange={(e) => setEditData({
                              ...editData,
                              fat: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Carbs (g)</label>
                          <Input
                            type="number"
                            value={editData.carbs || displayDetails.carbs}
                            onChange={(e) => setEditData({
                              ...editData,
                              carbs: parseInt(e.target.value) || 0
                            })}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Items (one per line)</label>
                          <Textarea
                            value={(editData.items || displayDetails.items || []).join('\n')}
                            onChange={(e) => setEditData({
                              ...editData,
                              items: e.target.value.split('\n').filter(item => item.trim())
                            })}
                            rows={4}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={handleEditCancel}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button onClick={handleEditSave}>
                          <Save className="h-4 w-4 mr-1" />
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                
                <ul className="space-y-1 ml-8">
                  {(displayDetails.items || []).map((item: string, index: number) => (
                    <li key={index} className="text-sm text-white/80 flex items-center gap-2">
                      <span className="w-1 h-1 bg-white/60 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          
          {/* AI-Added Food Items */}
          {foodEntries.length > 0 && (
            <div className="border-t border-white/10 pt-4 mt-4">
              <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
                <span>🤖</span>
                AI-Added Foods
              </h4>
              {foodEntries.map((food) => (
                <div key={food.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 mb-2">
                  <div className="flex-1">
                    <span className="text-white font-medium">{food.meal}</span>
                    <div className="text-xs text-white/60 mt-1">
                      {food.calories ? `${food.calories} cal` : ''} 
                      {food.calories && food.protein ? ' • ' : ''}
                      {food.protein ? `${food.protein}g protein` : ''}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteFood(food.id)}
                    className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-red-500/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Food with AI Form */}
          <div className="border border-white/20 rounded-lg p-4 bg-white/5 border-dashed">
            <AddItemForm 
              type="food"
              userId={userId}
              selectedDate={selectedDate}
              onItemAdded={onRefresh}
            />
          </div>
        </CardContent>
      </Card>

      {/* Workout Section */}
      {workoutPlan && workoutPlan.exercises && workoutPlan.exercises.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Dumbbell className="h-5 w-5" />
              Workout for Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(workoutPlan.exercises || []).map((exercise, index) => {
              // Generate a deterministic UUID v5 based on workout plan ID and exercise index
              // This ensures consistent UUIDs for the same exercise
              const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Standard namespace UUID
              const name = `${workoutPlan.id}-${exercise.name}-${index}`;
              
              // Simple deterministic UUID generation
              let hash = 0;
              for (let i = 0; i < name.length; i++) {
                hash = ((hash << 5) - hash + name.charCodeAt(i)) & 0xffffffff;
              }
              const hex = Math.abs(hash).toString(16).padStart(8, '0');
              const exerciseId = `${hex.slice(0,8)}-${hex.slice(0,4)}-4${hex.slice(1,4)}-8${hex.slice(4,7)}-${hex}${hex.slice(0,4)}`;
              
              const log = getLogForItem(exerciseId, 'exercise');
              const isCompleted = log?.completed || false;
              const displayDetails = log?.modified_details || exercise;
              
              return (
                <div key={index} className="border border-white/20 rounded-lg p-4 bg-white/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={(checked) => 
                          onToggleComplete(exerciseId, 'exercise', checked as boolean)
                        }
                        className="mt-1"
                      />
                      <div>
                        <h4 className="font-medium text-white">{displayDetails.name}</h4>
                        <p className="text-sm text-white/70">
                          {displayDetails.sets} sets × {displayDetails.rep_range} reps
                        </p>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-white/70 hover:text-white"
                          onClick={() => handleEditStart(exercise, 'exercise')}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Exercise</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Exercise Name</label>
                            <Input
                              value={editData.name || displayDetails.name}
                              onChange={(e) => setEditData({
                                ...editData,
                                name: e.target.value
                              })}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Sets</label>
                            <Input
                              type="number"
                              value={editData.sets || displayDetails.sets}
                              onChange={(e) => setEditData({
                                ...editData,
                                sets: parseInt(e.target.value) || 0
                              })}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Rep Range</label>
                            <Input
                              value={editData.rep_range || displayDetails.rep_range}
                              onChange={(e) => setEditData({
                                ...editData,
                                rep_range: e.target.value
                              })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={handleEditCancel}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                          <Button onClick={handleEditSave}>
                            <Save className="h-4 w-4 mr-1" />
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* AI-Added Exercise Items */}
      {exerciseEntries.length > 0 && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <span>🏋️</span>
              Today's Logged Exercises
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {exerciseEntries.map((exercise) => (
              <div key={exercise.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium capitalize">{exercise.exercise_name}</span>
                    <Badge 
                      variant={exercise.exercise_type === 'cardio' ? 'default' : 'secondary'} 
                      className="text-xs"
                    >
                      {exercise.exercise_type}
                    </Badge>
                  </div>
                  <div className="flex gap-2 text-xs text-white/60 flex-wrap">
                    {exercise.exercise_type === 'strength' && (
                      <>
                        {exercise.sets && <span>{exercise.sets} sets</span>}
                        {exercise.reps && <span>{exercise.reps} reps</span>}
                        {exercise.weight && <span>{exercise.weight} lbs</span>}
                      </>
                    )}
                    {exercise.exercise_type === 'cardio' && (
                      <>
                        {exercise.duration_minutes && <span>{exercise.duration_minutes} min</span>}
                        {exercise.distance && <span>{exercise.distance} mi</span>}
                      </>
                    )}
                    {exercise.calories_burned && <span>{exercise.calories_burned} cal burned</span>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteExercise(exercise.id)}
                  className="h-8 w-8 p-0 text-white/60 hover:text-white hover:bg-red-500/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {/* Show total calories burned */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-center text-white">
                <span className="text-lg font-semibold">
                  {exerciseEntries.reduce((total, exercise) => total + (exercise.calories_burned || 0), 0)}
                </span>
                <span className="text-white/60 text-sm ml-1">total calories burned</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Exercise Input */}
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Dumbbell className="h-5 w-5" />
            Add Exercise with AI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddItemForm
            type="exercise"
            userId={userId}
            selectedDate={selectedDate}
            onItemAdded={onRefresh}
          />
        </CardContent>
      </Card>

      {workoutPlan && (!workoutPlan.exercises || workoutPlan.exercises.length === 0) && (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20">
          <CardContent className="text-center py-8">
            <Dumbbell className="h-12 w-12 mx-auto text-white/50 mb-4" />
            <p className="text-white/70">Rest day - enjoy your recovery!</p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}