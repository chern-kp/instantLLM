# InstantLLM - Architecture

## About this project
This project is a simple LLM wrapper web app that was created to get simple answers for simple questions from LLM as fast as possible.
The goal is to provide a fast and convinient way to get answers from LLM.
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