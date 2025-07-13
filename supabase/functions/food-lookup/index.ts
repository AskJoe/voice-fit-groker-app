import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: {
    nutrientId: number;
    value: number;
  }[];
}

interface USDASearchResponse {
  foods: USDAFood[];
}

interface FoodLookupRequest {
  items: string[];
}

interface NutrientInfo {
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { items }: FoodLookupRequest = await req.json();
    console.log('Looking up USDA data for items:', items);

    const results: Array<{ item: string; nutrients: NutrientInfo | null; source: string }> = [];

    for (const item of items) {
      console.log(`Searching USDA for: ${item}`);
      
      // Search USDA FoodData Central API
      const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(item)}&pageSize=1&api_key=DEMO_KEY`;
      
      try {
        const response = await fetch(searchUrl);
        const searchData: USDASearchResponse = await response.json();
        
        if (searchData.foods && searchData.foods.length > 0) {
          const food = searchData.foods[0];
          console.log(`Found USDA food: ${food.description} (ID: ${food.fdcId})`);
          
          // Extract nutrients we care about
          const nutrients: NutrientInfo = {};
          
          for (const nutrient of food.foodNutrients) {
            switch (nutrient.nutrientId) {
              case 1008: // Energy (calories)
                nutrients.calories = Math.round(nutrient.value);
                break;
              case 1003: // Protein
                nutrients.protein = Math.round(nutrient.value);
                break;
              case 1004: // Total lipid (fat)
                nutrients.fat = Math.round(nutrient.value);
                break;
              case 1005: // Carbohydrate, by difference
                nutrients.carbs = Math.round(nutrient.value);
                break;
            }
          }
          
          console.log(`Extracted nutrients for ${item}:`, nutrients);
          
          results.push({
            item,
            nutrients,
            source: 'USDA'
          });
        } else {
          console.log(`No USDA data found for: ${item}`);
          results.push({
            item,
            nutrients: null,
            source: 'NOT_FOUND'
          });
        }
      } catch (error) {
        console.error(`Error searching USDA for ${item}:`, error);
        results.push({
          item,
          nutrients: null,
          source: 'ERROR'
        });
      }
    }

    console.log('USDA lookup results:', results);

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in food-lookup function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});