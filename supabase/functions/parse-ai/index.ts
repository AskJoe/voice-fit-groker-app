import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedFood {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  items: string[];
}

interface ParsedExercise {
  name: string;
  sets: number;
  rep_range: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inputText, type } = await req.json();
    
    if (!inputText || !type) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing inputText or type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    console.log('OpenAI API key check:', openAIApiKey ? 'Found' : 'Not found');
    
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      return new Response(
        JSON.stringify({ success: false, error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a nutrition/fitness parser. Return only valid JSON matching the exact format requested.' 
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('OpenAI API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get response from OpenAI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content?.trim();
    
    if (!content) {
      return new Response(
        JSON.stringify({ success: false, error: 'No response from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid food structure returned' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        const exercise = parsed as ParsedExercise;
        if (typeof exercise.name !== 'string' || 
            typeof exercise.sets !== 'number' || 
            typeof exercise.rep_range !== 'string') {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid exercise structure returned' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, data: parsed }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to parse AI response: ${content}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in parse-ai function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});