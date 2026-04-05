async function callGeminiAPI({
    message,
    playerName = "Agent",
    history = [],
    gameState = {},
}) {
    try {
        const res = await fetch("https://navagram-zeta.vercel.app/api/gemini", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message,
                playerName,
                history,
                gameState,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || "API error");
        }

        return data;
    } catch (err) {
        console.error("API CALL FAILED:", err.message);
        throw err;
    }
}