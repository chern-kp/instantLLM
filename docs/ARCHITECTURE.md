# InstantLLM - Architecture

## About this project
This project is a simple LLM wrapper web app that was created to get simple answers for simple questions from LLM as fast as possible.
The goal is to provide a fast and convenient way to get answers from LLM.
It can be integrated as a search engine in most browsers to get fast answers from search bar.
Currently it uses `gemini-2.5-flash-lite-preview-06-17` model from Google Gemini as a LLM model.

## Technologies, APIs, libraries used
**Frontend:**
- HTML, CSS, JavaScript
- Showdown.js - library used to convert markdown (that we get from LLM) to HTML

**Backend:**
- Cloudflare Pages - to host the static site and serverless functions
- Cloudflare Functions - for serverless API
- Node.js - runtime for Cloudflare Functions
- Google Generative AI API - API for Gemini LLM

**Development tools:**
- Wrangler - CLI for Cloudflare

## Architecture
InstantLLM is a full-stack web app that uses Jamstack architecture.
### Frontend
Frontend of a web app is a static site that is hosted on Cloudflare Pages.
In includes files:
- `src/index.html` - main page of the app
- `src/style.css` - styles for the app
- `src/frontend.js` - main frontend script for the app

### Backend
Backend of a web app is a serverless API that is hosted on Cloudflare Functions.
It includes files:
- `functions/api/generate.js` - function for generating answers from LLM

## How it works
1. User goes to `https://instantllm.pages.dev/` (OR directly from URL with the prompt in link, like `https://instantllm.pages.dev/i?q=hello+world+program+in+python`)
2. Browser loads `index.html`, `style.css` and `frontend.js` from Cloudflare Pages CDN
3. When user sends a request by pressing `Enter` or clicking on the search button, `frontend.js` sends a request to `https://instantllm.pages.dev/api/generate` with the prompt
4. Cloudflare Functions API receives a request and passes it to `generate.js` function
5. Function makes a request to Gemini LLM API using API key
6. Gemini LLM API returns a response to the function
7. Function formats a response and returns it to `frontend.js`
8. `frontend.js` displays an answer to the user
9. Response is displayed on the page