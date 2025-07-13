-- Remove duplicate meal plans, keeping only the oldest entry for each meal type
DELETE FROM meal_plans 
WHERE id NOT IN (
  SELECT DISTINCT ON (meal_type, user_id) id 
  FROM meal_plans 
  ORDER BY meal_type, user_id, created_at ASC
);