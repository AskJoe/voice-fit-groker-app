-- Create meal plans for user 9341ebea-c62c-4767-860b-c4f214932d4d
INSERT INTO public.meal_plans (user_id, meal_type, details) VALUES
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'breakfast',
  '{
    "name": "Greek Yogurt Parfait",
    "calories": "400-500",
    "protein": "25-30g",
    "description": "1 cup low-fat Greek yogurt, 1/2 cup berries, 1/4 cup granola, 1 tbsp chia seeds",
    "timing": "Daily",
    "notes": "Focus on whole foods and energy maintenance"
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'mid_morning_snack',
  '{
    "name": "Apple with Almonds & Protein Shake",
    "calories": "200-300",
    "protein": "15-20g",
    "description": "Apple with 1 oz almonds and a protein shake (whey or plant-based, 20g protein)",
    "timing": "3-4 hours after breakfast",
    "notes": "Maintain energy levels"
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'lunch',
  '{
    "name": "Grilled Chicken Salad",
    "calories": "400-500",
    "protein": "30-40g",
    "description": "4 oz grilled chicken breast, mixed greens, cherry tomatoes, cucumber, 1/2 avocado, quinoa (1/2 cup cooked), light vinaigrette",
    "timing": "Midday",
    "notes": "Balanced macro nutrients for sustained energy"
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'afternoon_snack',
  '{
    "name": "Cottage Cheese with Veggies",
    "calories": "200-300",
    "protein": "15-20g",
    "description": "Cottage cheese (1/2 cup low-fat) with carrot sticks and hummus (2 tbsp)",
    "timing": "3-4 hours after lunch",
    "notes": "Pre-workout fuel if needed"
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'dinner',
  '{
    "name": "Baked Salmon with Sweet Potato",
    "calories": "400-500",
    "protein": "30-40g",
    "description": "Baked salmon (4 oz) with sweet potato (medium) and steamed broccoli (1 cup), drizzled with olive oil",
    "timing": "Evening",
    "notes": "Omega-3s for recovery, complex carbs for glycogen replenishment"
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'evening_snack',
  '{
    "name": "Mixed Nuts with Herbal Tea",
    "calories": "100-200",
    "protein": "10g",
    "description": "Herbal tea with a small handful of mixed nuts",
    "timing": "Optional, if needed",
    "notes": "Only if hungry, helps with recovery"
  }'::jsonb
);

-- Create workout plans for user 9341ebea-c62c-4767-860b-c4f214932d4d
INSERT INTO public.workout_plans (user_id, day, exercises) VALUES
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'monday',
  '{
    "focus": "Upper Body Lift + Run (3-5 miles)",
    "exercises": [
      {"name": "bench press", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Use challenging weight"},
      {"name": "rows", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Focus on form"},
      {"name": "overhead press", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Shoulder stability"},
      {"name": "bicep curls", "sets": 3, "reps": "10-15", "type": "strength", "notes": "Controlled movement"},
      {"name": "tricep dips", "sets": 3, "reps": "10-15", "type": "strength", "notes": "Full range of motion"},
      {"name": "running", "duration": "3-5 miles", "type": "cardio", "notes": "Moderate pace, separate from lifting if possible"}
    ],
    "notes": "Warm up 5-10 min, cool down with stretching. 45-60 min total lifting session."
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'tuesday',
  '{
    "focus": "Lower Body Lift + Run (4-6 miles)",
    "exercises": [
      {"name": "squats", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Compound movement, focus on depth"},
      {"name": "lunges", "sets": 3, "reps": "10 per leg", "type": "strength", "notes": "Unilateral strength"},
      {"name": "deadlifts", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Hip hinge pattern"},
      {"name": "calf raises", "sets": 3, "reps": "12-15", "type": "strength", "notes": "Running support"},
      {"name": "running", "duration": "4-6 miles", "type": "cardio", "notes": "Moderate to tempo pace"}
    ],
    "notes": "Focus on compound movements for full-body toning."
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'wednesday',
  '{
    "focus": "Full Body Lift + Run (3-5 miles)",
    "exercises": [
      {"name": "push-ups", "sets": 3, "reps": "10-15", "type": "strength", "notes": "Bodyweight strength"},
      {"name": "pull-ups", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Use assistance if needed"},
      {"name": "leg press", "sets": 3, "reps": "10-12", "type": "strength", "notes": "Or glute bridges"},
      {"name": "planks", "sets": 3, "duration": "30-60 seconds", "type": "core", "notes": "Core stability"},
      {"name": "running", "duration": "3-5 miles", "type": "cardio", "notes": "Easy to moderate pace"}
    ],
    "notes": "Full body integration day with bodyweight and weighted exercises."
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'thursday',
  '{
    "focus": "Upper Body Lift + Run (5-7 miles)",
    "exercises": [
      {"name": "bench press", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Similar to Monday"},
      {"name": "rows", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Back development"},
      {"name": "overhead press", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Shoulder strength"},
      {"name": "lateral raises", "sets": 3, "reps": "10-15", "type": "strength", "notes": "Shoulder isolation"},
      {"name": "bicep curls", "sets": 3, "reps": "10-15", "type": "strength", "notes": "Arm definition"},
      {"name": "tricep dips", "sets": 3, "reps": "10-15", "type": "strength", "notes": "Tricep focus"},
      {"name": "running", "duration": "5-7 miles", "type": "cardio", "notes": "Longer run day"}
    ],
    "notes": "Upper body focus with added shoulder work. Longer run distance."
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'friday',
  '{
    "focus": "Lower Body/Core Lift + Run (3-5 miles)",
    "exercises": [
      {"name": "squats", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Similar to Tuesday"},
      {"name": "lunges", "sets": 3, "reps": "10 per leg", "type": "strength", "notes": "Unilateral work"},
      {"name": "deadlifts", "sets": 3, "reps": "8-12", "type": "strength", "notes": "Posterior chain"},
      {"name": "calf raises", "sets": 3, "reps": "12-15", "type": "strength", "notes": "Running support"},
      {"name": "russian twists", "sets": 3, "reps": "15 per side", "type": "core", "notes": "Core toning"},
      {"name": "bird dogs", "sets": 3, "reps": "10 per side", "type": "core", "notes": "Core stability"},
      {"name": "running", "duration": "3-5 miles", "type": "cardio", "notes": "Recovery pace"}
    ],
    "notes": "Lower body with added core work for toning and stability."
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'saturday',
  '{
    "focus": "Run Only (4-7 miles)",
    "exercises": [
      {"name": "running", "duration": "4-7 miles", "type": "cardio", "notes": "Easy pace, focus on enjoyment and endurance"}
    ],
    "notes": "Pure running day. Easy pace for recovery and aerobic base building."
  }'::jsonb
),
(
  '9341ebea-c62c-4767-860b-c4f214932d4d',
  'sunday',
  '{
    "focus": "Rest/Active Recovery",
    "exercises": [
      {"name": "yoga", "duration": "20-30 min", "type": "flexibility", "notes": "Gentle stretching and mobility"},
      {"name": "walking", "duration": "20-30 min", "type": "recovery", "notes": "Light movement, optional"},
      {"name": "foam rolling", "duration": "10-15 min", "type": "recovery", "notes": "Muscle recovery and mobility"}
    ],
    "notes": "Full rest day. No lifting or intense running. Focus on recovery and mobility."
  }'::jsonb
);