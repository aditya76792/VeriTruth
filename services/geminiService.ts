
import { GoogleGenAI } from "@google/genai";
import { VerificationResult, Verdict, SearchGroundingChunk } from "../types";

// Always initialize a fresh instance to ensure the latest API key is used
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const verifyContent = async (text: string, imageData?: string): Promise<VerificationResult> => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    You are a professional fact-checker specializing in viral misinformation, specifically WhatsApp forwards.
    
    CONTENT TO VERIFY:
    "${text || 'Analyzing attached image...'}"
    
    TASK:
    1. Research this claim using Google Search to find credible news sources, official statements, and peer-reviewed data.
    2. Provide a VERDICT from this specific list: True, Mostly True, Mixed, Misleading, False.
    3. Calculate a TRUST SCORE (0-100).
    4. Write a concise, bulleted EXPLANATION of why the claim is true or false.
    5. Be critical of "Forwarded many times" style messages.
    
    FORMAT YOUR RESPONSE AS FOLLOWS:
    VERDICT: [Verdict]
    SCORE: [Score]
    EXPLANATION: [Brief summary]
    DETAILS: [Bullet points of evidence]
    
    Do not use JSON. Use the format above.
  `;

  const contents: any[] = [{ text: prompt }];
  
  if (imageData) {
    contents.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData.split(',')[1]
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: contents },
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1,
      },
    });

    const resultText = response.text || "Unable to generate verification.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as SearchGroundingChunk[] || [];
    
    // Extract sources from grounding metadata
    const sources = chunks
      .filter(chunk => chunk.web)
      .map(chunk => ({
        title: chunk.web!.title || 'Verified Source',
        url: chunk.web!.uri
      }));

    // Parse the semi-structured text response
    let verdict: Verdict = 'Unverified';
    let score = 50;
    
    const verdictMatch = resultText.match(/VERDICT:\s*(True|Mostly True|Mixed|Misleading|False)/i);
    const scoreMatch = resultText.match(/SCORE:\s*(\d+)/i);
    
    if (verdictMatch) verdict = verdictMatch[1] as Verdict;
    if (scoreMatch) score = parseInt(scoreMatch[1], 10);

    // Fallback logic for verdict if parsing fails
    if (verdict === 'Unverified') {
      const lowerText = resultText.toLowerCase();
      if (lowerText.includes('mostly true')) verdict = 'Mostly True';
      else if (lowerText.includes('misleading')) verdict = 'Misleading';
      else if (lowerText.includes('false') || lowerText.includes('fake')) verdict = 'False';
      else if (lowerText.includes('true')) verdict = 'True';
      else verdict = 'Mixed';
    }

    return {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      content: text,
      image: imageData,
      verdict,
      score,
      explanation: resultText,
      sources: sources.slice(0, 5) // Limit to top 5 sources
    };
  } catch (error) {
    console.error("Verification Error:", error);
    throw error;
  }
};
