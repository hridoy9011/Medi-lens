import { cleanJsonAIResponse } from "@/lib/clean-json"
import type { HealthReportAnalysis } from "@/lib/types"

const GEMINI_API_KEY = ""
const MODEL_NAME = "gemini-3-flash-preview"
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`

/**
 * Handles communication with Gemini 3 Flash for health report analysis
 */
async function callGemini(contents: any[], isJsonResponse = false, retries = 3): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured")

  for (let attempt = 0; attempt < retries; attempt++) {
    const generationConfig: any = {
      temperature: 0.1,
      maxOutputTokens: 8192,
    }

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
        console.error(`[v0] Gemini API Error (attempt ${attempt + 1}/${retries}):`, data?.error?.message)

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

    if (action === "analyze-lab-report") {
      if (!imageUrl) {
        return Response.json({ success: false, error: "Image URL required" }, { status: 400 })
      }

      // Fetch image and convert to Base64
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) throw new Error(`Image fetch failed: ${imageResponse.statusText}`)

      const arrayBuffer = await imageResponse.arrayBuffer()
      const base64Image = Buffer.from(arrayBuffer).toString("base64")
      const mimeType = imageResponse.headers.get("content-type") || "image/jpeg"

      // Lab report analysis prompt
      const prompt = `You are a medical data analyst and nutrition expert. Analyze this blood test and medical lab report image VERY carefully.

CRITICAL INSTRUCTIONS:
1. Extract ALL test values with their reference ranges - be precise with numbers
2. Identify EVERY abnormality by comparing actual values to reference ranges
3. For EACH abnormality, determine severity and root cause
4. Generate DETAILED, SPECIFIC, ACTIONABLE diet recommendations tailored to the patient's specific test values
5. Return ONLY valid JSON with NO markdown, NO explanations, NO code blocks

Return this EXACT JSON structure:
{
  "rawText": "all extracted text from the report",
  "analysis": {
    "extractedData": {
      "patientName": "patient name or null",
      "testDate": "test date (YYYY-MM-DD format) or null",
      "labName": "lab name or null",
      "doctorName": "doctor name or null",
      "testResults": [
        {
          "testName": "test name (e.g., Hemoglobin)",
          "value": "numeric value or string",
          "normalRange": "normal range (e.g., 12.0-16.0)",
          "unit": "unit (e.g., g/dL)",
          "status": "normal or low or high or abnormal"
        }
      ]
    },
    "abnormalities": [
      {
        "testName": "test name",
        "abnormality": "detailed description of what is abnormal (e.g., 'Hemoglobin is 9.5 g/dL, which is 25% below normal range of 12.0-16.0')",
        "severity": "mild or moderate or severe",
        "possibleCauses": ["cause1", "cause2", "cause3"]
      }
    ],
    "dietRecommendations": [
      {
        "category": "specific food category (e.g., Iron-rich foods, High fiber foods, Vitamin supplements, Protein-rich foods, Low sodium foods, Healthy fats, Calcium-rich foods, Potassium-rich foods)",
        "foods": ["food1 (serving size)", "food2 (serving size)", "food3 (serving size)", "food4 (serving size)", "food5 (serving size)"],
        "servingFrequency": "how often to consume (e.g., 2-3 times per week, daily, 3-4 times per week)",
        "dietaryTip": "specific preparation method or consumption tip (e.g., 'Pair with vitamin C for better iron absorption', 'Cook in cast iron cookware')",
        "benefits": "detailed scientific explanation of how these foods help the specific abnormality - minimum 2-3 sentences",
        "reasonForAbnormality": "specific abnormality this addresses"
      }
    ],
    "overallHealthAssessment": "comprehensive health summary with specific dietary and lifestyle recommendations based on identified abnormalities. Include any foods to AVOID."
  }
}

CRITICAL REQUIREMENTS for dietRecommendations:
- MUST have minimum 1 recommendation per abnormality identified
- MUST include at least 5-6 specific foods per category with serving sizes
- MUST include serving frequency (daily/weekly)
- MUST include dietary tips for maximum absorption/effectiveness
- MUST include detailed benefits (2-3 sentences minimum)
- Generate 3-5 different dietary categories based on the abnormalities found
- Be SPECIFIC and ACTIONABLE - not generic

Example for low hemoglobin:
{
  "category": "Iron-rich foods",
  "foods": ["Red meat/beef (100g daily)", "Spinach (1 cup cooked daily)", "Lentils (½ cup cooked, 3x weekly)", "Fortified cereals (1 serving daily)", "Oysters (6-12 oysters, 2x weekly)"],
  "servingFrequency": "daily for best results",
  "dietaryTip": "Always consume iron-rich foods with orange juice or citrus fruits for 3x better absorption. Avoid tea/coffee with iron meals.",
  "benefits": "Iron is essential for hemoglobin production. These foods provide heme iron (meat) or non-heme iron (plant) that your body needs to increase oxygen-carrying capacity. Regular consumption can improve hemoglobin levels within 4-6 weeks.",
  "reasonForAbnormality": "Low hemoglobin (anemia) requires iron supplementation through diet"
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
