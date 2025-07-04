# InstantLLM

**[Use InstantLLM now](https://instantllm.pages.dev)**

InstantLLM is a simple LLM wrapper web app that was created to get simple answers for simple questions from LLM as fast as possible.
The goal is to provide a fast and convenient way to get answers from LLM.
Currently it uses `gemini-2.5-flash-lite-preview-06-17` model from Google Gemini as a LLM model.
It can be integrated as a search engine in most browsers to get fast answers from search bar.

## Add InstantLLM as a search engine in your browser or app:

You can use InstantLLM as a search engine most browsers and many apps.
For example, use it in Google Chrome, Edge, Firefox, and other browsers on pc and mobile; use it fast launch programs on pc, like PowerToys Run, Listary, etc; use it on Android with custom launchers, like Nova Launcher and others; add to search bar in any app that supports custom search engines.

For most browsers and apps integration is very similar:
1. Open settings, go to `Search engine` section, click on `Manage search engines` button, or similar.
2. Click on `Add` button.
3. Fill the form:
    - Name: `InstantLLM`
    - Keyword: `i` (or any other key word)
    - URL: `https://instantllm.pages.dev/search?q=%s` or `https://instantllm.pages.dev/search?q={query}`, depends on the app.
4. Click on `Add` button.
For browsers now you can just type `i` in the address bar and press `Space` key, you will see InstantLLM being displayed in the search bar. Now you can just type your question and press `Enter` to get the answer from LLM.