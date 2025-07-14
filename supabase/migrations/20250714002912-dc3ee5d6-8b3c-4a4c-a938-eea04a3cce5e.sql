-- Remove duplicate and extra meal plans, keeping only the standard 4 meal types
DELETE FROM public.meal_plans 
WHERE meal_type NOT IN ('breakfast', 'lunch', 'dinner', 'snack')
   OR meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack');

-- For users who might have multiple entries for the same meal type, keep only one per meal type
DELETE FROM public.meal_plans a
USING public.meal_plans b
WHERE a.id > b.id 
  AND a.user_id = b.user_id 
  AND a.meal_type = b.meal_type;