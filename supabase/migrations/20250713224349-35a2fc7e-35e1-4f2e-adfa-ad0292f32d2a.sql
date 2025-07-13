-- Fix meal plans data with text ranges instead of numbers
UPDATE meal_plans 
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(details, '{calories}', '450'),
      '{protein}', '25'
    ),
    '{fat}', '15'
  ),
  '{carbs}', '45'
)
WHERE meal_type = 'Breakfast' AND (details->>'calories' LIKE '%-%' OR details->>'calories' = '400-500');

UPDATE meal_plans 
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(details, '{calories}', '600'),
      '{protein}', '35'
    ),
    '{fat}', '20'
  ),
  '{carbs}', '65'
)
WHERE meal_type = 'Lunch' AND (details->>'calories' LIKE '%-%' OR details->>'calories' = '500-700');

UPDATE meal_plans 
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(details, '{calories}', '550'),
      '{protein}', '30'
    ),
    '{fat}', '18'
  ),
  '{carbs}', '50'
)
WHERE meal_type = 'Dinner' AND (details->>'calories' LIKE '%-%' OR details->>'calories' = '400-600');

UPDATE meal_plans 
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(details, '{calories}', '250'),
      '{protein}', '12'
    ),
    '{fat}', '8'
  ),
  '{carbs}', '30'
)
WHERE meal_type = 'Snack' AND (details->>'calories' LIKE '%-%' OR details->>'calories' = '200-300');