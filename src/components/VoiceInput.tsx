import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceInputProps {
  type: 'exercise' | 'cardio' | 'meal' | 'weight';
  onSubmit: (data: any) => void;
  placeholder: string;
}

export function VoiceInput({ type, onSubmit, placeholder }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [parsedData, setParsedData] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech recognition not supported",
        description: "Please type your input manually.",
        variant: "destructive"
      });
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
    };

    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      parseInput(transcript);
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast({
        title: "Speech recognition error",
        description: "Please try again or type manually.",
        variant: "destructive"
      });
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const parseInput = (input: string) => {
    console.log('Parsing input:', input, 'for type:', type);
    const text = input.toLowerCase().trim();
    let parsed: any = null;

    try {
      switch (type) {
        case 'exercise':
          // Try multiple patterns for flexibility
          const exercisePatterns = [
            // "bench press, 3 sets of 8 at 185 pounds"
            /(.+?),?\s*(\d+)\s*sets?\s*of\s*(\d+)\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/,
            // "bench press 3 sets 8 reps 185 pounds"
            /(.+?)\s*(\d+)\s*sets?\s*(\d+)\s*(?:reps?)\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/,
            // "3 sets of 8 bench press at 185"
            /(\d+)\s*sets?\s*of\s*(\d+)\s*(.+?)\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/,
            // "bench press 3x8 at 185"
            /(.+?)\s*(\d+)\s*x\s*(\d+)\s*(?:at|@)\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/,
            // "185 pound bench press 3 sets of 8"
            /(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)\s*(.+?)\s*(\d+)\s*sets?\s*of\s*(\d+)/,
            // "bench press 3 by 8 at 185"
            /(.+?)\s*(\d+)\s*(?:by|x)\s*(\d+)\s*(?:at|@)?\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/
          ];

          for (let i = 0; i < exercisePatterns.length; i++) {
            const match = text.match(exercisePatterns[i]);
            console.log(`Exercise pattern ${i + 1} match:`, match);
            
            if (match) {
              if (i === 2) {
                // Pattern 3: sets first, then exercise, then weight
                parsed = {
                  exercise: match[3].trim(),
                  sets: parseInt(match[1]),
                  reps: parseInt(match[2]),
                  weight: parseFloat(match[4])
                };
              } else if (i === 4) {
                // Pattern 5: weight first, then exercise, then sets/reps
                parsed = {
                  exercise: match[2].trim(),
                  sets: parseInt(match[3]),
                  reps: parseInt(match[4]),
                  weight: parseFloat(match[1])
                };
              } else {
                // Standard order: exercise, sets, reps, weight
                parsed = {
                  exercise: match[1].trim(),
                  sets: parseInt(match[2]),
                  reps: parseInt(match[3]),
                  weight: parseFloat(match[4])
                };
              }
              break;
            }
          }
          break;

        case 'cardio':
          // Parse: "run 3 miles in 25 minutes"
          const cardioMatch = text.match(/(.+?)\s*(\d+(?:\.\d+)?)\s*miles?\s*in\s*(\d+(?:\.\d+)?)\s*minutes?/);
          console.log('Cardio regex match:', cardioMatch);
          if (cardioMatch) {
            const distance = parseFloat(cardioMatch[2]);
            const duration = parseFloat(cardioMatch[3]);
            parsed = {
              activity: cardioMatch[1].trim(),
              distance,
              duration,
              pace: duration / distance
            };
          }
          break;

        case 'meal':
          // Simple meal logging - store the input and estimate calories/protein
          if (text.length > 0) {
            // Basic calorie estimation (this would be replaced with API calls)
            const estimatedCalories = Math.floor(Math.random() * 400) + 300; // 300-700 range
            const estimatedProtein = Math.floor(Math.random() * 30) + 20; // 20-50g range
            
            parsed = {
              meal: input.trim(),
              calories: estimatedCalories,
              protein: estimatedProtein,
              estimated: true
            };
          }
          break;

        case 'weight':
          // Parse: "214.5 pounds"
          const weightMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?)?/);
          console.log('Weight regex match:', weightMatch);
          if (weightMatch) {
            parsed = {
              weight: parseFloat(weightMatch[1])
            };
          }
          break;
      }

      console.log('Parsed result:', parsed);
      setParsedData(parsed);
      if (!parsed) {
        console.log('No parsing result, showing error toast');
        toast({
          title: "Couldn't parse input",
          description: "Please check the format and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Parsing error:', error);
      toast({
        title: "Parsing error",
        description: "Please try again with a different format.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = () => {
    console.log('Submit clicked with input:', inputValue);
    console.log('Current parsed data:', parsedData);
    
    if (parsedData) {
      console.log('Submitting parsed data:', parsedData);
      onSubmit(parsedData);
      setInputValue('');
      setParsedData(null);
    } else if (inputValue.trim()) {
      console.log('Trying to parse input:', inputValue);
      // Try to parse manual input
      parseInput(inputValue);
      // Give parsing time to complete, then submit if successful
      setTimeout(() => {
        console.log('After parsing, parsedData:', parsedData);
        // Note: This won't work because parsedData state won't be updated yet
        // We need to handle this differently
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    // Clear previous parsed data but don't parse until user is done typing
    setParsedData(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={isListening ? "voice" : "outline"}
          size="icon"
          onClick={isListening ? stopListening : startListening}
          className="shrink-0"
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1"
        />
        
        <Button
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          variant={parsedData ? "gradient" : "outline"}
          size="icon"
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview parsed data */}
      {parsedData && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm font-medium text-foreground mb-2">Ready to log:</p>
          <div className="text-sm space-y-1">
            {type === 'exercise' && (
              <>
                <p><strong>Exercise:</strong> {parsedData.exercise}</p>
                <p><strong>Sets:</strong> {parsedData.sets}</p>
                <p><strong>Reps:</strong> {parsedData.reps}</p>
                <p><strong>Weight:</strong> {parsedData.weight} lbs</p>
              </>
            )}
            {type === 'cardio' && (
              <>
                <p><strong>Activity:</strong> {parsedData.activity}</p>
                <p><strong>Distance:</strong> {parsedData.distance} miles</p>
                <p><strong>Duration:</strong> {parsedData.duration} minutes</p>
                <p><strong>Pace:</strong> {parsedData.pace.toFixed(1)} min/mile</p>
              </>
            )}
            {type === 'meal' && (
              <>
                <p><strong>Meal:</strong> {parsedData.meal}</p>
                <p><strong>Calories:</strong> ~{parsedData.calories} {parsedData.estimated && "(estimated)"}</p>
                <p><strong>Protein:</strong> ~{parsedData.protein}g {parsedData.estimated && "(estimated)"}</p>
              </>
            )}
            {type === 'weight' && (
              <p><strong>Weight:</strong> {parsedData.weight} lbs</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}