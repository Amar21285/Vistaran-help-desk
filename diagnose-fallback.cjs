const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');

async function diagnose() {
    const env = fs.readFileSync('.env', 'utf8');
    const match = env.match(/VITE_API_KEY=(.*)/);
    const apiKey = match ? match[1].trim() : null;

    const models = [
        "gemini-2.5-flash-lite",
        "gemini-1.5-flash",
        "gemini-2.0-flash-lite"
    ];
    const versions = ["v1beta", "v1"];

    for (const model of models) {
        for (const version of versions) {
            console.log(`--- Testing: ${model} in ${version} ---`);
            try {
                const genAI = new GoogleGenAI({ apiKey, apiVersion: version });
                const resp = await genAI.models.generateContent({
                    model,
                    contents: [{ parts: [{ text: "Respond with 'OK'" }] }]
                });
                console.log(`[SUCCESS] Model: ${model}, Version: ${version} -> ${resp.text.trim()}`);
            } catch (e) {
                console.log(`[ERROR] Model: ${model}, Version: ${version} -> ${e.message}`);
                if (e.message.includes("quota")) {
                    console.log("   -> Quota Limit Hit");
                }
            }
        }
    }
}

diagnose();
