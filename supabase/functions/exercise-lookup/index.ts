import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExerciseLookupRequest {
  exercise_name: string;
  duration_minutes?: number;
  weight_kg?: number; // User's weight in kg
}

interface METExercise {
  exercise_name: string;
  category: string;
  met_value: number;
  description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exercise_name, duration_minutes, weight_kg }: ExerciseLookupRequest = await req.json();
    console.log('Looking up exercise:', exercise_name, 'Duration:', duration_minutes, 'Weight:', weight_kg);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Search for exercise in database (fuzzy matching)
    const { data: exercises, error } = await supabase
      .from('exercise_database')
      .select('*')
      .ilike('exercise_name', `%${exercise_name}%`)
      .limit(1);

    if (error) {
      console.error('Error querying exercise database:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Database query failed' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (exercises && exercises.length > 0) {
      const exercise = exercises[0] as METExercise;
      console.log('Found exercise in database:', exercise);

      let calories_burned = null;
      
      // Calculate calories if we have duration and weight
      // Formula: Calories = METs × weight(kg) × duration(hours)
      if (duration_minutes && weight_kg) {
        const duration_hours = duration_minutes / 60;
        calories_burned = Math.round(exercise.met_value * weight_kg * duration_hours);
        console.log(`Calculated calories: ${exercise.met_value} × ${weight_kg} × ${duration_hours} = ${calories_burned}`);
      }

      return new Response(JSON.stringify({
        success: true,
        found: true,
        exercise: {
          name: exercise.exercise_name,
          category: exercise.category,
          met_value: exercise.met_value,
          description: exercise.description,
          calories_burned,
        },
        source: 'MET_DATABASE'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      console.log('Exercise not found in database:', exercise_name);
      return new Response(JSON.stringify({
        success: true,
        found: false,
        exercise_name,
        source: 'NOT_FOUND'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in exercise-lookup function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});