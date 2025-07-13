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
  quantities?: Array<{
    item: string;
    amount: number;
    unit: string;
  }>;
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
    const { items, quantities }: FoodLookupRequest = await req.json();
    console.log('Looking up USDA data for items:', items);
    console.log('Quantities provided:', quantities);

    const results: Array<{ item: string; nutrients: NutrientInfo | null; source: string }> = [];
    
    // Helper function to calculate serving size multiplier
    function getServingMultiplier(unit: string, amount: number): number {
      const unitMultipliers: Record<string, number> = {
        'cup': 240,    // ml per cup
        'cups': 240,   // ml per cup
        'tablespoon': 15,  // ml per tablespoon
        'tablespoons': 15, // ml per tablespoon
        'tbsp': 15,
        'teaspoon': 5,     // ml per teaspoon
        'teaspoons': 5,    // ml per teaspoon
        'tsp': 5,
        'ounce': 30,       // ml per fluid ounce (rough)
        'ounces': 30,      // ml per fluid ounce (rough)
        'oz': 30,
        'ml': 1,
        'liter': 1000,
        'liters': 1000,
        'gram': 1,         // grams
        'grams': 1,
        'g': 1,
        'pound': 453.6,    // grams per pound
        'pounds': 453.6,
        'lb': 453.6,
        'lbs': 453.6,
      };
      
      const baseAmount = unitMultipliers[unit.toLowerCase()] || 100; // Default to 100g
      return (amount * baseAmount) / 100; // Convert to per-100g multiplier
    }

    for (const item of items) {
      console.log(`Searching USDA for: ${item}`);
      
      // Find quantity info for this item
      const quantityInfo = quantities?.find(q => q.item === item);
      const multiplier = quantityInfo ? getServingMultiplier(quantityInfo.unit, quantityInfo.amount) : 1;
      
      console.log(`Quantity info for ${item}:`, quantityInfo, 'Multiplier:', multiplier);
      
      // Search USDA FoodData Central API
      const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(item)}&pageSize=1&api_key=DEMO_KEY`;
      
      try {
        const response = await fetch(searchUrl);
        const searchData: USDASearchResponse = await response.json();
        
        if (searchData.foods && searchData.foods.length > 0) {
          const food = searchData.foods[0];
          console.log(`Found USDA food: ${food.description} (ID: ${food.fdcId})`);
          
          // Extract nutrients we care about (these are per 100g from USDA)
          const baseNutrients: NutrientInfo = {};
          
          for (const nutrient of food.foodNutrients) {
            switch (nutrient.nutrientId) {
              case 1008: // Energy (calories)
                baseNutrients.calories = nutrient.value;
                break;
              case 1003: // Protein
                baseNutrients.protein = nutrient.value;
                break;
              case 1004: // Total lipid (fat)
                baseNutrients.fat = nutrient.value;
                break;
              case 1005: // Carbohydrate, by difference
                baseNutrients.carbs = nutrient.value;
                break;
            }
          }
          
          // Scale nutrients by the serving size multiplier
          const nutrients: NutrientInfo = {
            calories: Math.round((baseNutrients.calories || 0) * multiplier),
            protein: Math.round((baseNutrients.protein || 0) * multiplier),
            fat: Math.round((baseNutrients.fat || 0) * multiplier),
            carbs: Math.round((baseNutrients.carbs || 0) * multiplier),
          };
          
          console.log(`Base nutrients for ${item}:`, baseNutrients);
          console.log(`Scaled nutrients for ${item} (${quantityInfo?.amount} ${quantityInfo?.unit}):`, nutrients);
          
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