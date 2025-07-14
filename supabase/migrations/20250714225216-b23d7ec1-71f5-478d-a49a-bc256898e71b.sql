-- Add missing fat and carbs columns to the food table
ALTER TABLE public.food 
ADD COLUMN fat integer,
ADD COLUMN carbs integer;