import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyDkwYl2CZTrtn5dyHFjRxUAWCDWg56xqUw"; // <-- put your key directly

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Say hello and a joke on robots",
        });

        console.log("✅ SUCCESS:");
        console.log(response.text);
    } catch (err) {
        console.error("❌ ERROR:");
        console.error(err.message || err);
    }
}

test();