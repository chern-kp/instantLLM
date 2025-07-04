import { GoogleGenerativeAI } from '@google/generative-ai';

// ANCHOR - GeminiService module. Handles interaction with the Google Generative AI.
const GeminiService = ((env) => {
    const DEFAULT_MODEL_NAME = 'gemini-2.5-flash-lite-preview-06-17';
    const DEFAULT_SYSTEM_INSTRUCTION = 'You are InstantLLM, LLM based on Gemini 2.5 Flash Lite. User is going to act as you are a search engine, so you must act as one. Assume that all prompts are questions. Please keep your responses short.';

    const DETAILED_MODEL_NAME = 'gemini-2.5-flash-lite-preview-06-17'
    const DETAILED_SYSTEM_INSTRUCTION = 'You are a highly detailed and explicit assistant, providing comprehensive answers based on the user\'s previous query and your prior response. Be very detailed and explicit.';
    const DETAILED_PROMPT_TEMPLATE = 'User made a search with a prompt: {userPrompt}. Your answer was the following: {llmResponse}. Now user asks for much more detailed answer to users prompt. Think what user wants to get as an answer from you. Be very detailed and explicit. Do not use meta-commentary introduction, your aim is to answer the users question.';

    /**
     * FUNC - Creates a Gemini model instance with specified or default parameters.
     * What this means is that we now have our own gemini model configured to use our own system instruction.
     * @param {string} modelName - The name of the model to use.
     * @param {string} systemInstruction - The system instruction for the model.
     * @returns {object} - The Gemini model instance.
     */
    const createModel = (modelName, systemInstruction) => {
        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        return genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstruction,
        });
    };

    /**
     * FUNC - Generates content using the Gemini API.
     * @param {string} query - The user's query.
     * @param {object} modelInstance - The Gemini model instance to use.
     * @returns {Promise<string>} - A promise that resolves with the generated text response.
     */
    const generateContent = async (query, modelInstance) => {
        const result = await modelInstance.generateContent(query);
        const response = await result.response;
        return response.text();
    };

    return {
        DEFAULT_MODEL_NAME,
        DEFAULT_SYSTEM_INSTRUCTION,
        DETAILED_MODEL_NAME,
        DETAILED_SYSTEM_INSTRUCTION,
        DETAILED_PROMPT_TEMPLATE,
        createModel,
        generateContent
    };
});

// FUNC - ResponseHandler module: Handles forming HTTP responses.
const ResponseHandler = (() => {
    /**
     * Creates a successful JSON response.
     * @param {object} data - The data to include in the response body.
     * @param {number} status - The HTTP status code.
     * @returns {Response} - A new Response object.
     */
    const success = (data, status = 200) => {
        return new Response(JSON.stringify(data), {
            status,
            headers: { 'Content-Type': 'application/json' },
        });
    };

    /**
     * FUNC - Creates an error JSON response.
     * @param {string} message - The error message.
     * @param {number} status - The HTTP status code.
     * @returns {Response} - A new Response object.
     */
    const error = (message, status = 500) => {
        return new Response(JSON.stringify({ error: message }), {
            status,
            headers: { 'Content-Type': 'application/json' },
        });
    };

    return {
        success,
        error
    };
})();

// ANCHOR - RequestProcessor module. Handles the logic of processing API requests.
const RequestProcessor = ((geminiService, responseHandler) => {
    /**
     * FUNC - Processes the API request and returns a response.
     * @param {object} requestData - The data from the incoming request.
     * @returns {Promise<Response>} - A promise that resolves with the Response object.
     */
    const processRequest = async (requestData) => {
        // Form the object with all the data from the request, like the text of the prompt, the system instruction, the model name, etc.
        const { query, systemInstruction, modelName, isDetailed, lastUserPrompt, lastLLMResponse } = requestData;

        // If the query is not provided, return an error.
        if (!query && !isDetailed) {
            return responseHandler.error('Query is required', 400);
        }


        let currentSystemInstruction;
        let currentModelName;
        let finalQuery = query;

        // If we prompted for a detailed answer by using "Detailed answer" button, we need to use a different system instruction and model name.
        if (isDetailed) {
            currentSystemInstruction = geminiService.DETAILED_SYSTEM_INSTRUCTION;
            currentModelName = geminiService.DETAILED_MODEL_NAME;
            // If the last user prompt and LLM response are provided, we can use them to form the final query
            if (lastUserPrompt && lastLLMResponse) {
                // In the text of the prompt we replace the {userPrompt} and {llmResponse} with the actual values.
                finalQuery = geminiService.DETAILED_PROMPT_TEMPLATE
                    .replace('{userPrompt}', lastUserPrompt)
                    .replace('{llmResponse}', lastLLMResponse);
            } else {
                // If the last user prompt and LLM response are not provided, return an error.
                return responseHandler.error('Previous prompt and LLM response are required for detailed answer', 400);
            }
        } else {
            // If we didn't prompt for a detailed answer, we use the default system instruction and model name.
            currentSystemInstruction = systemInstruction || geminiService.DEFAULT_SYSTEM_INSTRUCTION;
            currentModelName = modelName || geminiService.DEFAULT_MODEL_NAME;
        }

        const modelInstance = geminiService.createModel(currentModelName, currentSystemInstruction);
        const text = await geminiService.generateContent(finalQuery, modelInstance);
        return responseHandler.success({ response: text, modelName: currentModelName });
    };

    return {
        processRequest
    };
});

// FUNC - This is the function that Cloudflare will run when a POST request comes to /api/generate
export async function onRequestPost(context) {
    try {
        const requestData = await context.request.json();
        const geminiService = GeminiService(context.env);
        const requestProcessor = RequestProcessor(geminiService, ResponseHandler);
        return await requestProcessor.processRequest(requestData);
    } catch (error) {
        console.error('Error generating content:', error);
        return ResponseHandler.error('Failed to generate content', 500);
    }
}
