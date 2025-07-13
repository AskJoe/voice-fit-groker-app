-- Update the secret name for the OpenAI API key to be consistent with the edge function
UPDATE vault.secrets 
SET name = 'OPENAI_API_KEY' 
WHERE name = 'VITE_OPENAI_API_KEY';