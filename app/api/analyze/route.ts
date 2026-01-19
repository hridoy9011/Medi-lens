import { cleanJsonAIResponse } from "@/lib/clean-json"
import type { ExtractedData, AuthenticityResult, DrugInteraction, AnalysisAction } from "@/lib/types"

// API Configuration - Gemini 3 Flash Preview (v1beta endpoint)
const GEMINI_API_KEY = ""
const MODEL_NAME = "gemini-3-flash-preview"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`

/**
 * Handles communication with Gemini 3 Flash via v1beta API
 * Safe mode: removed thinking_config temporarily, focusing on stable JSON output
 */
async function callGemini(contents: any[], isJsonResponse = false, retries = 3): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured")

  for (let attempt = 0; attempt < retries; attempt++) {
    const generationConfig: any = {
      temperature: 0.1,
      maxOutputTokens: 8192,
    }

    // v1beta API supports response_mime_type for structured JSON
    if (isJsonResponse) {
      generationConfig.response_mime_type = "application/json"
    }

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("[v0] Gemini API Error (attempt ${attempt + 1}/${retries}):", data?.error?.message)
        
        // Handle 503 (Overloaded) with exponential backoff
        if (response.status === 503 && attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 3000
          console.log(`[v0] Model overloaded. Waiting ${delay / 1000}s before retry...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }
        
        throw new Error(data?.error?.message || "Gemini API Analysis Failed")
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("Empty response from AI")
      return text
    } catch (error: any) {
      if (attempt === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error("Service unavailable after maximum retries. Please try again in a moment.")
}

export async function POST(request: Request) {
  try {
    const { action, imageUrl } = await request.json()

    if (action === "analyze-full") {
      if (!imageUrl) {
        return Response.json({ success: false, error: "Image URL required" }, { status: 400 })
      }

      // Fetch image and convert to Base64
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) throw new Error(`Image fetch failed: ${imageResponse.statusText}`)

      const arrayBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(arrayBuffer).toString("base64")
      const mimeType = imageResponse.headers.get("content-type") || "image/jpeg"

      // Prescription analysis prompt
      const prompt = `Analyze this medical prescription image carefully. Extract and return ONLY valid JSON with this exact structure:
{
  "rawText": "all extracted text from the prescription",
  "extracted": {
    "doctor": "doctor name or null",
    "hospital": "hospital/clinic name or null",
    "date": "prescription date (YYYY-MM-DD format) or null",
    "medicines": [{"name": "medicine name", "dose": "dosage or null", "frequency": "usage instructions or null"}]
  },
  "authenticity": {
    "status": "genuine or suspicious or fake",
    "reasons": ["reason 1", "reason 2"]
  },
  "interactions": [
    {"drug_a": "medicine name", "drug_b": "medicine name", "severity": "mild or moderate or severe", "description": "interaction description"}
  ]
}`

      // Request analysis
      const resultText = await callGemini(
        [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Image } },
            ],
          },
        ],
        true,
      )

      // Parse and return
      console.log("[v0] AI Response (first 500 chars):", resultText.substring(0, 500))
      const parsed = cleanJsonAIResponse(resultText)
      if (!parsed) {
        console.error("[v0] Failed to parse JSON response:", resultText)
        return Response.json({ success: false, error: "Failed to parse AI response. Please try again." }, { status: 500 })
      }

      return Response.json({ success: true, data: parsed })
    }

    return Response.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Route error:", error.message)
    return Response.json({ success: false, error: error.message || "Internal error" }, { status: 500 })
  }
}
