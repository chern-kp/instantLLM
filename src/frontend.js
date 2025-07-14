// Code is wrapped in DOMContentLoaded listener to ensure DOM is fully loaded before executing any code
import { models } from './models.js';

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
        const modelUsedElement = document.getElementById('model-used');
        const detailedResponse = document.getElementById('detailed-response');
        const detailedLlmResponseContent = document.getElementById('detailed-llm-response-content');
        const detailedApiResponseTime = document.getElementById('detailed-api-response-time');
        const detailedModelUsedElement = document.getElementById('detailed-model-used');
        const searchSettingsModelSelect = document.getElementById('search-settings-model-select');
        const openSettingsButton = document.getElementById('search__under-bar__open-settings-button');
        const searchSettingsContainer = document.getElementById('search-settings-container');


        return {
            searchInput,
            searchButton,
            openSettingsButton,
            searchSettingsContainer,
            page,
            header,
            responseWrapper,
            shortResponse,
            loadTimeElement,
            detailedAnswerButton,
            llmResponseContent,
            apiResponseTimeElement,
            modelUsedElement,
            detailedResponse,
            detailedLlmResponseContent,
            detailedApiResponseTime,
            detailedModelUsedElement,
            searchSettingsModelSelect
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
            elements.page.classList.add('search-active');
        };

        /**
         * FUNC - Deactivates the search mode by clearing responses,
         * hiding the response container, and removing 'search-active' classes.
         */
        const deactivateSearchMode = () => {
            elements.responseWrapper.style.display = 'none';
            elements.page.classList.remove('search-active');
        };

        /**
         * FUNC - Displays the API response time.
         * @param {number} time - The time taken for the API response in milliseconds.
         * @param {string} modelName - The name of the model used.
         */
        const displayApiResponseTime = (time, modelName) => {
            elements.apiResponseTimeElement.textContent = `Answered in: ${time.toFixed(2)} ms`;
            elements.modelUsedElement.textContent = `Model used: ${modelName}`;
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

        const toggleSettingsVisibility = () => {
            elements.searchSettingsContainer.classList.toggle('search__settings-container--visible');
        };

        /**
         * FUNC - Populates the model selector dropdown with models from the models object.
         */
        const populateModelSelector = () => {
            const selectElement = elements.searchSettingsModelSelect;
            if (!selectElement) return;

            selectElement.innerHTML = '';

            for (const modelId in models) {
                const option = document.createElement('option');
                option.value = modelId;
                option.textContent = models[modelId].display_text || modelId;
                selectElement.appendChild(option);
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

        const displayDetailedApiResponseTime = (time, modelName) => {
            elements.detailedApiResponseTime.textContent = `Answered in: ${time.toFixed(2)} ms`;
            elements.detailedModelUsedElement.textContent = `Model used: ${modelName}`;
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
            displayDetailedApiResponseTime,
            populateModelSelector,
            toggleSettingsVisibility
        };
    })(DOMHandler);

    // ANCHOR - APIService module. Handles interaction with the backend API.
    const APIService = (() => {
        /**
         * FUNC - Fetches a response from the API.
         * @param {object} options - The options for the content generation.
         * @param {string} [options.query] - The user's query.
         * @param {boolean} [options.isDetailed=false] - Optional flag to request a detailed answer.
         * @param {string} [options.lastUserPrompt] - The last user prompt for detailed answers.
         * @param {string} [options.lastLLMResponse] - The last LLM response for detailed answers.
         * @param {string} [options.modelId] - The ID of the model to use.
         * @param {object} [options.modelData] - The data of the model to use.
         * @returns {Promise<object>} - A promise that resolves with the API response data.
         */
        const generateContent = async (options) => {
            const {
                query,
                isDetailed = false,
                lastUserPrompt = null,
                lastLLMResponse = null,
                modelId = null,
                modelData = null
            } = options;

            const body = { query, isDetailed };
            if (isDetailed) {
                body.lastUserPrompt = lastUserPrompt;
                body.lastLLMResponse = lastLLMResponse;
            }
            if (modelId && modelData) {
                body.modelName = modelId;
                body.modelData = modelData;
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
            const selectedModelId = dom.searchSettingsModelSelect.value;
            const selectedModelData = models[selectedModelId];

            if (query) {
                ui.activateSearchMode();

                const startTime = performance.now(); // Start time for API call

                try {
                    const data = await api.generateContent({
                        query,
                        modelId: selectedModelId,
                        modelData: selectedModelData
                    });
                    const endTime = performance.now(); // End time for API call
                    const apiResponseTime = endTime - startTime;

                    lastUserPrompt = query;
                    lastLLMResponse = data.response;

                    ui.displayLLMResponse(data.response);
                    ui.displayApiResponseTime(apiResponseTime, data.modelName);

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
            ui.populateModelSelector();

            dom.searchButton.addEventListener('click', performSearch);
            dom.searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    performSearch();
                }
            });

            dom.openSettingsButton.addEventListener('click', () => {
                ui.toggleSettingsVisibility();
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
                    const selectedModelId = dom.searchSettingsModelSelect.value;
                    const selectedModelData = models[selectedModelId];

                    try {
                        const detailedData = await api.generateContent({
                            isDetailed: true,
                            lastUserPrompt,
                            lastLLMResponse,
                            modelId: selectedModelId,
                            modelData: selectedModelData
                        });
                        const endTime = performance.now();
                        const apiResponseTime = endTime - startTime;

                        ui.displayDetailedLLMResponse(detailedData.response);
                        ui.displayDetailedApiResponseTime(apiResponseTime, detailedData.modelName);
                    } catch (error) {
                        console.error('Error fetching detailed data:', error);
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
