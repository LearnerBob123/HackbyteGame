import { GoogleGenAI } from '@google/genai';

type ChatHistoryEntry = {
    sender: 'player' | 'npc';
    text: string;
};

function getSafeHistory(history: unknown): ChatHistoryEntry[] {
    if (!Array.isArray(history)) return [];

    return history
        .slice(-8)
        .map((entry: any) => {
            if (!entry || typeof entry !== 'object') return null;

            if (typeof entry.text !== 'string' || typeof entry.sender !== 'string') {
                return null;
            }

            return {
                sender: entry.sender === 'player' ? 'player' : 'npc',
                text: entry.text.slice(0, 400),
            };
        })
        .filter(Boolean) as ChatHistoryEntry[];
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: 'Missing GEMINI_API_KEY in Vercel environment',
            });
        }

        const body =
            typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

        const message =
            typeof body?.message === 'string' ? body.message.trim() : '';

        const playerName =
            typeof body?.playerName === 'string' && body.playerName.trim()
                ? body.playerName.trim()
                : 'Agent';

        const history = getSafeHistory(body?.history);

        const gameState =
            body?.gameState && typeof body.gameState === 'object'
                ? body.gameState
                : null;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const transcript = history
            .map(
                (entry) =>
                    `${entry.sender === 'player' ? playerName : 'Byte Baba'}: ${entry.text}`
            )
            .join('\n');

        const prompt = [
            transcript
                ? `Recent conversation:\n${transcript}`
                : 'This is the first turn of the conversation.',
            gameState
                ? `Current game state:\n${JSON.stringify(gameState, null, 2)}`
                : 'Game state is unavailable.',
            `Player request: ${message.slice(0, 600)}`,
            'Reply as spoken dialogue to the player.',
            'Keep it under 120 words.',
        ].join('\n\n');

        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // safer model name
            contents: prompt,
//             config: {
//                 temperature: 1,
//                 systemInstruction: `You are Byte Baba, the Edge Oracle of Navagram. 
// Speak warmly, playfully, and in character. 
// Give actionable guidance based on game state. 
// Avoid sounding like an AI assistant.`,
//             },
//         });

        const text = response.text?.trim();

        if (!text) {
            return res.status(502).json({ error: 'Empty response from Gemini' });
        }

        return res.status(200).json({
            text,
            voiceAvailable: Boolean(
                process.env.ELEVENLABS_API_KEY &&
                process.env.ELEVENLABS_VOICE_ID
            ),
        });
    } catch (error: any) {
        return res.status(500).json({
            error: error?.message || 'Internal server error',
        });
    }
}