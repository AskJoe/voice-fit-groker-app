-- Create unified workouts table
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise_name TEXT NOT NULL,
  exercise_type TEXT NOT NULL CHECK (exercise_type IN ('cardio', 'strength')),
  sets INTEGER,
  reps INTEGER,
  weight DOUBLE PRECISION,
  duration_minutes INTEGER,
  distance DOUBLE PRECISION,
  calories_burned INTEGER,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own workouts" 
ON public.workouts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts" 
ON public.workouts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" 
ON public.workouts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" 
ON public.workouts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Migrate existing data from exercises table
INSERT INTO public.workouts (user_id, exercise_name, exercise_type, sets, reps, weight, date, created_at)
SELECT 
  user_id,
  exercise,
  'strength'::text,
  sets,
  reps,
  weight::double precision,
  date,
  created_at
FROM public.exercises;

-- Migrate existing data from cardio table  
INSERT INTO public.workouts (user_id, exercise_name, exercise_type, duration_minutes, distance, date, created_at)
SELECT 
  user_id,
  activity,
  'cardio'::text,
  duration,
  distance,
  date,
  created_at
FROM public.cardio;

-- Drop old tables
DROP TABLE public.exercises;
DROP TABLE public.cardio;