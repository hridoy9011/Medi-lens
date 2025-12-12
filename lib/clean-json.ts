// Universal JSON cleaner for AI responses with truncation recovery

export function cleanJsonAIResponse<T>(raw: string): T | null {
  let text = raw.trim()

  // Remove markdown code blocks
  text = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .replace(/[\u0000-\u001F]+/g, "")
    .trim()

  // First try direct parse
  try {
    return JSON.parse(text) as T
  } catch (err) {
    // Try to recover truncated JSON
    const recovered = tryRecoverTruncatedJson(text)
    if (recovered) {
      try {
        return JSON.parse(recovered) as T
      } catch {
        // Continue to other recovery methods
      }
    }

    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T
      } catch {
        // Try recovery on extracted match
        const recoveredMatch = tryRecoverTruncatedJson(jsonMatch[0])
        if (recoveredMatch) {
          try {
            return JSON.parse(recoveredMatch) as T
          } catch {
            // Fall through
          }
        }
      }
    }

    console.error("JSON parse failure:", text.substring(0, 500))
    return null
  }
}

function tryRecoverTruncatedJson(text: string): string | null {
  // Count brackets to detect truncation
  let braceCount = 0
  let bracketCount = 0
  let inString = false
  let escaped = false

  for (const char of text) {
    if (escaped) {
      escaped = false
      continue
    }
    if (char === "\\") {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) continue

    if (char === "{") braceCount++
    if (char === "}") braceCount--
    if (char === "[") bracketCount++
    if (char === "]") bracketCount--
  }

  // If unbalanced, try to close
  if (braceCount > 0 || bracketCount > 0) {
    let recovered = text

    // If we're in the middle of a string, close it
    if (inString) {
      recovered += '"'
    }

    // Remove incomplete last property/element
    // Find last complete structure
    const lastCompleteComma = recovered.lastIndexOf(",")
    const lastCompleteBrace = recovered.lastIndexOf("}")
    const lastCompleteBracket = recovered.lastIndexOf("]")

    // If the last comma is after any closing bracket/brace, truncate there
    if (lastCompleteComma > Math.max(lastCompleteBrace, lastCompleteBracket)) {
      recovered = recovered.substring(0, lastCompleteComma)
    }

    // Close remaining brackets/braces
    while (bracketCount > 0) {
      recovered += "]"
      bracketCount--
    }
    while (braceCount > 0) {
      recovered += "}"
      braceCount--
    }

    return recovered
  }

  return null
}
