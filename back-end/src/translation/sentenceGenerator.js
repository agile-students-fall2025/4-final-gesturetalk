import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dummySignedWords = ["HELLO", "MY", "NAME", "IVA"];

// load .env from the back-end package root
dotenv.config({ path: path.join(__dirname, '../../.env') });

const joinWords = (signedWords) => {
  return signedWords.join(" ");
}

(async function main() {
  try {
    console.log("OPENROUTER_API_KEY:", process.env.OPENROUTER_API_KEY ? "set" : "unset");
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL,
        messages: [
          { role: "system", content: "You are an ASL-to-English translator. Given a list of glossed signs, output a natural, grammatically correct English sentence.", },
          { role: "user", content: joinWords(dummySignedWords) }
        ],
      }),
    });

    console.log("HTTP", response.status, response.statusText);
    const data = await response.json();
    console.log("raw response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("API returned an error:", data);
      return;
    }

    const sentence = data.choices?.[0]?.message?.content?.trim();
    if (!sentence) {
      console.error("No sentence found in response. Check the response shape above.");
      return;
    }
    console.log(sentence);
  } catch (err) {
    console.error("Fetch or parsing error:", err);
  }
})();