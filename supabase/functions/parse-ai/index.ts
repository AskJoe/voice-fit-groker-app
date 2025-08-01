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
  quantities?: Array<{
    item: string;
    amount: number;
    unit: string;
  }>;
  source?: string; // Track data source (USDA or AI)
}

interface ParsedExercise {
  exercise_name: string;
  exercise_type: 'cardio' | 'strength';
  sets?: number;
  reps?: number;
  weight?: number;
  duration_minutes?: number;
  distance?: number;
  calories_burned?: number;
  source?: string; // Track data source (MET or AI)
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
      example = '{"calories": 300, "protein": 30, "fat": 10, "carbs": 25, "items": ["grilled chicken breast", "brown rice"], "quantities": [{"item": "grilled chicken breast", "amount": 150, "unit": "grams"}, {"item": "brown rice", "amount": 100, "unit": "grams"}]}';
      prompt = `Parse this food description into valid JSON with this exact format: ${example}

CRITICAL RULES for quantity parsing:
- Extract ALL specific amounts and units mentioned (e.g., "3 tortillas" = amount: 3, unit: "tortillas")
- For weight measurements, use exact numbers (e.g., "106g chicken" = amount: 106, unit: "grams") 
- For volume measurements, convert to standard units (e.g., "1 cup" = amount: 1, unit: "cup")
- Each item in "items" array must have corresponding entry in "quantities" array
- If no specific quantity mentioned, estimate reasonable serving size in grams
- Use precise units: "grams", "cups", "tablespoons", "ounces", "pieces", "slices", etc.
- The quantities will be used to calculate accurate nutrition via USDA database lookup

CRITICAL CALORIE ESTIMATION RULES (these are TEMPORARY estimates, will be replaced by database):
- Be CONSERVATIVE with calorie estimates - better to underestimate than overestimate
- Use these as rough guidelines for common foods:
  * Chicken breast: ~165 cal/100g
  * Cheese: ~400 cal/100g  
  * Rice/grains: ~130 cal/100g
  * Vegetables: ~20-50 cal/100g
  * Tortillas: ~220 cal/100g
  * Bread: ~250 cal/100g
- For mixed meals, estimate portions carefully
- If uncertain, use lower calorie estimates
- Maximum reasonable calories for a normal meal: 800-1000

Examples:
- "3 corn tortillas" → {"item": "corn tortillas", "amount": 3, "unit": "tortillas"}
- "106 grams chicken" → {"item": "chicken", "amount": 106, "unit": "grams"}  
- "30g cheese" → {"item": "cheese", "amount": 30, "unit": "grams"}
- "1 cup rice" → {"item": "rice", "amount": 1, "unit": "cup"}

Input: "${inputText}"

Return only valid JSON, no additional text:`;
    } else {
      example = '{"exercise_name": "bench press", "exercise_type": "strength", "sets": 4, "reps": 10, "weight": 135, "calories_burned": 180}';
      prompt = `Parse this exercise description into valid JSON with this exact format: ${example}

Rules:
- Determine if this is "cardio" or "strength" exercise
- For CARDIO (running, cycling, swimming, etc.): include duration_minutes, distance (if mentioned), and estimate calories_burned using METs
- For STRENGTH (weights, bodyweight exercises): include sets, reps, weight (if mentioned), and estimate calories_burned
- Extract exercise_name (lowercase, descriptive)
- Use reasonable estimates for missing values
- Estimate calories_burned based on exercise type and intensity

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

        // For food items, lookup USDA data and replace AI estimates
        console.log('=== FOOD LOOKUP PROCESS START ===');
        console.log('AI parsed food items:', food.items);
        console.log('AI parsed quantities:', food.quantities);
        console.log('AI estimated calories before USDA lookup:', food.calories);
        
        try {
          const usdaResponse = await fetch('https://jlpkhkxnzwehjiemgpvg.supabase.co/functions/v1/food-lookup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              items: food.items,
              quantities: food.quantities 
            })
          });

          if (usdaResponse.ok) {
            const usdaData = await usdaResponse.json();
            console.log('=== USDA LOOKUP RESPONSE ===');
            console.log('Full USDA response:', JSON.stringify(usdaData, null, 2));

            // Calculate totals from USDA data
            let totalCalories = 0;
            let totalProtein = 0;
            let totalFat = 0;
            let totalCarbs = 0;
            let usdaItemsFound = 0;

            console.log('=== PROCESSING USDA RESULTS ===');
            let fallbackItemsFound = 0;
            for (const result of usdaData.results) {
              console.log(`Processing result for item: ${result.item}`);
              console.log(`Result source: ${result.source}`);
              console.log(`Result nutrients:`, result.nutrients);
              
              if (result.nutrients && (result.source === 'USDA' || result.source === 'FALLBACK_DB')) {
                const itemCalories = result.nutrients.calories || 0;
                const itemProtein = result.nutrients.protein || 0;
                const itemFat = result.nutrients.fat || 0;
                const itemCarbs = result.nutrients.carbs || 0;
                
                console.log(`Adding to totals - Calories: ${itemCalories}, Protein: ${itemProtein}, Fat: ${itemFat}, Carbs: ${itemCarbs}`);
                
                totalCalories += itemCalories;
                totalProtein += itemProtein;
                totalFat += itemFat;
                totalCarbs += itemCarbs;
                
                if (result.source === 'USDA') {
                  usdaItemsFound++;
                } else {
                  fallbackItemsFound++;
                }
              }
            }

            console.log('=== FINAL TOTALS ===');
            console.log(`Total calories from database: ${totalCalories}`);
            console.log(`Total protein from database: ${totalProtein}`);
            console.log(`Total fat from database: ${totalFat}`);
            console.log(`Total carbs from database: ${totalCarbs}`);
            console.log(`USDA items found: ${usdaItemsFound}`);
            console.log(`Fallback DB items found: ${fallbackItemsFound}`);

            // Use database data if we found nutritional info for at least one item
            if (usdaItemsFound > 0 || fallbackItemsFound > 0) {
              console.log('=== USING DATABASE DATA ===');
              console.log(`Before update - AI calories: ${parsed.calories}`);
              
              // Apply calorie validation - flag if unreasonably high
              if (totalCalories > 1500) {
                console.warn(`⚠️ HIGH CALORIE WARNING: ${totalCalories} calories seems excessive for this meal`);
              }
              
              parsed.calories = Math.round(totalCalories);
              parsed.protein = Math.round(totalProtein);
              parsed.fat = Math.round(totalFat);
              parsed.carbs = Math.round(totalCarbs);
              
              if (usdaItemsFound > 0) {
                parsed.source = fallbackItemsFound > 0 ? 'USDA+FALLBACK' : 'USDA';
              } else {
                parsed.source = 'FALLBACK_DB';
              }
              console.log(`After update - Final calories: ${parsed.calories}`);
            } else {
              console.log('=== NO DATABASE DATA FOUND ===');
              console.log('Keeping AI estimates');
              parsed.source = 'AI_ESTIMATE';
              
              // Apply extra validation to AI estimates
              if (parsed.calories > 1000) {
                console.warn(`⚠️ AI ESTIMATE WARNING: ${parsed.calories} calories seems high, reducing to 800`);
                parsed.calories = 800;
                parsed.protein = Math.round(parsed.protein * 0.8);
                parsed.fat = Math.round(parsed.fat * 0.8);
                parsed.carbs = Math.round(parsed.carbs * 0.8);
              }
            }
          } else {
            console.error('USDA lookup failed with status:', usdaResponse.status);
            const errorText = await usdaResponse.text();
            console.error('USDA error response:', errorText);
            parsed.source = 'AI_ESTIMATE';
          }
        } catch (usdaError) {
          console.error('Error calling USDA lookup:', usdaError);
          parsed.source = 'AI_ESTIMATE';
        }
        
        console.log('=== FOOD LOOKUP PROCESS END ===');
      } else {
        const exercise = parsed as ParsedExercise;
        if (typeof exercise.exercise_name !== 'string' || 
            typeof exercise.exercise_type !== 'string' ||
            !['cardio', 'strength'].includes(exercise.exercise_type)) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid exercise structure returned' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // For exercises, lookup MET values and calculate accurate calories
        console.log('Looking up MET data for exercise:', exercise.exercise_name);
        try {
          // Assume average weight of 70kg if not provided (we'll need user weight in the future)
          const defaultWeight = 70; // kg
          
          const metResponse = await fetch('https://jlpkhkxnzwehjiemgpvg.supabase.co/functions/v1/exercise-lookup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              exercise_name: exercise.exercise_name,
              duration_minutes: exercise.duration_minutes,
              weight_kg: defaultWeight
            })
          });

          if (metResponse.ok) {
            const metData = await metResponse.json();
            console.log('MET lookup response:', metData);

            if (metData.found && metData.exercise.calories_burned) {
              console.log('Using MET-based calorie calculation');
              parsed.calories_burned = metData.exercise.calories_burned;
              parsed.source = 'MET_DATABASE';
            } else {
              console.log('No MET data found, keeping AI estimate');
              parsed.source = 'AI_ESTIMATE';
            }
          } else {
            console.error('MET lookup failed:', metResponse.status);
            parsed.source = 'AI_ESTIMATE';
          }
        } catch (metError) {
          console.error('Error calling MET lookup:', metError);
          parsed.source = 'AI_ESTIMATE';
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