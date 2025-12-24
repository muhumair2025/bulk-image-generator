
export const parsePrompts = (input: string): string[] => {
  // Support formats: "1:", "Prompt 1:", "Prompt1:", "Prompt:", "- ", "1. ", "P1:"
  const markerRegex = /^(?:Prompt\s*\d+[:\s]|Prompt[:\s]|\d+[:\s]|\d+\.\s+|-\s+|P\d+[:\s])/i;
  
  const lines = input.split('\n');
  const prompts: string[] = [];
  let currentPrompt = "";

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine && !currentPrompt) continue;

    const match = line.match(markerRegex);
    if (match) {
      // If we were building a prompt, save it
      if (currentPrompt.trim()) {
        prompts.push(currentPrompt.trim());
      }
      // Start new prompt, removing the marker from the start of the line
      currentPrompt = line.substring(match[0].length).trim();
    } else {
      // It's a continuation line or the start of a prompt without a marker
      if (currentPrompt) {
        currentPrompt += "\n" + line;
      } else {
        if (trimmedLine) {
          currentPrompt = line;
        }
      }
    }
  }

  // Add the last one
  if (currentPrompt.trim()) {
    prompts.push(currentPrompt.trim());
  }

  // Fallback: If no markers were found, split by double newlines
  if (prompts.length === 0 && input.trim()) {
    const doubleNewlineSplit = input.split(/\n\s*\n/).map(p => p.trim()).filter(p => p);
    if (doubleNewlineSplit.length > 0) return doubleNewlineSplit;
  }

  return prompts;
};
