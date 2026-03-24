const key = process.argv[2] || "AIzaSyCmcjHAT4jCSnbMlR--yRj_U1TVUbvh3xk";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts:[{text: "hi"}] }] })
}).then(r => r.json()).then(console.log);
