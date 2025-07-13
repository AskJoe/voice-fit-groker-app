-- Update existing meal plans to include fat and carbs values
UPDATE meal_plans 
SET details = CASE 
  WHEN meal_type = 'Breakfast' THEN jsonb_set(jsonb_set(details, '{fat}', '28'), '{carbs}', '45')
  WHEN meal_type = 'Lunch' THEN jsonb_set(jsonb_set(details, '{fat}', '18'), '{carbs}', '72') 
  WHEN meal_type = 'Dinner' THEN jsonb_set(jsonb_set(details, '{fat}', '32'), '{carbs}', '38')
  WHEN meal_type = 'Snack' THEN jsonb_set(jsonb_set(details, '{fat}', '18'), '{carbs}', '52')
  ELSE details
END
WHERE details->>'fat' IS NULL OR details->>'carbs' IS NULL;