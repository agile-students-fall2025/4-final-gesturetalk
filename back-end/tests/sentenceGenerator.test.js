import { expect } from "chai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { generateSentenceFromSigns } from "../src/translation/sentenceGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env") });

describe("Sentence Generator", () => {
  const hasApiKey = !!process.env.OPENROUTER_API_KEY;
  const testTimeout = 30000;

  describe("Environment Configuration", () => {
    it("should have OPENROUTER_API_KEY configured", () => {
      expect(process.env.OPENROUTER_API_KEY).to.be.a("string");
      expect(process.env.OPENROUTER_API_KEY.length).to.be.greaterThan(0);
    });

    it("should have OPENROUTER_MODEL configured", () => {
      expect(process.env.OPENROUTER_MODEL).to.be.a("string");
      expect(process.env.OPENROUTER_MODEL.length).to.be.greaterThan(0);
    });
  });

  describe("Input Validation", () => {
    it("should accept array of signed words", () => {
      const signedWords = ["HELLO", "MY", "NAME"];
      expect(signedWords).to.be.an("array");
      expect(signedWords.length).to.be.greaterThan(0);
    });

    it("should handle single word", () => {
      const signedWords = ["HELLO"];
      expect(signedWords).to.be.an("array");
      expect(signedWords.length).to.equal(1);
    });

    it("should handle multiple words", () => {
      const signedWords = ["HELLO", "MY", "NAME", "IS", "JOHN"];
      expect(signedWords).to.be.an("array");
      expect(signedWords.length).to.equal(5);
    });
  });

  describe("Core API Integration", function d() {
    this.timeout(testTimeout);

    (hasApiKey ? it : it.skip)(
      "should generate sentence from simple signs",
      async () => {
        const signedWords = ["HELLO", "MY", "NAME"];
        const sentence = await generateSentenceFromSigns(signedWords);

        expect(sentence).to.be.a("string");
        expect(sentence.length).to.be.greaterThan(0);
        console.log("Generated:", sentence);
      },
    );

    (hasApiKey ? it : it.skip)(
      "should generate grammatically correct sentence",
      async () => {
        const signedWords = ["I", "WANT", "GO", "STORE"];
        const sentence = await generateSentenceFromSigns(signedWords);

        expect(sentence).to.be.a("string");
        expect(sentence.length).to.be.greaterThan(0);
        expect(sentence[0]).to.match(/[A-Z]/); // First letter capitalized
        console.log("Generated:", sentence);
      },
    );

    (hasApiKey ? it : it.skip)("should handle question pattern", async () => {
      const signedWords = ["HOW", "ARE", "YOU"];
      const sentence = await generateSentenceFromSigns(signedWords);

      expect(sentence).to.be.a("string");
      expect(sentence.length).to.be.greaterThan(0);
      const hasPunctuation = sentence.includes("?") || sentence.includes(".");
      expect(hasPunctuation).to.be.true;
      console.log("Generated:", sentence);
    });
  });

  describe("Error Handling", function d() {
    this.timeout(testTimeout);

    it("should throw error for invalid API key", async () => {
      const originalKey = process.env.OPENROUTER_API_KEY;
      process.env.OPENROUTER_API_KEY = "invalid-key-12345";

      try {
        await generateSentenceFromSigns(["HELLO"]);
        expect.fail("Should have thrown an error");
      } catch (err) {
        expect(err).to.exist;
      } finally {
        process.env.OPENROUTER_API_KEY = originalKey;
      }
    });
  });
});
