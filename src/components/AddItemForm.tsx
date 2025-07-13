import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Brain } from 'lucide-react';
import { parseInputToJson, ParsedFood, ParsedExercise } from '@/utils/parseWithAI';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AddItemFormProps {
  type: 'food' | 'exercise';
  userId: string;
  selectedDate: Date;
  onItemAdded: () => void;
}

export function AddItemForm({ type, userId, selectedDate, onItemAdded }: AddItemFormProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedFood | ParsedExercise | null>(null);
  const { toast } = useToast();

  const handleParse = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const result = await parseInputToJson(text, type);
      
      if (result.success && result.data) {
        setPreview(result.data);
      } else {
        toast({
          title: 'Parsing failed',
          description: result.error || 'Could not understand the input. Please try rephrasing.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to parse input. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!preview) return;

    setLoading(true);
    try {
      if (type === 'food') {
        const foodData = preview as ParsedFood;
        
        // Add to food table
        const { error } = await supabase
          .from('food')
          .insert({
            user_id: userId,
            meal: foodData.items.join(', '),
            calories: foodData.calories,
            protein: foodData.protein,
            date: selectedDate.toISOString(),
          });

        if (error) throw error;

        toast({
          title: 'Food added successfully',
          description: `Added ${foodData.items.join(', ')} to your meal plan`,
        });
      } else {
        const exerciseData = preview as ParsedExercise;
        
        // Add to exercises table
        const { error } = await supabase
          .from('exercises')
          .insert({
            user_id: userId,
            exercise_name: exerciseData.exercise_name,
            exercise_type: exerciseData.exercise_type,
            sets: exerciseData.sets,
            reps: exerciseData.reps,
            weight: exerciseData.weight,
            duration_minutes: exerciseData.duration_minutes,
            distance: exerciseData.distance,
            calories_burned: exerciseData.calories_burned,
            date: selectedDate.toISOString(),
          });

        if (error) throw error;

        toast({
          title: 'Exercise added successfully',
          description: `Added ${exerciseData.exercise_name} to your workout log`,
        });
      }

      // Reset form
      setText('');
      setPreview(null);
      onItemAdded();

    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: 'Failed to add item',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    if (!preview) return null;

    if (type === 'food') {
      const food = preview as ParsedFood;
      return (
        <div className="space-y-2">
          <div className="font-medium">{food.items.join(', ')}</div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{food.calories} cal</Badge>
            <Badge variant="secondary">{food.protein}g protein</Badge>
            <Badge variant="secondary">{food.fat}g fat</Badge>
            <Badge variant="secondary">{food.carbs}g carbs</Badge>
          </div>
        </div>
      );
    } else {
      const exercise = preview as ParsedExercise;
      return (
        <div className="space-y-2">
          <div className="font-medium capitalize">{exercise.exercise_name}</div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{exercise.exercise_type}</Badge>
            {exercise.exercise_type === 'strength' && (
              <>
                {exercise.sets && <Badge variant="secondary">{exercise.sets} sets</Badge>}
                {exercise.reps && <Badge variant="secondary">{exercise.reps} reps</Badge>}
                {exercise.weight && <Badge variant="secondary">{exercise.weight} lbs</Badge>}
              </>
            )}
            {exercise.exercise_type === 'cardio' && (
              <>
                {exercise.duration_minutes && <Badge variant="secondary">{exercise.duration_minutes} min</Badge>}
                {exercise.distance && <Badge variant="secondary">{exercise.distance} mi</Badge>}
              </>
            )}
            {exercise.calories_burned && <Badge variant="secondary">{exercise.calories_burned} cal</Badge>}
          </div>
        </div>
      );
    }
  };

  const placeholderText = type === 'food' 
    ? 'E.g., "Grilled chicken breast with rice, about 500 calories and 40g protein"'
    : 'E.g., "Bench press 4 sets of 8-10 reps" or "20 minute run"';

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Add {type === 'food' ? 'Food' : 'Exercise'} with AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholderText}
          className="min-h-[80px]"
          disabled={loading}
        />
        
        {preview && (
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              {renderPreview()}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          {!preview ? (
            <Button 
              onClick={handleParse}
              disabled={loading || !text.trim()}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              Parse with AI
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleAdd}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add to Plan
              </Button>
              <Button 
                variant="outline"
                onClick={() => setPreview(null)}
                disabled={loading}
              >
                Edit
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}