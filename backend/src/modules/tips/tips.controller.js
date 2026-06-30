import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dailyCache = {
  date: null,
  tip: null
};

export const getDailyTip = async (req, res) => {
  try {
    // Current date string in local timezone (or UTC). UTC is safer for strict day boundaries.
    const today = new Date().toISOString().split('T')[0];
    
    // Return cached tip for the day
    if (dailyCache.date === today && dailyCache.tip) {
      return res.status(200).json({ success: true, data: dailyCache.tip });
    }

    let tip = null;
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");
      
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `You are an expert programming mentor. Generate one educational coding tip in JSON format only.

{
  "title": "",
  "category": "",
  "difficulty": "",
  "tip": "",
  "practiceQuestion": "",
  "emoji": ""
}

Rules:
- Tip should be 20–40 words.
- Beginner to intermediate friendly.
- Topics may include DSA, Algorithms, Java, SQL, DBMS, OS, CN, React, JavaScript, Git, Linux, Node.js, or Interview Tips.
- Return ONLY valid JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json'
        }
      });
      
      const text = response.text;
      tip = JSON.parse(text);
      
    } catch (apiError) {
      console.error("Gemini API failed, falling back to local tips:", apiError);
      
      // Fallback
      const fallbackPath = path.join(__dirname, '../../data/fallback_tips.json');
      const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      const randomIdx = Math.floor(Math.random() * fallbackData.length);
      tip = fallbackData[randomIdx];
    }
    
    // Update Cache
    dailyCache = {
      date: today,
      tip: tip
    };
    
    return res.status(200).json({ success: true, data: tip });
    
  } catch (error) {
    console.error("Error in getDailyTip:", error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
