export function cleanJsonAIResponse(text: string): any {
  if (!text) return null;

  try {
    // Step 1: Remove common AI "garbage" prefixes found in 2026 models
    let cleaned = text.replace(/^(ny\n|shamefully.*\n|thought\n)/i, "").trim();
    
    // Step 2: Remove Markdown blocks
    cleaned = cleaned.replace(/```json|```/g, "").trim();

    // Step 3: Try to parse the cleaned string
    return JSON.parse(cleaned);
  } catch (e) {
    // Step 4: Final extraction using the "Brace Hunt" method
    // Find the first opening brace and try to match it with a closing brace
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1 && end > start) {
      const jsonCandidate = text.substring(start, end + 1);
      try {
        return JSON.parse(jsonCandidate);
      } catch (innerError) {
        console.error("[v0] Deep Parse Failed. Raw Text received:", text.substring(0, 500));
      }
    }
  }
  return null;
}
