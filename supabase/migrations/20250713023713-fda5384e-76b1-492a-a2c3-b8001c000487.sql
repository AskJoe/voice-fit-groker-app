-- Create daily_logs table to track completed and modified items
CREATE TABLE public.daily_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  item_type TEXT NOT NULL, -- 'meal' or 'exercise'
  item_id UUID NOT NULL, -- references meal_plans.id or workout_plans.id  
  completed BOOLEAN NOT NULL DEFAULT false,
  modified_details JSONB, -- stores any modifications user made
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, item_type, item_id)
);

-- Enable Row Level Security
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_logs
CREATE POLICY "Users can view their own daily logs" 
ON public.daily_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily logs" 
ON public.daily_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily logs" 
ON public.daily_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily logs" 
ON public.daily_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_logs_updated_at
BEFORE UPDATE ON public.daily_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();