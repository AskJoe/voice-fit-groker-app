-- Add missing exercises from workout plans to exercise_database table
INSERT INTO public.exercise_database (exercise_name, category, met_value, description) VALUES
-- Upper body exercises
('incline press', 'strength', 6.0, 'Incline barbell or dumbbell press exercise'),
('incline dumbbell press', 'strength', 6.0, 'Incline dumbbell press exercise'),
('incline barbell press', 'strength', 6.0, 'Incline barbell press exercise'),
('tricep dips', 'strength', 4.0, 'Tricep dips on parallel bars or bench'),
('dips', 'strength', 4.0, 'Parallel bar dips or bench dips'),
('bent over rows', 'strength', 6.0, 'Bent over barbell or dumbbell rows'),
('bent-over rows', 'strength', 6.0, 'Bent over barbell or dumbbell rows'),
('barbell rows', 'strength', 6.0, 'Bent over barbell rows'),
('dumbbell rows', 'strength', 6.0, 'Bent over dumbbell rows'),
('lateral raises', 'strength', 4.0, 'Dumbbell lateral raises for shoulders'),
('side raises', 'strength', 4.0, 'Dumbbell side raises for shoulders'),
('overhead press', 'strength', 6.0, 'Standing overhead barbell or dumbbell press'),
('military press', 'strength', 6.0, 'Standing military press'),
('shoulder press', 'strength', 6.0, 'Seated or standing shoulder press'),
('barbell curls', 'strength', 4.0, 'Standing barbell bicep curls'),
('bicep curls', 'strength', 4.0, 'Barbell or dumbbell bicep curls'),
('hammer curls', 'strength', 4.0, 'Dumbbell hammer curls'),
('tricep extensions', 'strength', 4.0, 'Overhead tricep extensions'),
('skull crushers', 'strength', 4.0, 'Lying tricep extensions'),

-- Lower body exercises
('leg curls', 'strength', 5.0, 'Machine leg curls for hamstrings'),
('hamstring curls', 'strength', 5.0, 'Machine hamstring curls'),
('calf raises', 'strength', 4.0, 'Standing or seated calf raises'),
('leg extensions', 'strength', 5.0, 'Machine leg extensions for quadriceps'),
('quad extensions', 'strength', 5.0, 'Machine quadriceps extensions'),
('leg press', 'strength', 6.0, 'Machine leg press exercise'),
('bulgarian split squats', 'strength', 6.0, 'Bulgarian split squats with rear foot elevated'),
('split squats', 'strength', 6.0, 'Split squats or lunges'),
('hip thrusts', 'strength', 5.0, 'Barbell or bodyweight hip thrusts'),
('glute bridges', 'strength', 4.0, 'Bodyweight or weighted glute bridges'),

-- Core exercises
('russian twists', 'strength', 4.0, 'Seated russian twists for obliques'),
('bicycle crunches', 'strength', 4.0, 'Bicycle crunches for abs'),
('mountain climbers', 'cardio', 8.0, 'Mountain climber cardio exercise'),
('leg raises', 'strength', 4.0, 'Hanging or lying leg raises'),
('hanging leg raises', 'strength', 5.0, 'Hanging leg raises from pull-up bar'),

-- Cardio exercises
('treadmill', 'cardio', 8.0, 'Treadmill running or walking'),
('elliptical', 'cardio', 7.0, 'Elliptical machine cardio'),
('stationary bike', 'cardio', 7.0, 'Stationary bicycle exercise'),
('rowing machine', 'cardio', 8.5, 'Indoor rowing machine'),
('stair climber', 'cardio', 9.0, 'Stair climbing machine'),

-- Full body/compound exercises
('burpees', 'cardio', 8.0, 'Full body burpee exercise'),
('thrusters', 'strength', 8.0, 'Squat to overhead press combination'),
('clean and press', 'strength', 8.0, 'Olympic clean and press movement'),
('kettlebell swings', 'strength', 9.6, 'Kettlebell swings for full body'),
('battle ropes', 'cardio', 8.0, 'Battle rope cardio exercise');