import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Dumbbell, 
  Heart, 
  Apple, 
  Scale, 
  Target,
  TrendingUp,
  Trophy,
  Activity,
  LogOut
} from 'lucide-react';
import { VoiceInput } from './VoiceInput';
import { ProgressChart } from './ProgressChart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface WorkoutLog {
  id: string;
  type: 'exercise' | 'cardio' | 'meal' | 'weight';
  data: any;
  date: Date;
}

interface FitnessTrackerProps {
  user: User;
  onSignOut: () => void;
}

export function FitnessTracker({ user, onSignOut }: FitnessTrackerProps) {
  const [activeTab, setActiveTab] = useState('log');
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [currentWeight, setCurrentWeight] = useState(216);
  const [targetWeight] = useState(210);
  const { toast } = useToast();

  // Load data from Supabase on component mount
  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load weight logs
      const { data: weightLogs } = await supabase
        .from('weight_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(1);

      if (weightLogs && weightLogs.length > 0) {
        setCurrentWeight(weightLogs[0].weight);
      }

      // Load all logs for display
      const [exercises, cardio, food, weights] = await Promise.all([
        supabase.from('exercises').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('cardio').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('food').select('*').eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('weight_logs').select('*').eq('user_id', user.id).order('date', { ascending: false })
      ]);

      const allLogs: WorkoutLog[] = [
        ...(exercises.data || []).map(e => ({ id: e.id, type: 'exercise' as const, data: e, date: new Date(e.date) })),
        ...(cardio.data || []).map(c => ({ id: c.id, type: 'cardio' as const, data: c, date: new Date(c.date) })),
        ...(food.data || []).map(f => ({ id: f.id, type: 'meal' as const, data: f, date: new Date(f.date) })),
        ...(weights.data || []).map(w => ({ id: w.id, type: 'weight' as const, data: w, date: new Date(w.date) }))
      ].sort((a, b) => b.date.getTime() - a.date.getTime());

      setLogs(allLogs);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast({
        title: "Error",
        description: "Failed to load your data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addLog = async (type: WorkoutLog['type'], data: any) => {
    if (!user) return;

    try {
      let result;
      const baseData = { user_id: user.id, ...data };

      switch (type) {
        case 'exercise':
          result = await supabase.from('exercises').insert(baseData).select().single();
          break;
        case 'cardio':
          result = await supabase.from('cardio').insert(baseData).select().single();
          break;
        case 'meal':
          result = await supabase.from('food').insert({ user_id: user.id, meal: data.meal, calories: data.calories, protein: data.protein }).select().single();
          break;
        case 'weight':
          result = await supabase.from('weight_logs').insert({ user_id: user.id, weight: data.weight }).select().single();
          setCurrentWeight(data.weight);
          break;
      }

      if (result.error) throw result.error;

      const newLog: WorkoutLog = {
        id: result.data.id,
        type,
        data: result.data,
        date: new Date(result.data.date)
      };
      
      setLogs(prev => [newLog, ...prev]);
      
      toast({
        title: "Success!",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} logged successfully.`,
      });

      // Update presets for learning
      await updatePresets(type, data);
    } catch (error) {
      console.error('Error saving log:', error);
      toast({
        title: "Error",
        description: "Failed to save your log. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updatePresets = async (type: WorkoutLog['type'], data: any) => {
    if (!user || type === 'weight') return;

    try {
      const name = type === 'exercise' ? data.exercise : type === 'cardio' ? data.activity : data.meal;
      const details = type === 'meal' ? { calories: data.calories, protein: data.protein } : data;

      // Check if preset exists
      const { data: existingPreset } = await supabase
        .from('presets')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', type === 'meal' ? 'meal' : 'exercise')
        .eq('name', name)
        .single();

      if (existingPreset) {
        // Increment usage count
        await supabase
          .from('presets')
          .update({ usage_count: existingPreset.usage_count + 1 })
          .eq('id', existingPreset.id);
      } else {
        // Create new preset
        await supabase
          .from('presets')
          .insert({
            user_id: user.id,
            type: type === 'meal' ? 'meal' : 'exercise',
            name,
            details
          });
      }
    } catch (error) {
      console.error('Error updating presets:', error);
    }
  };

  const weightProgress = ((216 - currentWeight) / (216 - targetWeight)) * 100;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">FitTracker</h1>
            <p className="text-white/80">Welcome back, {user.email?.split('@')[0]}!</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSignOut}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-1" />
            Sign Out
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Scale className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{currentWeight}</p>
              <p className="text-white/80 text-sm">Current</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{targetWeight}</p>
              <p className="text-white/80 text-sm">Target</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{Math.max(0, 216 - currentWeight).toFixed(1)}</p>
              <p className="text-white/80 text-sm">Lost (lbs)</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{logs.filter(l => l.type === 'exercise').length}</p>
              <p className="text-white/80 text-sm">Workouts</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="log" className="data-[state=active]:bg-white data-[state=active]:text-primary">
              Log Activity
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:text-primary">
              Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Exercise Logging */}
              <Card className="bg-white shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    Log Exercise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceInput 
                    type="exercise"
                    onSubmit={(data) => addLog('exercise', data)}
                    placeholder="Say: 'Bench press, 3 sets of 8 at 185 pounds'"
                  />
                </CardContent>
              </Card>

              {/* Cardio Logging */}
              <Card className="bg-white shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-destructive" />
                    Log Cardio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceInput 
                    type="cardio"
                    onSubmit={(data) => addLog('cardio', data)}
                    placeholder="Say: 'Run 3 miles in 25 minutes'"
                  />
                </CardContent>
              </Card>

              {/* Meal Logging */}
              <Card className="bg-white shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Apple className="h-5 w-5 text-accent" />
                    Log Meal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceInput 
                    type="meal"
                    onSubmit={(data) => addLog('meal', data)}
                    placeholder="Say: 'Chicken breast and rice'"
                  />
                </CardContent>
              </Card>

              {/* Weight Logging */}
              <Card className="bg-white shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-secondary" />
                    Log Weight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <VoiceInput 
                    type="weight"
                    onSubmit={(data) => addLog('weight', data)}
                    placeholder="Say: '214.5 pounds'"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <div className="grid gap-6">
              {/* Weight Progress */}
              <Card className="bg-white shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Weight Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span>Current: {currentWeight} lbs</span>
                      <span>Target: {targetWeight} lbs</span>
                    </div>
                    <Progress value={Math.min(100, Math.max(0, weightProgress))} className="h-3" />
                    <p className="text-sm text-muted-foreground text-center">
                      {weightProgress >= 100 ? "🎉 Goal achieved!" : `${(6 - (216 - currentWeight)).toFixed(1)} lbs to go!`}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Chart */}
              <Card className="bg-white shadow-card">
                <CardHeader>
                  <CardTitle>Weight Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProgressChart logs={logs.filter(l => l.type === 'weight')} />
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="bg-white shadow-card">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {logs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          {log.type === 'exercise' && <Dumbbell className="h-4 w-4 text-primary" />}
                          {log.type === 'cardio' && <Heart className="h-4 w-4 text-destructive" />}
                          {log.type === 'meal' && <Apple className="h-4 w-4 text-accent" />}
                          {log.type === 'weight' && <Scale className="h-4 w-4 text-secondary" />}
                          <span className="font-medium capitalize">{log.type}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {log.date.toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {logs.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        No activity logged yet. Start by logging your first workout!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}