import dotenv from 'dotenv';

dotenv.config();

function readBody(req: { body?: unknown }) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  if (req.body && typeof req.body === 'object') {
    return req.body as Record<string, unknown>;
  }

  return {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

  if (!apiKey || !voiceId) {
    res.status(503).json({ error: 'ElevenLabs voice is not configured.' });
    return;
  }

  const body = readBody(req);
  if (!body) {
    res.status(400).json({ error: 'Request body must be valid JSON.' });
    return;
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (!text) {
    res.status(400).json({ error: 'Text is required for speech synthesis.' });
    return;
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.slice(0, 2000),
          model_id: modelId,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.7,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({ error: `ElevenLabs TTS failed: ${errorText}` });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    res.status(200).json({
      audioBase64: Buffer.from(arrayBuffer).toString('base64'),
      audioMimeType: 'audio/mpeg',
    });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unknown ElevenLabs error.';
    res.status(500).json({ error: messageText });
  }
}