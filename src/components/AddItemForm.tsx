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
        
        // Add to meal_plans table
        const { error } = await supabase
          .from('meal_plans')
          .insert({
            user_id: userId,
            meal_type: 'AI Added',
            details: foodData as any,
          });

        if (error) throw error;

        toast({
          title: 'Food added successfully',
          description: `Added ${foodData.items.join(', ')} to your meal plan`,
        });
      } else {
        const exerciseData = preview as ParsedExercise;
        const dayOfWeek = format(selectedDate, 'EEEE');
        
        // Get existing workout plan for the day
        const { data: existingPlan } = await supabase
          .from('workout_plans')
          .select('exercises')
          .eq('user_id', userId)
          .eq('day', dayOfWeek)
          .single();

        const currentExercises = existingPlan?.exercises as any[] || [];
        const updatedExercises = [...currentExercises, exerciseData];

        // Upsert workout plan
        const { error } = await supabase
          .from('workout_plans')
          .upsert({
            user_id: userId,
            day: dayOfWeek,
            exercises: updatedExercises as any,
          });

        if (error) throw error;

        toast({
          title: 'Exercise added successfully',
          description: `Added ${exerciseData.name} to your ${dayOfWeek} workout`,
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
          <div className="font-medium capitalize">{exercise.name}</div>
          <div className="flex gap-2">
            <Badge variant="secondary">{exercise.sets} sets</Badge>
            <Badge variant="secondary">{exercise.rep_range} reps</Badge>
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