import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { parseInput, ParsedData } from '@/utils/inputParsers';
import { VoiceInputPreview } from '@/components/VoiceInputPreview';

interface VoiceInputProps {
  type: 'exercise' | 'cardio' | 'meal' | 'weight';
  onSubmit: (data: any) => void;
  placeholder: string;
}

export function VoiceInput({ type, onSubmit, placeholder }: VoiceInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const { toast } = useToast();
  const { isListening, startListening, stopListening } = useSpeechRecognition();

  const handleParseInput = (input: string) => {
    const parsed = parseInput(input, type);
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
  };

  const handleVoiceResult = (transcript: string) => {
    setInputValue(transcript);
    handleParseInput(transcript);
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
      handleParseInput(inputValue);
      
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
          onClick={isListening ? stopListening : () => startListening(handleVoiceResult)}
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
        <VoiceInputPreview type={type} parsedData={parsedData} />
      )}
    </div>
  );
}