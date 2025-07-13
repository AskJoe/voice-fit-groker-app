import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Scale, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { format } from 'date-fns';

interface WeightEntryProps {
  user: User;
  selectedDate: Date;
  onWeightSaved?: () => void;
}

export function WeightEntry({ user, selectedDate, onWeightSaved }: WeightEntryProps) {
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleSaveWeight = async () => {
    if (!weight.trim()) {
      toast({
        title: "Error",
        description: "Please enter a weight value.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // Check if weight already exists for this date
      const { data: existingWeight } = await supabase
        .from('weight_logs')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();

      if (existingWeight) {
        // Update existing weight
        const { error } = await supabase
          .from('weight_logs')
          .update({ weight: parseFloat(weight) })
          .eq('id', existingWeight.id);

        if (error) throw error;
      } else {
        // Insert new weight
        const { error } = await supabase
          .from('weight_logs')
          .insert({
            user_id: user.id,
            date: dateStr,
            weight: parseFloat(weight)
          });

        if (error) throw error;
      }

      toast({
        title: "Weight saved!",
        description: `Weight recorded for ${format(selectedDate, 'MMMM d, yyyy')}`,
      });

      setWeight('');
      setIsOpen(false);
      onWeightSaved?.();
    } catch (error) {
      console.error('Error saving weight:', error);
      toast({
        title: "Error",
        description: "Failed to save weight. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="bg-white/10 border-white/20 text-white hover:bg-white/20"
        >
          <Scale className="w-4 h-4 mr-2" />
          Log Weight
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Log Weight for {format(selectedDate, 'MMMM d, yyyy')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Weight (lbs)</label>
            <Input
              type="number"
              step="0.1"
              placeholder="Enter your weight"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4 mr-1" />
            Cancel
          </Button>
          <Button onClick={handleSaveWeight} disabled={loading}>
            <Save className="h-4 w-4 mr-1" />
            {loading ? 'Saving...' : 'Save Weight'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}