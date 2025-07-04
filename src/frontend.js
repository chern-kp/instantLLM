// Code is wrapped in DOMContentLoaded listener to ensure DOM is fully loaded before executing any code
document.addEventListener('DOMContentLoaded', () => {
    // ANCHOR - DOMHandler module. Responsible for getting all necessary DOM elements.
    const DOMHandler = (() => {
        const searchInput = document.getElementById('search-input');
        const searchButton = document.getElementById('search-button');
        const page = document.querySelector('.page');
        const header = document.querySelector('.header');
        const responseWrapper = document.getElementById('response-wrapper');
        const shortResponse = document.getElementById('short-response');
        const loadTimeElement = document.getElementById('load-time');
        const detailedAnswerButton = document.getElementById('detailed-answer-button');
        const llmResponseContent = document.getElementById('llm-response-content');
        const apiResponseTimeElement = document.getElementById('api-response-time');
        const detailedResponse = document.getElementById('detailed-response');
        const detailedLlmResponseContent = document.getElementById('detailed-llm-response-content');
        const detailedApiResponseTime = document.getElementById('detailed-api-response-time');


        return {
            searchInput,
            searchButton,
            page,
            header,
            responseWrapper,
            shortResponse,
            loadTimeElement,
            detailedAnswerButton,
            llmResponseContent,
            apiResponseTimeElement,
            detailedResponse,
            detailedLlmResponseContent,
            detailedApiResponseTime
        };
    })();

    // ANCHOR - UIUpdater module. Manages all UI changes.
    const UIUpdater = ((elements) => {
        const converter = new showdown.Converter();

        /**
         * FUNC - Activates the search mode by clearing previous responses,
         * adding 'page--search-active' and 'header--search-active' classes,
         * and showing the response container.
         */
        const activateSearchMode = () => {
            elements.llmResponseContent.innerHTML = '';
            elements.apiResponseTimeElement.textContent = '';
            elements.detailedResponse.style.display = 'none';
            elements.detailedLlmResponseContent.innerHTML = '';
            elements.detailedApiResponseTime.textContent = '';
            elements.detailedAnswerButton.style.display = 'inline';
            elements.responseWrapper.style.display = 'block';
            elements.page.classList.add('page--search-active');
            elements.header.classList.add('header--search-active');
        };

        /**
         * FUNC - Deactivates the search mode by clearing responses,
         * hiding the response container, and removing 'search-active' classes.
         */
        const deactivateSearchMode = () => {
            elements.responseWrapper.style.display = 'none';
            elements.page.classList.remove('page--search-active');
            elements.header.classList.remove('header--search-active');
        };

        /**
         * FUNC - Displays the API response time.
         * @param {number} time - The time taken for the API response in milliseconds.
         */
        const displayApiResponseTime = (time) => {
            elements.apiResponseTimeElement.textContent = `Answered in: ${time.toFixed(2)} ms`;
        };

        /**
         * FUNC - Displays the main LLM response in Markdown format in the dedicated content area.
         * @param {string} markdownContent - The Markdown content to display.
         */
        const displayLLMResponse = (markdownContent) => {
            const htmlContent = converter.makeHtml(markdownContent);
            elements.llmResponseContent.innerHTML = htmlContent;
        };

        /**
         * FUNC - Displays an error message in the LLM response content area.
         */
        const displayError = () => {
            elements.llmResponseContent.innerHTML = '<p>Sorry, something went wrong. Please try again.</p>';
            elements.responseWrapper.style.display = 'block'; // Ensure it's visible to show error
        };

        /**
         * FUNC - Displays the page load time.
         * @param {number} time - The page load time in milliseconds.
         */
        const displayPageLoadTime = (time) => {
            if (elements.loadTimeElement) {
                elements.loadTimeElement.textContent = `page loaded in: ${time.toFixed(2)} ms`;
            }
        };

        const showDetailedResponseContainer = () => {
            elements.detailedAnswerButton.style.display = 'none';
            elements.detailedResponse.style.display = 'block';
            elements.detailedLlmResponseContent.innerHTML = '<p>Please wait for the response from ai...</p>';
        };

        const displayDetailedLLMResponse = (markdownContent) => {
            const htmlContent = converter.makeHtml(markdownContent);
            elements.detailedLlmResponseContent.innerHTML = htmlContent;
        };

        const displayDetailedApiResponseTime = (time) => {
            elements.detailedApiResponseTime.textContent = `Answered in: ${time.toFixed(2)} ms`;
        };

        return {
            activateSearchMode,
            deactivateSearchMode,
            displayApiResponseTime,
            displayLLMResponse,
            displayError,
            displayPageLoadTime,
            showDetailedResponseContainer,
            displayDetailedLLMResponse,
            displayDetailedApiResponseTime
        };
    })(DOMHandler);

    // ANCHOR - APIService module. Handles interaction with the backend API.
    const APIService = (() => {
        /**
         * FUNC - Fetches a response from the API.
         * @param {string} query - The user's query.
         * @param {boolean} [isDetailed] - Optional flag to request a detailed answer.
         * @param {string} [lastUserPrompt] - The last user prompt for detailed answers.
         * @param {string} [lastLLMResponse] - The last LLM response for detailed answers.
         * @returns {Promise<object>} - A promise that resolves with the API response data.
         */
        const generateContent = async (query, isDetailed = false, lastUserPrompt = null, lastLLMResponse = null) => {
            const body = { query, isDetailed };
            if (isDetailed) {
                body.lastUserPrompt = lastUserPrompt;
                body.lastLLMResponse = lastLLMResponse;
            }

            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            return response.json();
        };

        return {
            generateContent
        };
    })();

    // ANCHOR - App module. Initializes and coordinates the application.
    const App = ((dom, ui, api) => {
        let lastUserPrompt = '';
        let lastLLMResponse = '';

        const performSearch = async () => {
            const query = dom.searchInput.value;
            if (query) {
                ui.activateSearchMode();

                const startTime = performance.now(); // Start time for API call

                try {
                    const data = await api.generateContent(query);
                    const endTime = performance.now(); // End time for API call
                    const apiResponseTime = endTime - startTime;

                    lastUserPrompt = query;
                    lastLLMResponse = data.response;

                    ui.displayLLMResponse(data.response);
                    ui.displayApiResponseTime(apiResponseTime);

                } catch (error) {
                    console.error('Error fetching data:', error);
                    ui.displayError();
                }
            } else {
                ui.deactivateSearchMode();
            }
        };

        const handleUrlQuery = () => {
            const params = new URLSearchParams(window.location.search);
            const query = params.get('q');

            if (query) {
                dom.searchInput.value = query;
                performSearch();
            }
        };

        const init = () => {
            dom.searchButton.addEventListener('click', performSearch);
            dom.searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    performSearch();
                }
            });

            if (dom.detailedAnswerButton) {
                dom.detailedAnswerButton.addEventListener('click', async (event) => {
                    event.preventDefault();
                    if (!lastUserPrompt || !lastLLMResponse) {
                        console.warn('No previous prompt or LLM response to generate detailed answer.');
                        return;
                    }

                    ui.showDetailedResponseContainer();
                    const startTime = performance.now();

                    try {
                        const detailedData = await api.generateContent(null, true, lastUserPrompt, lastLLMResponse);
                        const endTime = performance.now();
                        const apiResponseTime = endTime - startTime;

                        ui.displayDetailedLLMResponse(detailedData.response);
                        ui.displayDetailedApiResponseTime(apiResponseTime);
                    } catch (error) {
                        console.error('Error fetching detailed data:', error);
                        // Optionally, display an error in the detailed response container
                    }
                });
            }

            handleUrlQuery();

            // Calculate and display page load time
            ui.displayPageLoadTime(performance.now());
        };

        return {
            init
        };
    })(DOMHandler, UIUpdater, APIService);

    App.init();
});
