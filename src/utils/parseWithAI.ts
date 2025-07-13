import { supabase } from '@/integrations/supabase/client';

export interface ParsedFood {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  items: string[];
}

export interface ParsedExercise {
  exercise_name: string;
  exercise_type: 'cardio' | 'strength';
  sets?: number;
  reps?: number;
  weight?: number;
  duration_minutes?: number;
  distance?: number;
  calories_burned?: number;
}

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function parseInputToJson(
  inputText: string, 
  type: 'food' | 'exercise'
): Promise<ParseResult<ParsedFood | ParsedExercise>> {
  try {
    const { data, error } = await supabase.functions.invoke('parse-ai', {
      body: { inputText, type }
    });

    if (error) {
      console.error('Error calling parse-ai function:', error);
      return { 
        success: false, 
        error: 'Failed to parse with AI. Please try again.' 
      };
    }

    return data;
  } catch (error) {
    console.error('Error parsing with AI:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}