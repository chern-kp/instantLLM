import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.5-flash-lite-preview-06-17';
const SYSTEM_INSTRUCTION = 'You are InstantLLM, LLM based on Gemini 2.5 Flash Lite. Please keep your responses short.';

// This is the function that Cloudflare will run when a POST request comes to /api/generate
export async function onRequestPost(context) {
    try {
        // Get the API key from Cloudflare's environment variables (you will set this in the Cloudflare dashboard)
        const genAI = new GoogleGenerativeAI(context.env.GEMINI_API_KEY);

        // Get the query from the request body
        const { query } = await context.request.json();

        if (!query) {
            return new Response(JSON.stringify({ error: 'Query is required' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Call the Gemini API
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: SYSTEM_INSTRUCTION,
        });
        const result = await model.generateContent(query);
        const response = await result.response;
        const text = response.text();

        // Return the response from the model
        return new Response(JSON.stringify({ response: text }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error generating content:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate content' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
