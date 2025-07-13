import OpenAI from 'openai';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';

export interface WeeklyAnalysisResult {
  analysis?: string;
  message?: string;
  error?: string;
}

export async function performWeeklyAnalysis(userId: string): Promise<WeeklyAnalysisResult> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      return { error: 'OpenAI API key not configured' };
    }

    const openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });

    // Step 1: Check if 4 weeks of data exist
    const { data: earliestLog } = await supabase
      .from('weight_logs')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .limit(1);

    if (!earliestLog || !earliestLog[0]) {
      return { message: 'Not enough data yet. Start logging your weight and activities to get AI insights!' };
    }

    const weeksPassed = Math.floor(
      (new Date().getTime() - new Date(earliestLog[0].date).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );

    if (weeksPassed < 4) {
      return { 
        message: `Collecting data: ${4 - weeksPassed} more weeks needed for comprehensive AI analysis.` 
      };
    }

    // Step 2: Aggregate data from the last 4 weeks
    const endDate = new Date();
    const startDate = subDays(endDate, 28); // Last 4 weeks

    // Get weight data
    const { data: weightData } = await supabase
      .from('weight_logs')
      .select('weight, date')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .order('date', { ascending: true });

    // Get nutrition data
    const { data: foodData } = await supabase
      .from('food')
      .select('protein, calories, date')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString());

    // Get exercise data
    const { data: exerciseData } = await supabase
      .from('exercises')
      .select('exercise, weight, reps, sets, date')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString());

    // Get completion data
    const { data: completionData } = await supabase
      .from('daily_logs')
      .select('completed, item_type, date')
      .eq('user_id', userId)
      .gte('date', format(startDate, 'yyyy-MM-dd'));

    // Calculate aggregates
    const currentWeight = weightData && weightData.length > 0 
      ? weightData[weightData.length - 1].weight 
      : null;
    const startingWeight = weightData && weightData.length > 0 
      ? weightData[0].weight 
      : null;
    const weightChange = currentWeight && startingWeight 
      ? currentWeight - startingWeight 
      : null;

    const totalCalories = foodData?.reduce((sum, meal) => sum + (meal.calories || 0), 0) || 0;
    const totalProtein = foodData?.reduce((sum, meal) => sum + (meal.protein || 0), 0) || 0;
    const avgDailyCalories = totalCalories / 28;
    const avgDailyProtein = totalProtein / 28;

    const totalExercises = exerciseData?.length || 0;
    const strengthMetric = exerciseData?.reduce((sum, ex) => sum + (ex.weight * ex.sets * ex.reps), 0) || 0;

    const mealCompletions = completionData?.filter(log => log.item_type === 'meal' && log.completed).length || 0;
    const workoutCompletions = completionData?.filter(log => log.item_type === 'exercise' && log.completed).length || 0;
    const totalLogs = completionData?.length || 0;
    const completionRate = totalLogs > 0 ? ((mealCompletions + workoutCompletions) / totalLogs * 100) : 0;

    const aggregatedData = {
      timeframe: '4 weeks',
      weight: {
        current: currentWeight,
        starting: startingWeight,
        change: weightChange,
        goal: '210 lbs' // Could be made dynamic
      },
      nutrition: {
        avgDailyCalories: Math.round(avgDailyCalories),
        avgDailyProtein: Math.round(avgDailyProtein),
        totalMealsLogged: foodData?.length || 0
      },
      fitness: {
        totalExercises,
        strengthMetric: Math.round(strengthMetric),
        workoutCompletions
      },
      adherence: {
        completionRate: Math.round(completionRate),
        mealCompletions,
        workoutCompletions
      }
    };

    // Step 3: Send to OpenAI for analysis
    const prompt = `As a fitness coach, analyze this 4-week fitness progress data and provide insights:

${JSON.stringify(aggregatedData, null, 2)}

Goals: Reach 210 lbs weight, build strength, maintain consistent nutrition and exercise habits.

Provide a concise analysis covering:
1. Progress toward weight goal
2. Nutrition consistency and recommendations
3. Strength/fitness improvements
4. Adherence patterns
5. Specific actionable recommendations for next week

Keep response under 200 words and be encouraging but honest.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: 'You are a supportive fitness coach providing weekly progress analysis. Be encouraging, specific, and actionable.' 
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    return { 
      analysis: response.choices[0].message.content || 'Analysis completed but no content received.' 
    };

  } catch (error) {
    console.error('Error in weekly analysis:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to generate analysis' 
    };
  }
}