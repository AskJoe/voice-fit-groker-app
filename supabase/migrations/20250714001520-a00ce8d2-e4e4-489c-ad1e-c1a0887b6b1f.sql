-- Update existing meal plans to more reasonable calorie targets
UPDATE meal_plans 
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(details, '{calories}', '450'),
      '{protein}', '25'
    ),
    '{fat}', '15'
  ),
  '{carbs}', '35'
)
WHERE meal_type = 'Breakfast';

UPDATE meal_plans 
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(details, '{calories}', '500'),
      '{protein}', '40'
    ),
    '{fat}', '12'
  ),
  '{carbs}', '45'
)
WHERE meal_type = 'Lunch';

UPDATE meal_plans 
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(details, '{calories}', '550'),
      '{protein}', '45'
    ),
    '{fat}', '18'
  ),
  '{carbs}', '40'
)
WHERE meal_type = 'Dinner';

UPDATE meal_plans 
SET details = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(details, '{calories}', '300'),
      '{protein}', '15'
    ),
    '{fat}', '12'
  ),
  '{carbs}', '20'
)
WHERE meal_type = 'Snack';

-- Update meal plan items as well
UPDATE meal_plans 
SET details = jsonb_set(details, '{items}', '["2 large eggs", "1 slice whole grain toast", "1/2 cup oatmeal"]')
WHERE meal_type = 'Breakfast';

UPDATE meal_plans 
SET details = jsonb_set(details, '{items}', '["4 oz grilled chicken breast", "1 cup brown rice", "Mixed vegetables"]')
WHERE meal_type = 'Lunch';

UPDATE meal_plans 
SET details = jsonb_set(details, '{items}', '["5 oz lean protein", "1 medium sweet potato", "Green salad"]')
WHERE meal_type = 'Dinner';

UPDATE meal_plans 
SET details = jsonb_set(details, '{items}', '["Greek yogurt", "Mixed nuts (1 oz)"]')
WHERE meal_type = 'Snack';