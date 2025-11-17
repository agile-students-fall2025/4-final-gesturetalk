import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env from the project root (two levels up from /src)
dotenv.config({ path: path.join(__dirname, "../../.env") });

const joinWords = (signedWords) => signedWords.join(" ");

export async function generateSentenceFromSigns(signedWords) {
  const content = joinWords(signedWords);

  console.log("OPENROUTER_API_KEY set?", !!process.env.OPENROUTER_API_KEY);
  console.log("OPENROUTER_MODEL:", process.env.OPENROUTER_MODEL);

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: process.env.OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an ASL-to-English translator. Given a list of glossed signs, output a natural, grammatically correct English sentence. Make sure to correct capitalization.",
          },
          { role: "user", content },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
      }
    );

    const data = response.data;
    const sentence = data.choices?.[0]?.message?.content?.trim();

    if (!sentence) {
      console.error("No sentence found in OpenRouter response:", data);
      throw new Error("No sentence found in OpenRouter response");
    }

    return sentence;
  } catch (err) {
    console.error("OpenRouter error status:", err.response?.status);
    console.error("OpenRouter error data:", err.response?.data || err.message);
    throw err;
  }
}
