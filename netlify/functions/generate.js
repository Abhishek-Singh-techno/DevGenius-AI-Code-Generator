// export const handler = async function (event) {
//     try {
//         if (event.httpMethod !== "POST") {
//             return {
//                 statusCode: 405,
//                 body: JSON.stringify({ error: "Method not allowed" })
//             };
//         }

//         const { prompt, type } = JSON.parse(event.body || "{}");

//         if (!prompt || !type) {
//             return {
//                 statusCode: 400,
//                 body: JSON.stringify({
//                     error: "Prompt and type are required"
//                 })
//             };
//         }

//         const apiKey = process.env.GEMINI_API_KEY;

//         if (!apiKey) {
//             throw new Error("GEMINI_API_KEY is missing in Netlify");
//         }

//         const model = "gemini-3.8-flash";

//         const systemInstruction = {
//             "html-tailwind": "You are an expert frontend developer. Generate a modern, responsive HTML file using Tailwind CSS via CDN. Return only raw code.",
//             "html-css": "You are an expert frontend developer. Generate a complete HTML file with internal CSS. Return only raw code.",
//             "html-only": "Generate clean, semantic and accessible HTML without CSS. Return only raw code."
//         };

//         const response = await fetch(
//             `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
//             {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({
//                     systemInstruction: {
//                         parts: [{
//                             text: systemInstruction[type] || "You are an expert coder. Return only code."
//                         }]
//                     },
//                     contents: [{
//                         parts: [{
//                             text: `Generate code for this request: ${prompt}`
//                         }]
//                     }]
//                 })
//             }
//         );

//         const data = await response.json();

//         if (!response.ok) {
//             throw new Error(
//                 data.error?.message || "Gemini API request failed"
//             );
//         }

//         const code = data.candidates?.[0]?.content?.parts?.[0]?.text;

//         if (!code) {
//             throw new Error("Gemini returned an empty response");
//         }

//         return {
//             statusCode: 200,
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({ code })
//         };

//     } catch (error) {
//         return {
//             statusCode: 500,
//             headers: {
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify({
//                 error: error.message
//             })
//         };
//     }
// };




// export const handler = async function (event) {
//     try {

//         // 1. Check HTTP Method
//         if (event.httpMethod !== "POST") {
//             return {
//                 statusCode: 405,
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({
//                     error: "Method not allowed"
//                 })
//             };
//         }

//         // 2. Parse Request Body
//         let requestBody;

//         try {
//             requestBody = JSON.parse(event.body || "{}");
//         } catch {
//             return {
//                 statusCode: 400,
//                 body: JSON.stringify({
//                     error: "Invalid JSON request body"
//                 })
//             };
//         }

//         const { prompt, type } = requestBody;

//         if (!prompt || !type) {
//             return {
//                 statusCode: 400,
//                 body: JSON.stringify({
//                     error: "Prompt and type are required"
//                 })
//             };
//         }

//         // 3. Get API Key from Netlify Environment Variable
//         const apiKey = process.env.GEMINI_API_KEY;

//         if (!apiKey) {
//             return {
//                 statusCode: 500,
//                 body: JSON.stringify({
//                     error: "GEMINI_API_KEY is missing in Netlify"
//                 })
//             };
//         }

//         // 4. Gemini Model
//         const model = "gemini-3.8-flash";

//         // 5. System Instructions
//         const systemInstruction = {

//             "html-tailwind":
//                 "You are an expert frontend developer. Generate a modern, responsive HTML file using Tailwind CSS via CDN. Return only raw code.",

//             "html-css":
//                 "You are an expert frontend developer. Generate a complete HTML file with internal CSS. Return only raw code.",

//             "html-only":
//                 "Generate clean, semantic and accessible HTML without CSS. Return only raw code."

//         };

//         // 6. Create API URL
//         const apiUrl =
//             `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

//         // 7. API Request with Timeout
//         const controller = new AbortController();

//         const timeout = setTimeout(() => {
//             controller.abort();
//         }, 25000);

//         let response;

//         try {

//             response = await fetch(apiUrl, {

//                 method: "POST",

//                 headers: {
//                     "Content-Type": "application/json",
//                     "x-goog-api-key": apiKey
//                 },

//                 body: JSON.stringify({

//                     systemInstruction: {
//                         parts: [{
//                             text: systemInstruction[type] ||
//                                 "You are an expert coder. Return only code."
//                         }]
//                     },

//                     contents: [{
//                         parts: [{
//                             text: `Generate code for this request: ${prompt}`
//                         }]
//                     }]

//                 }),

//                 signal: controller.signal

//             });

//         } finally {
//             clearTimeout(timeout);
//         }

//         // 8. Read Gemini Response
//         let data;

//         try {
//             data = await response.json();
//         } catch {
//             return {
//                 statusCode: 502,
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({
//                     error: "Invalid response received from Gemini API",
//                     upstreamStatus: response.status
//                 })
//             };
//         }

//         // 9. Handle API Errors
//         if (!response.ok) {

//             return {
//                 statusCode: response.status,

//                 headers: {
//                     "Content-Type": "application/json"
//                 },

//                 body: JSON.stringify({

//                     error:
//                         data.error?.message ||
//                         "Gemini API request failed",

//                     upstreamStatus: response.status

//                 })
//             };
//         }

//         // 10. Extract Generated Code
//         const code = data.candidates?.[0]?.content?.parts
//             ?.map(part => part.text || "")
//             .join("");

//         if (!code) {
//             return {
//                 statusCode: 502,
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({
//                     error: "Gemini returned an empty response",
//                     finishReason: data.candidates?.[0]?.finishReason
//                 })
//             };
//         }

//         // 11. Success Response
//         return {
//             statusCode: 200,

//             headers: {
//                 "Content-Type": "application/json"
//             },

//             body: JSON.stringify({
//                 code: code
//             })
//         };

//     } catch (error) {

//         // 12. Handle Timeout
//         if (error.name === "AbortError") {
//             return {
//                 statusCode: 504,
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({
//                     error: "Gemini API request timed out"
//                 })
//             };
//         }

//         // 13. Handle Other Errors
//         return {
//             statusCode: 500,

//             headers: {
//                 "Content-Type": "application/json"
//             },

//             body: JSON.stringify({
//                 error: error.message || "Internal server error"
//             })
//         };

//     }
// };

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

    // 5. System Instructions
    const systemInstruction = {
      "html-tailwind":
        "You are an expert frontend developer. Generate a modern, responsive, visually stunning HTML file using Tailwind CSS via CDN. Return ONLY raw code starting with <!DOCTYPE html>. No explanation, no markdown backticks.",
      "html-css":
        "You are an expert frontend developer. Generate a complete, colorful, modern and responsive HTML file with internal CSS in <style> tags. Return ONLY raw code starting with <!DOCTYPE html>. No explanation, no markdown backticks.",
      "html-only":
        "You are an expert web developer. Generate clean, semantic and accessible HTML without CSS. Return ONLY raw code. No explanation, no markdown backticks."
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
            maxOutputTokens: 8192
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
