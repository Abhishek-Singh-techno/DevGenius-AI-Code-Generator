export const handler = async function (event) {
  const jsonHeaders = { "Content-Type": "application/json" };

  try {
    // 1. Check HTTP Method
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: jsonHeaders,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    // 2. Parse Request Body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ error: "Invalid JSON request body" })
      };
    }

    const { prompt, type } = requestBody;

    if (!prompt || !type) {
      return {
        statusCode: 400,
        headers: jsonHeaders,
        body: JSON.stringify({ error: "Prompt and type are required" })
      };
    }

    // 3. Get API Key from Netlify Environment Variable
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: jsonHeaders,
        body: JSON.stringify({ error: "GEMINI_API_KEY is missing in Netlify" })
      };
    }

    // 4. Gemini Model
    const model = "gemini-3.8-flash";

    // 5. System Instructions (compact code = faster response)
    const systemInstruction = {
      "html-tailwind":
        "You are an expert frontend developer. Generate a modern, responsive HTML file using Tailwind CSS via CDN. Return ONLY raw code starting with <!DOCTYPE html>. No explanation, no markdown backticks. Keep the code compact (under 200 lines).",
      "html-css":
        "You are an expert frontend developer. Generate a complete, modern and responsive HTML file with internal CSS in <style> tags. Return ONLY raw code starting with <!DOCTYPE html>. No explanation, no markdown backticks. Keep the code compact (under 200 lines).",
      "html-only":
        "You are an expert web developer. Generate clean, semantic and accessible HTML without CSS. Return ONLY raw code. No explanation, no markdown backticks. Keep the code compact (under 200 lines)."
    };

    // 6. Create API URL
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    // 7. API Request with Timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text:
                  systemInstruction[type] ||
                  "You are an expert coder. Return only code."
              }
            ]
          },
          contents: [
            {
              parts: [{ text: `Generate code for this request: ${prompt}` }]
            }
          ],
          generationConfig: {
            maxOutputTokens: 4096
          }
        }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }

    // 8. Read Gemini Response
    let data;
    try {
      data = await response.json();
    } catch {
      return {
        statusCode: 502,
        headers: jsonHeaders,
        body: JSON.stringify({
          error: "Invalid response received from Gemini API",
          upstreamStatus: response.status
        })
      };
    }

    // 9. Handle API Errors
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: jsonHeaders,
        body: JSON.stringify({
          error: data.error?.message || "Gemini API request failed",
          upstreamStatus: response.status
        })
      };
    }

    // 10. Extract Generated Code
    const code = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("");

    if (!code) {
      return {
        statusCode: 502,
        headers: jsonHeaders,
        body: JSON.stringify({
          error: "Gemini returned an empty response",
          finishReason: data.candidates?.[0]?.finishReason
        })
      };
    }

    // 11. Success Response
    return {
      statusCode: 200,
      headers: jsonHeaders,
      body: JSON.stringify({ code })
    };
  } catch (error) {
    // 12. Handle Timeout
    if (error.name === "AbortError") {
      return {
        statusCode: 504,
        headers: jsonHeaders,
        body: JSON.stringify({ error: "Gemini API request timed out" })
      };
    }

    // 13. Handle Other Errors
    return {
      statusCode: 500,
      headers: jsonHeaders,
      body: JSON.stringify({ error: error.message || "Internal server error" })
    };
  }
};