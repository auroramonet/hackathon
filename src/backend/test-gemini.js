import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const testGemini = async () => {
  console.log("🧪 Testing Gemini API...\n");

  // Check if API key exists
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not found in .env file!");
    console.log("\nPlease add your Gemini API key to .env:");
    console.log("GEMINI_API_KEY=your_api_key_here\n");
    process.exit(1);
  }

  console.log("✅ API key found in .env file");
  console.log(
    `   Key starts with: ${process.env.GEMINI_API_KEY.substring(0, 10)}...\n`
  );

  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    console.log("📡 Sending test query to Gemini...\n");

    // Test with a simple question
    const result = await model.generateContent("Explain AI in one sentence.");
    const response = await result.response;
    const text = response.text();

    console.log("✅ SUCCESS! Gemini API is working!\n");
    console.log("📝 Response from Gemini:");
    console.log("─".repeat(50));
    console.log(text);
    console.log("─".repeat(50));
    console.log("\n🎉 Your Gemini API key is valid and working!");
  } catch (error) {
    console.error("❌ ERROR testing Gemini API:");
    console.error(error.message);

    if (error.message.includes("API_KEY_INVALID")) {
      console.log("\n💡 Your API key appears to be invalid.");
      console.log(
        "   Get a new key at: https://aistudio.google.com/app/apikey"
      );
    } else if (error.message.includes("PERMISSION_DENIED")) {
      console.log(
        "\n💡 Permission denied - check if your API key has the right permissions."
      );
    } else {
      console.log("\n💡 Check your internet connection and API key.");
    }
  }
};

// Run the test
testGemini();
