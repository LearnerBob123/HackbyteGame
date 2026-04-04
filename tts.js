import fs from "fs";
import path from "path";
import { ElevenLabsClient } from "elevenlabs";
import dotenv from "dotenv";

dotenv.config();

const elevenlabs = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
});

async function generateSpeech() {
    const audio = await elevenlabs.textToSpeech.convert(
        process.env.ELEVENLABS_VOICE_ID,
        {
            text: "Hello, this is your NPC speaking.",
            model_id: process.env.ELEVENLABS_MODEL_ID,
        }
    );

    const filePath = path.resolve("./output.mp3");
    const writeStream = fs.createWriteStream(filePath);

    audio.pipe(writeStream);

    writeStream.on("finish", () => {
        console.log("Audio saved:", filePath);
    });
}

generateSpeech();