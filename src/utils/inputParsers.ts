export type ParsedExercise = {
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
};

export type ParsedCardio = {
  activity: string;
  distance: number;
  duration: number;
  pace: number;
};

export type ParsedMeal = {
  meal: string;
  calories: number;
  protein: number;
  estimated: boolean;
};

export type ParsedWeight = {
  weight: number;
};

export type ParsedData = ParsedExercise | ParsedCardio | ParsedMeal | ParsedWeight;

export function parseExerciseInput(text: string): ParsedExercise | null {
  console.log('Parsing exercise input:', text);
  
  // Try multiple patterns for flexibility
  const exercisePatterns = [
    // "bench press, 3 sets of 8 at 185 pounds"
    /(.+?),?\s*(\d+)\s*sets?\s*of\s*(\d+)\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/,
    // "bench press 3 sets 8 reps 185 pounds"
    /(.+?)\s*(\d+)\s*sets?\s*(\d+)\s*(?:reps?)\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/,
    // "3 sets of 8 bench press at 185"
    /(\d+)\s*sets?\s*of\s*(\d+)\s*(.+?)\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/,
    // "bench press 3x8 at 185"
    /(.+?)\s*(\d+)\s*x\s*(\d+)\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/,
    // "185 pound bench press 3 sets of 8"
    /(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)\s*(.+?)\s*(\d+)\s*sets?\s*of\s*(\d+)/,
    // "bench press 3 by 8 at 185"
    /(.+?)\s*(\d+)\s*(?:by|x)\s*(\d+)\s*(?:at|@)?\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/
  ];

  for (let i = 0; i < exercisePatterns.length; i++) {
    const match = text.match(exercisePatterns[i]);
    console.log(`Exercise pattern ${i + 1} match:`, match);
    
    if (match) {
      if (i === 2) {
        // Pattern 3: sets first, then exercise, then weight
        return {
          exercise: match[3].trim(),
          sets: parseInt(match[1]),
          reps: parseInt(match[2]),
          weight: parseFloat(match[4])
        };
      } else if (i === 4) {
        // Pattern 5: weight first, then exercise, then sets/reps
        return {
          exercise: match[2].trim(),
          sets: parseInt(match[3]),
          reps: parseInt(match[4]),
          weight: parseFloat(match[1])
        };
      } else {
        // Standard order: exercise, sets, reps, weight
        return {
          exercise: match[1].trim(),
          sets: parseInt(match[2]),
          reps: parseInt(match[3]),
          weight: parseFloat(match[4])
        };
      }
    }
  }
  
  return null;
}

export function parseCardioInput(text: string): ParsedCardio | null {
  console.log('Parsing cardio input:', text);
  
  // Parse: "run 3 miles in 25 minutes"
  const cardioMatch = text.match(/(.+?)\s*(\d+(?:\.\d+)?)\s*miles?\s*in\s*(\d+(?:\.\d+)?)\s*minutes?/);
  console.log('Cardio regex match:', cardioMatch);
  
  if (cardioMatch) {
    const distance = parseFloat(cardioMatch[2]);
    const duration = parseFloat(cardioMatch[3]);
    return {
      activity: cardioMatch[1].trim(),
      distance,
      duration,
      pace: duration / distance
    };
  }
  
  return null;
}

export function parseMealInput(text: string): ParsedMeal | null {
  console.log('Parsing meal input:', text);
  
  // Simple meal logging - store the input and estimate calories/protein
  if (text.length > 0) {
    // Basic calorie estimation (this would be replaced with API calls)
    const estimatedCalories = Math.floor(Math.random() * 400) + 300; // 300-700 range
    const estimatedProtein = Math.floor(Math.random() * 30) + 20; // 20-50g range
    
    return {
      meal: text,
      calories: estimatedCalories,
      protein: estimatedProtein,
      estimated: true
    };
  }
  
  return null;
}

export function parseWeightInput(text: string): ParsedWeight | null {
  console.log('Parsing weight input:', text);
  
  // Parse: "214.5 pounds"
  const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/);
  console.log('Weight regex match:', weightMatch);
  
  if (weightMatch) {
    return {
      weight: parseFloat(weightMatch[1])
    };
  }
  
  return null;
}

export function parseInput(input: string, type: 'exercise' | 'cardio' | 'meal' | 'weight'): ParsedData | null {
  console.log('Parsing input:', input, 'for type:', type);
  const text = input.toLowerCase().trim();
  
  try {
    switch (type) {
      case 'exercise':
        return parseExerciseInput(text);
      case 'cardio':
        return parseCardioInput(text);
      case 'meal':
        return parseMealInput(input.trim()); // Use original case for meal
      case 'weight':
        return parseWeightInput(text);
      default:
        return null;
    }
  } catch (error) {
    console.error('Parsing error:', error);
    return null;
  }
}