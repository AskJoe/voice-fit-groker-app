import { supabase } from '@/integrations/supabase/client';

export interface ParsedFood {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  items: string[];
}

export interface ParsedExercise {
  name: string;
  sets: number;
  rep_range: string;
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