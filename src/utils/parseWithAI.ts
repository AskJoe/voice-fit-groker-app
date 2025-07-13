import OpenAI from 'openai';

export interface ParsedFood {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  items: string[];
}

export interface ParsedExercise {
  name: string;
  sets: number;
  rep_range: string;
}

export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function parseInputToJson(
  inputText: string, 
  type: 'food' | 'exercise'
): Promise<ParseResult<ParsedFood | ParsedExercise>> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    let prompt: string;
    let example: string;

    if (type === 'food') {
      example = '{"calories": 300, "protein": 30, "fat": 10, "carbs": 25, "items": ["turkey sandwich"]}';
      prompt = `Parse this food description into valid JSON with this exact format: ${example}

Rules:
- Use reasonable estimates for missing nutritional info
- Include all food items mentioned in the "items" array
- Ensure all numbers are integers
- If multiple items, sum the nutritional values

Input: "${inputText}"

Return only valid JSON, no additional text:`;
    } else {
      example = '{"name": "bench press", "sets": 4, "rep_range": "8-12"}';
      prompt = `Parse this exercise description into valid JSON with this exact format: ${example}

Rules:
- Extract exercise name (lowercase, no special formatting)
- Default to 3 sets if not specified
- Use format "8-12" for rep ranges, or single number if specific
- If multiple exercises mentioned, return data for the first one

Input: "${inputText}"

Return only valid JSON, no additional text:`;
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a nutrition/fitness parser. Return only valid JSON matching the exact format requested.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.1, // Low temperature for consistent parsing
    });

    const content = response.choices[0].message.content?.trim();
    if (!content) {
      return { success: false, error: 'No response from AI' };
    }

    try {
      // Clean up the response - remove code blocks if present
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      const parsed = JSON.parse(cleanContent);
      
      // Validate structure based on type
      if (type === 'food') {
        const food = parsed as ParsedFood;
        if (typeof food.calories !== 'number' || 
            typeof food.protein !== 'number' || 
            typeof food.fat !== 'number' || 
            typeof food.carbs !== 'number' || 
            !Array.isArray(food.items)) {
          return { success: false, error: 'Invalid food structure returned' };
        }
      } else {
        const exercise = parsed as ParsedExercise;
        if (typeof exercise.name !== 'string' || 
            typeof exercise.sets !== 'number' || 
            typeof exercise.rep_range !== 'string') {
          return { success: false, error: 'Invalid exercise structure returned' };
        }
      }

      return { success: true, data: parsed };
    } catch (parseError) {
      return { 
        success: false, 
        error: `Failed to parse AI response: ${content}` 
      };
    }

  } catch (error) {
    console.error('Error parsing with AI:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}