-- Drop the unified workouts table that was incorrectly used
DROP TABLE IF EXISTS public.workouts;

-- Create exercises table for AI-added exercises (mirroring food table structure)
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  weight DOUBLE PRECISION,
  duration_minutes INTEGER,
  distance DOUBLE PRECISION,
  calories_burned INTEGER,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own exercises" 
ON public.exercises 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercises" 
ON public.exercises 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercises" 
ON public.exercises 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercises" 
ON public.exercises 
FOR DELETE 
USING (auth.uid() = user_id);