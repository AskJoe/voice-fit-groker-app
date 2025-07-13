import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface WeeklyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  weekStartsOn?: 0 | 1; // 0 for Sunday, 1 for Monday
}

export function WeeklyCalendar({ selectedDate, onDateSelect, weekStartsOn = 0 }: WeeklyCalendarProps) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const dayNames = weekStartsOn === 0 
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">
          Week of {format(weekStart, 'MMMM d, yyyy')}
        </h2>
      </div>
      
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <Card
            key={day.toISOString()}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:scale-105",
              isSameDay(day, selectedDate) 
                ? "ring-2 ring-white bg-white/20 backdrop-blur-sm border-white/30" 
                : "bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15",
              isToday(day) && "ring-1 ring-yellow-400"
            )}
            onClick={() => onDateSelect(day)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-white/70 text-xs font-medium mb-1">
                {dayNames[index]}
              </div>
              <div className={cn(
                "text-xl font-bold",
                isSameDay(day, selectedDate) ? "text-white" : "text-white/90"
              )}>
                {format(day, 'd')}
              </div>
              {isToday(day) && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  Today
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}