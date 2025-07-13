-- Clean up ALL remaining text ranges in meal plans
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
WHERE details->>'calories' LIKE '%-%';

-- Clean up protein field text ranges  
UPDATE meal_plans 
SET details = jsonb_set(details, '{protein}', '25')
WHERE details->>'protein' LIKE '%-%';

-- Clean up fat field text ranges
UPDATE meal_plans 
SET details = jsonb_set(details, '{fat}', '15') 
WHERE details->>'fat' LIKE '%-%';

-- Clean up carbs field text ranges
UPDATE meal_plans 
SET details = jsonb_set(details, '{carbs}', '45')
WHERE details->>'carbs' LIKE '%-%';

-- Verify the update
SELECT meal_type, details->>'calories' as calories, details->>'protein' as protein 
FROM meal_plans 
WHERE user_id = '9341ebea-c62c-4767-860b-c4f214932d4d';