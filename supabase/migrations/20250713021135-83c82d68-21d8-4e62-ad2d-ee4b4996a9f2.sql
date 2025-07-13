-- Create the exercises table
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exercise TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight INTEGER NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the cardio table
CREATE TABLE public.cardio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity TEXT NOT NULL,
  duration INTEGER NOT NULL,
  distance FLOAT,
  pace FLOAT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the food table
CREATE TABLE public.food (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meal TEXT NOT NULL,
  calories INTEGER,
  protein INTEGER,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the weight_logs table
CREATE TABLE public.weight_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  weight FLOAT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create the presets table
CREATE TABLE public.presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('meal', 'exercise')),
  name TEXT NOT NULL,
  details JSONB,
  usage_count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for exercises table
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

-- Create RLS policies for cardio table
CREATE POLICY "Users can view their own cardio" 
ON public.cardio 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cardio" 
ON public.cardio 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cardio" 
ON public.cardio 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cardio" 
ON public.cardio 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for food table
CREATE POLICY "Users can view their own food logs" 
ON public.food 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own food logs" 
ON public.food 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs" 
ON public.food 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs" 
ON public.food 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for weight_logs table
CREATE POLICY "Users can view their own weight logs" 
ON public.weight_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own weight logs" 
ON public.weight_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weight logs" 
ON public.weight_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weight logs" 
ON public.weight_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for presets table
CREATE POLICY "Users can view their own presets" 
ON public.presets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own presets" 
ON public.presets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presets" 
ON public.presets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presets" 
ON public.presets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for presets table
CREATE TRIGGER update_presets_updated_at
  BEFORE UPDATE ON public.presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();