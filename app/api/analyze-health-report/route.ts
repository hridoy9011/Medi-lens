import { cleanJsonAIResponse } from "@/lib/clean-json"
import type { HealthReportAnalysis } from "@/lib/types"
import { NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
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

        // Handle 429 (Rate Limit) and 503 (Overloaded) with exponential backoff
        if ((response.status === 429 || response.status === 503) && attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 4000
          console.log(`[v0] API limited or overloaded (Health Report). Waiting ${delay / 1000}s before retry...`)
          await new Promise((resolve) => setTimeout(resolve, delay))
          continue
        }

        const errorMsg = data?.error?.message || "Gemini API Analysis Failed"
        if (response.status === 429) {
          throw new Error("Analysis is temporarily unavailable due to high demand (Rate Limit). Please wait a few seconds and try again.")
        }
        throw new Error(errorMsg)
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("Empty response from AI")
      return text
    } catch (error: any) {
      console.error(`[v0] Gemini Health Fetch Catch (attempt ${attempt + 1}/${retries}):`, error.message)
      if (attempt === retries - 1) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  throw new Error("Service unavailable after maximum retries. Please try again in a moment.")
}

async function validateMedicalReport(base64Image: string, mimeType: string): Promise<{ isValid: boolean; message: string }> {
  const validationPrompt = `Is this image a medical laboratory test report or health report? A valid medical report should contain:
- Lab test results with values
- Test parameters and reference ranges
- Lab name or medical facility information
- Patient information

Answer with ONLY "YES" or "NO" followed by a brief reason (one sentence).`

  try {
    const resultText = await callGemini(
      [
        {
          parts: [
            { text: validationPrompt },
            { inline_data: { mime_type: mimeType, data: base64Image } },
          ],
        },
      ],
      false,
    )

    const isValid = resultText.trim().toUpperCase().startsWith("YES")
    return {
      isValid,
      message: isValid ? "Valid medical report detected" : resultText.replace(/^NO[:\s]*/i, "").trim()
    }
  } catch (error) {
    console.error("[v0] Validation error:", error)
    // On validation error, allow processing to continue (fail open)
    return { isValid: true, message: "Validation check skipped due to error" }
  }
}

export async function POST(request: Request) {
  console.log("[v0] POST /api/analyze-health-report started")
  try {
    const { action, imageUrl } = await request.json()
    console.log(`[v0] Health Action: ${action}, Image provided: ${!!imageUrl}`)

    if (action === "analyze-lab-report") {
      if (!imageUrl) {
        return NextResponse.json({ success: false, error: "Image URL required" }, { status: 400 })
      }

      let base64Image = ""
      let mimeType = "image/jpeg"

      if (imageUrl.startsWith("data:")) {
        console.log("[v0] Handling health data URL directly")
        const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/)
        if (matches) {
          mimeType = matches[1]
          base64Image = matches[2]
        } else {
          throw new Error("Invalid data URL format")
        }
      } else {
        console.log("[v0] Fetching health image from URL:", imageUrl.substring(0, 50) + "...")
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) throw new Error(`Image fetch failed: ${imageResponse.statusText}`)

        const arrayBuffer = await imageResponse.arrayBuffer()
        base64Image = Buffer.from(arrayBuffer).toString("base64")
        mimeType = imageResponse.headers.get("content-type") || "image/jpeg"
      }

      console.log("[v0] Starting unified health report analysis...")

      // Lab report analysis prompt
      const prompt = `Analyze this medical laboratory test report carefully and return a valid JSON response. Follow these steps:

1. VALIDATION: Check if this is a valid medical laboratory report.
   - If NOT a valid report, return ONLY: {"is_valid": false, "validation_error": "Reason why it's invalid"}

2. FULL ANALYSIS (Only if valid):
   - Extract raw text.
   - Extract patient info, date, lab/doctor name.
   - Extract ALL test results (values, ranges, units).
   - Identify abnormalities and generate dietary recommendations.

Return ONLY this JSON structure (no markdown, no backticks):
{
  "is_valid": true,
  "rawText": "all extracted text",
  "analysis": {
    "extractedData": {
      "patientName": "Name or null",
      "testDate": "YYYY-MM-DD or null",
      "labName": "Lab or null",
      "doctorName": "Doctor or null",
      "testResults": [
        { "testName": "Hemoglobin", "value": "12.5", "normalRange": "13.5-17.5", "unit": "g/dL", "status": "low" }
      ]
    },
    "abnormalities": [
      { "testName": "Hemoglobin", "abnormality": "13% below range", "severity": "mild", "possibleCauses": ["Iron deficiency"] }
    ],
    "dietRecommendations": [
      {
        "category": "Iron-rich foods",
        "foods": ["Red meat", "Spinach"],
        "servingFrequency": "daily",
        "dietaryTip": "Pair with Vitamin C",
        "benefits": "Helps increase iron absorption to boost hemoglobin levels.",
        "reasonForAbnormality": "Anemia/Low Hemoglobin"
      }
    ],
    "overallHealthAssessment": "Comprehensive summary of health findings."
  }
}

CRITICAL: 
- For dietRecommendations, provide at least 5 specific foods per category.
- Scientific explanation for benefits should be 2-3 sentences.`

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
      console.log("[v0] AI Analysis complete")
      const parsed = cleanJsonAIResponse(resultText)
      if (!parsed) {
        console.error("[v0] Failed to parse JSON response:", resultText)
        return NextResponse.json({ success: false, error: "Failed to parse AI response. Please try again." }, { status: 500 })
      }

      if (parsed.is_valid === false) {
        console.log("[v0] Health Validation failed:", parsed.validation_error)
        return NextResponse.json({
          success: false,
          error: "Invalid image type",
          details: "This doesn't appear to be a valid medical laboratory report. Please upload a medical report image.",
          validationMessage: parsed.validation_error
        }, { status: 400 })
      }

      console.log("[v0] Analysis successful")
      return NextResponse.json({ success: true, data: parsed })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Route error:", error.message)
    return NextResponse.json({ success: false, error: error.message || "Internal error" }, { status: 500 })
  }
}
