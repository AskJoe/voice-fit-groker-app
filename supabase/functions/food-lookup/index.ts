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

// Fallback nutrition database for common foods (per 100g)
const FALLBACK_NUTRITION: Record<string, NutrientInfo> = {
  // Proteins
  'chicken breast': { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
  'chicken': { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
  'grilled chicken': { calories: 165, protein: 31, fat: 3.6, carbs: 0 },
  'chicken thigh': { calories: 209, protein: 26, fat: 11, carbs: 0 },
  'ground turkey': { calories: 149, protein: 20, fat: 7, carbs: 0 },
  'turkey': { calories: 149, protein: 20, fat: 7, carbs: 0 },
  'ground beef': { calories: 254, protein: 26, fat: 17, carbs: 0 },
  'beef': { calories: 254, protein: 26, fat: 17, carbs: 0 },
  'salmon': { calories: 208, protein: 25, fat: 12, carbs: 0 },
  'tuna': { calories: 144, protein: 30, fat: 1, carbs: 0 },
  'eggs': { calories: 155, protein: 13, fat: 11, carbs: 1 },
  'egg': { calories: 155, protein: 13, fat: 11, carbs: 1 },
  
  // Dairy
  'cottage cheese': { calories: 98, protein: 11, fat: 4, carbs: 3 },
  '4% cottage cheese': { calories: 98, protein: 11, fat: 4, carbs: 3 },
  'cheddar cheese': { calories: 403, protein: 25, fat: 33, carbs: 1 },
  'cheese': { calories: 403, protein: 25, fat: 33, carbs: 1 },
  'milk': { calories: 42, protein: 3, fat: 1, carbs: 5 },
  'almond milk': { calories: 15, protein: 0.6, fat: 1.1, carbs: 0.6 },
  'unsweet almond milk': { calories: 15, protein: 0.6, fat: 1.1, carbs: 0.6 },
  'greek yogurt': { calories: 59, protein: 10, fat: 0.4, carbs: 3.6 },
  
  // Grains & Carbs
  'rice': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  'brown rice': { calories: 111, protein: 2.6, fat: 0.9, carbs: 23 },
  'white rice': { calories: 130, protein: 2.7, fat: 0.3, carbs: 28 },
  'quinoa': { calories: 120, protein: 4.4, fat: 1.9, carbs: 22 },
  'oats': { calories: 68, protein: 2.4, fat: 1.4, carbs: 12 },
  'steel cut oats': { calories: 68, protein: 2.4, fat: 1.4, carbs: 12 },
  'quick steel cut oats': { calories: 68, protein: 2.4, fat: 1.4, carbs: 12 },
  'bread': { calories: 265, protein: 9, fat: 3.2, carbs: 49 },
  'whole wheat bread': { calories: 247, protein: 13, fat: 4.2, carbs: 41 },
  'bagel': { calories: 257, protein: 10, fat: 1.5, carbs: 50 },
  'pasta': { calories: 131, protein: 5, fat: 1.1, carbs: 25 },
  'tortilla': { calories: 218, protein: 6, fat: 3.3, carbs: 43 },
  'corn tortilla': { calories: 218, protein: 6, fat: 3.3, carbs: 43 },
  'tortillas': { calories: 218, protein: 6, fat: 3.3, carbs: 43 },
  
  // Nuts & Seeds
  'peanut butter': { calories: 588, protein: 25, fat: 50, carbs: 20 },
  'almonds': { calories: 579, protein: 21, fat: 50, carbs: 22 },
  'walnuts': { calories: 654, protein: 15, fat: 65, carbs: 14 },
  
  // Fruits
  'banana': { calories: 89, protein: 1.1, fat: 0.3, carbs: 23 },
  'apple': { calories: 52, protein: 0.3, fat: 0.2, carbs: 14 },
  'berries': { calories: 57, protein: 0.7, fat: 0.3, carbs: 14 },
  'blueberries': { calories: 57, protein: 0.7, fat: 0.3, carbs: 14 },
  'strawberries': { calories: 32, protein: 0.7, fat: 0.3, carbs: 8 },
  
  // Vegetables
  'broccoli': { calories: 34, protein: 2.8, fat: 0.4, carbs: 7 },
  'spinach': { calories: 23, protein: 2.9, fat: 0.4, carbs: 3.6 },
  'carrots': { calories: 41, protein: 0.9, fat: 0.2, carbs: 10 },
  'sweet potato': { calories: 86, protein: 1.6, fat: 0.1, carbs: 20 },
  
  // Oils & Fats
  'olive oil': { calories: 884, protein: 0, fat: 100, carbs: 0 },
  'butter': { calories: 717, protein: 0.9, fat: 81, carbs: 0.1 }
};

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
      console.log(`Calculating multiplier for ${amount} ${unit}`);
      
      // Handle weight-based units (grams, pounds, etc.) - these are direct conversions
      const weightUnits: Record<string, number> = {
        'gram': 1,
        'grams': 1,
        'g': 1,
        'kilogram': 1000,
        'kilograms': 1000,
        'kg': 1000,
        'pound': 453.6,
        'pounds': 453.6,
        'lb': 453.6,
        'lbs': 453.6,
        'ounce': 28.35,    // weight ounce (not fluid)
        'ounces': 28.35,
        'oz': 28.35,
      };
      
      // Handle volume-based units (cups, tablespoons, etc.) - approximate conversions to grams
      const volumeUnits: Record<string, number> = {
        'cup': 240,        // ~240g for most foods
        'cups': 240,
        'tablespoon': 15,  // ~15g for most foods
        'tablespoons': 15,
        'tbsp': 15,
        'teaspoon': 5,     // ~5g for most foods
        'teaspoons': 5,
        'tsp': 5,
        'ml': 1,           // 1ml ≈ 1g for most foods
        'milliliter': 1,
        'milliliters': 1,
        'liter': 1000,
        'liters': 1000,
        'l': 1000,
      };
      
      // Handle count-based units
      const countUnits: Record<string, number> = {
        'piece': 100,      // Default to 100g per piece
        'pieces': 100,
        'item': 100,
        'items': 100,
        'tortilla': 30,    // Corn tortilla ~30g
        'tortillas': 30,
        'slice': 25,       // Bread slice ~25g
        'slices': 25,
      };
      
      const unitLower = unit.toLowerCase();
      let gramsAmount = 0;
      
      if (weightUnits[unitLower] !== undefined) {
        // Direct weight conversion
        gramsAmount = amount * weightUnits[unitLower];
        console.log(`Weight conversion: ${amount} ${unit} = ${gramsAmount}g`);
      } else if (volumeUnits[unitLower] !== undefined) {
        // Volume conversion (approximate)
        gramsAmount = amount * volumeUnits[unitLower];
        console.log(`Volume conversion: ${amount} ${unit} = ${gramsAmount}g (approximate)`);
      } else if (countUnits[unitLower] !== undefined) {
        // Count conversion
        gramsAmount = amount * countUnits[unitLower];
        console.log(`Count conversion: ${amount} ${unit} = ${gramsAmount}g (estimated)`);
      } else {
        // Default fallback
        gramsAmount = amount * 100;
        console.log(`Unknown unit ${unit}, defaulting to: ${amount} × 100g = ${gramsAmount}g`);
      }
      
      // USDA data is per 100g, so calculate multiplier
      const multiplier = gramsAmount / 100;
      console.log(`Final multiplier: ${gramsAmount}g ÷ 100g = ${multiplier}`);
      
      return multiplier;
    }

    // Helper function to lookup nutrition in fallback database
    function tryFallbackLookup(item: string, multiplier: number): { nutrients: NutrientInfo | null; source: string } {
      const itemLower = item.toLowerCase().trim();
      
      // Try exact match first
      if (FALLBACK_NUTRITION[itemLower]) {
        const baseNutrients = FALLBACK_NUTRITION[itemLower];
        const scaledNutrients = {
          calories: Math.round((baseNutrients.calories || 0) * multiplier),
          protein: Math.round((baseNutrients.protein || 0) * multiplier), 
          fat: Math.round((baseNutrients.fat || 0) * multiplier),
          carbs: Math.round((baseNutrients.carbs || 0) * multiplier)
        };
        console.log(`Fallback exact match for ${item}:`, scaledNutrients);
        return { nutrients: scaledNutrients, source: 'FALLBACK_DB' };
      }
      
      // Try partial matches (contains)
      for (const [key, nutrients] of Object.entries(FALLBACK_NUTRITION)) {
        if (itemLower.includes(key) || key.includes(itemLower)) {
          const scaledNutrients = {
            calories: Math.round((nutrients.calories || 0) * multiplier),
            protein: Math.round((nutrients.protein || 0) * multiplier),
            fat: Math.round((nutrients.fat || 0) * multiplier), 
            carbs: Math.round((nutrients.carbs || 0) * multiplier)
          };
          console.log(`Fallback partial match for ${item} -> ${key}:`, scaledNutrients);
          return { nutrients: scaledNutrients, source: 'FALLBACK_DB' };
        }
      }
      
      console.log(`No fallback data found for: ${item}`);
      return { nutrients: null, source: 'NOT_FOUND' };
    }

    for (const item of items) {
      console.log(`=== PROCESSING ITEM: ${item} ===`);
      
      // Find quantity info for this item
      const quantityInfo = quantities?.find(q => q.item === item);
      const multiplier = quantityInfo ? getServingMultiplier(quantityInfo.unit, quantityInfo.amount) : 1;
      
      console.log(`Quantity info for ${item}:`, quantityInfo);
      console.log(`Calculated multiplier: ${multiplier}`);
      
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
          console.log(`No USDA data found for: ${item}, checking fallback database`);
          // Try fallback nutrition database
          const fallbackData = tryFallbackLookup(item, multiplier);
          results.push({
            item,
            nutrients: fallbackData.nutrients,
            source: fallbackData.source
          });
        }
      } catch (error) {
        console.error(`Error searching USDA for ${item}:`, error);
        console.log(`USDA error for ${item}, trying fallback database`);
        // Try fallback nutrition database on error
        const fallbackData = tryFallbackLookup(item, multiplier);
        results.push({
          item,
          nutrients: fallbackData.nutrients,
          source: fallbackData.source
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