exports.handler = async function (event) {
    try {
        if (event.httpMethod !== "POST") {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: "Method not allowed" })
            };
        }

        const { prompt, type } = JSON.parse(event.body || "{}");

        if (!prompt || !type) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: "Prompt and type are required"
                })
            };
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is missing in Netlify");
        }

        const model = "gemini-3.8-flash";

        const systemInstruction = {
            "html-tailwind": "You are an expert frontend developer. Generate a modern, responsive HTML file using Tailwind CSS via CDN. Return only raw code.",
            "html-css": "You are an expert frontend developer. Generate a complete HTML file with internal CSS. Return only raw code.",
            "html-only": "Generate clean, semantic and accessible HTML without CSS. Return only raw code."
        };

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{
                            text: systemInstruction[type] || "You are an expert coder. Return only code."
                        }]
                    },
                    contents: [{
                        parts: [{
                            text: `Generate code for this request: ${prompt}`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message || "Gemini API request failed"
            );
        }

        const code = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!code) {
            throw new Error("Gemini returned an empty response");
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ code })
        };

    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};