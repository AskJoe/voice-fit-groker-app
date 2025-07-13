-- Create table for exercise MET values from Compendium of Physical Activities
CREATE TABLE public.exercise_database (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_name TEXT NOT NULL,
  category TEXT NOT NULL,
  met_value DECIMAL(3,1) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_exercise_database_name ON public.exercise_database(exercise_name);
CREATE INDEX idx_exercise_database_category ON public.exercise_database(category);

-- Insert common exercises with their MET values
INSERT INTO public.exercise_database (exercise_name, category, met_value, description) VALUES
-- Walking/Running
('walking', 'cardio', 3.5, 'Walking, 3.5 mph, level, moderate pace'),
('walking fast', 'cardio', 4.3, 'Walking, 4.0 mph, level, fast pace'),
('jogging', 'cardio', 7.0, 'Jogging, general'),
('running', 'cardio', 8.0, 'Running, 6 mph (10 min/mile)'),
('running fast', 'cardio', 11.5, 'Running, 8 mph (7.5 min/mile)'),

-- Cycling
('cycling', 'cardio', 6.8, 'Bicycling, 12-13.9 mph, leisure, moderate effort'),
('cycling fast', 'cardio', 10.0, 'Bicycling, 16-19 mph, racing/not drafting'),
('stationary bike', 'cardio', 6.8, 'Bicycling, stationary, general'),

-- Swimming
('swimming', 'cardio', 6.0, 'Swimming, leisure, not lap swimming, general'),
('swimming laps', 'cardio', 8.3, 'Swimming, crawl, medium speed'),

-- Strength Training
('weight lifting', 'strength', 3.5, 'Weight lifting, free weight, nautilus or universal-type'),
('bodyweight exercises', 'strength', 3.8, 'Calisthenics, vigorous effort'),
('push ups', 'strength', 3.8, 'Calisthenics, push-ups, vigorous effort'),
('sit ups', 'strength', 3.8, 'Calisthenics, sit-ups, vigorous effort'),
('pull ups', 'strength', 3.8, 'Calisthenics, pull-ups, vigorous effort'),

-- Popular Gym Exercises
('bench press', 'strength', 3.5, 'Weight lifting, free weights'),
('squats', 'strength', 5.0, 'Weight lifting, squats'),
('deadlifts', 'strength', 6.0, 'Weight lifting, deadlifts'),
('lunges', 'strength', 4.0, 'Calisthenics, lunges'),
('planks', 'strength', 3.8, 'Calisthenics, core exercises'),

-- Sports
('basketball', 'sports', 6.5, 'Basketball, shooting baskets'),
('tennis', 'sports', 7.3, 'Tennis, general'),
('soccer', 'sports', 7.0, 'Soccer, general'),
('volleyball', 'sports', 4.0, 'Volleyball, non-competitive'),

-- Other Popular Activities
('yoga', 'flexibility', 2.5, 'Yoga, general'),
('pilates', 'flexibility', 3.0, 'Pilates, general'),
('dancing', 'cardio', 4.8, 'Dancing, general'),
('hiking', 'cardio', 6.0, 'Hiking, cross country'),
('stairs', 'cardio', 8.8, 'Stair climbing, general'),
('rowing', 'cardio', 7.0, 'Rowing, stationary ergometer, general'),
('elliptical', 'cardio', 5.0, 'Elliptical trainer, general');

-- Enable RLS (though this table will be publicly readable)
ALTER TABLE public.exercise_database ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Exercise database is publicly readable" 
ON public.exercise_database 
FOR SELECT 
USING (true);