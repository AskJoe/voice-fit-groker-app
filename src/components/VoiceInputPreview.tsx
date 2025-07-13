import React from 'react';
import { ParsedData, ParsedExercise, ParsedCardio, ParsedMeal, ParsedWeight } from '@/utils/inputParsers';

interface VoiceInputPreviewProps {
  type: 'exercise' | 'cardio' | 'meal' | 'weight';
  parsedData: ParsedData;
}

export function VoiceInputPreview({ type, parsedData }: VoiceInputPreviewProps) {
  return (
    <div className="p-3 bg-muted rounded-lg">
      <p className="text-sm font-medium text-foreground mb-2">Ready to log:</p>
      <div className="text-sm space-y-1">
        {type === 'exercise' && (
          <>
            <p><strong>Exercise:</strong> {(parsedData as ParsedExercise).exercise}</p>
            <p><strong>Sets:</strong> {(parsedData as ParsedExercise).sets}</p>
            <p><strong>Reps:</strong> {(parsedData as ParsedExercise).reps}</p>
            <p><strong>Weight:</strong> {(parsedData as ParsedExercise).weight} lbs</p>
          </>
        )}
        {type === 'cardio' && (
          <>
            <p><strong>Activity:</strong> {(parsedData as ParsedCardio).activity}</p>
            <p><strong>Distance:</strong> {(parsedData as ParsedCardio).distance} miles</p>
            <p><strong>Duration:</strong> {(parsedData as ParsedCardio).duration} minutes</p>
            <p><strong>Pace:</strong> {(parsedData as ParsedCardio).pace.toFixed(1)} min/mile</p>
          </>
        )}
        {type === 'meal' && (
          <>
            <p><strong>Meal:</strong> {(parsedData as ParsedMeal).meal}</p>
            <p><strong>Calories:</strong> ~{(parsedData as ParsedMeal).calories} {(parsedData as ParsedMeal).estimated && "(estimated)"}</p>
            <p><strong>Protein:</strong> ~{(parsedData as ParsedMeal).protein}g {(parsedData as ParsedMeal).estimated && "(estimated)"}</p>
          </>
        )}
        {type === 'weight' && (
          <p><strong>Weight:</strong> {(parsedData as ParsedWeight).weight} lbs</p>
        )}
      </div>
    </div>
  );
}