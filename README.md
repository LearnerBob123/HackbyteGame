# Village Misinformation Simulator

A React-based interactive simulation game where you play as an investigator in a village struggling with the spread of rumors and misinformation. Your goal is to navigate the village, interact with NPC agents, verify information, and manage the village's "Misinformation Index".

## Features

- **Dynamic Agent Simulation**: NPCs roam the village, interacting with each other and spreading rumors based on their unique psychological profiles (skepticism, talkativeness, persuasiveness, and trust networks).
- **Interactive Map**: A 20x20 grid map where you can see agents moving in real-time. Hover over agents to see their names and friendship status.
- **Rumor System**: A variety of rumors (true and false) circulate through the village. Rumors have credibility scores, categories, and specific verification locations.
- **Cybercafe & Physical Verification**: Verify rumors by visiting the Cybercafe (blue zone) to search the web, or by traveling to specific physical locations on the map (bouncing green pins) to investigate in person.
- **Dialogue & Confrontation**: Talk to agents to learn what they know, share information, or build friendships. Confront agents with verified facts to expose them or their sources.
- **Reputation & Trust**: Your actions affect your reputation and how much agents trust you. Exposing false rumors lowers the global Misinformation Index but might damage your relationship with the exposed agent.

## Project Structure

The codebase is structured as a modern React application using TypeScript and Vite.

- **`src/App.tsx`**: The main application component. Handles the game loop, UI rendering (map, logs, dialogue, cybercafe), and player input.
- **`src/models/Agent.ts`**: Defines the `Agent` class. Handles NPC state, movement logic, and the mechanics of receiving and believing rumors based on trust and skepticism.
- **`src/models/Simulation.ts`**: Defines the `SimulationEngine`. Manages the collection of agents, the game step logic (NPC-NPC interactions), rumor lineage tracking, and the fact-checking/announcement mechanics.
- **`src/types.ts`**: Contains TypeScript interfaces and constants, including the `RUMORS` database, `DIALOGUE_FLAVOR` texts, and map configurations.
- **`src/index.css`**: Global styles, utilizing Tailwind CSS for UI styling.
- **`src/main.tsx`**: The React entry point.

## How to Play

1. **Move Around**: Use the arrow keys or the on-screen D-pad to move your character (the white square) around the map.
2. **Interact with Agents**: Click on an agent (colored squares) to open a dialogue. You can listen to their rumors, share verified information, or try to befriend them.
3. **Monitor Gossip**: Watch the "Village Gossip" log to see who is talking to whom and what rumors are spreading.
4. **Verify Information**: 
   - Go to the **Cybercafe** (blue zone) to search for keywords and verify rumors online.
   - Go to **Verification Points** (bouncing green pins) to physically verify rumors related to that location.
5. **Confront & Fact-Check**: Once you have verified a rumor, talk to an agent who knows it. You can confront them with the truth. Choose to announce it to the village to lower the Misinformation Index, or keep it quiet to preserve your friendship.

## Technical Details

- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion (for smooth agent movement)
- **Icons**: Lucide React
- **Build Tool**: Vite

## Running Locally

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY`.
3. Optional: set `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` to give Byte Baba an old-man voice.
4. Start the Gemini proxy server in one terminal: `npm run dev:server`
5. Start the Vite client in another terminal: `npm run dev`
6. Open the provided local URL in your browser.

## Gemini Chatbot NPC

- A special villager named Byte Baba now sits near the eastern edge of the map.
- Talk to Byte Baba to ask about the game, request hints, or generate short riddles, jokes, and text-only meme ideas.
- The browser now calls a local Express endpoint at `/api/chatbot`, which forwards requests to Gemini so your API key stays on the server side.
- If ElevenLabs is configured, Byte Baba can also speak each reply aloud and you can toggle voice playback inside the chat panel.
- If Byte Baba says the signal is weak, check that `.env` exists and the proxy server is running on port `3001`.
