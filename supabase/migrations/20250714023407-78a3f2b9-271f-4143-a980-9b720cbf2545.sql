-- Restore the missing snack meal plan
INSERT INTO public.meal_plans (user_id, meal_type, details)
VALUES (
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'snack',
  '{
    "name": "Healthy Snack",
    "description": "Greek yogurt with mixed nuts",
    "calories": 300,
    "protein": 15,
    "fat": 12,
    "carbs": 20,
    "items": ["Greek yogurt", "Mixed nuts (1 oz)"],
    "timing": "Between meals",
    "notes": "Light protein and healthy fats"
  }'::jsonb
);