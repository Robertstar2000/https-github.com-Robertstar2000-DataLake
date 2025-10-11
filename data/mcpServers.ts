import type { McpServer } from '../types';

// The type is now corrected to include 'description'.
// The data objects contain a description, and the downstream component requires it.
export const initialMcpServers: { name: string; url: string; description: string; }[] = [
    {
        name: 'Hugging Face Hub',
        url: 'https://huggingface.co',
        description: 'Access thousands of pretrained models for NLP, Computer Vision, and more.',
    },
    {
        name: 'AWS SageMaker Model Registry',
        url: 'https://aws.amazon.com/sagemaker/model-registry/',
        description: 'Catalog models for production, manage model versions, and associate metadata.',
    },
    {
        name: 'Google Vertex AI Model Garden',
        url: 'https://cloud.google.com/vertex-ai/docs/start/explore-models',
        description: 'Discover, test, and deploy Google and select open source models.',
    },
    {
        name: 'Azure ML Model Registry',
        url: 'https://azure.microsoft.com/en-us/products/machine-learning/',
        description: 'Track ML models in the Azure Machine Learning registry for organization and auditing.',
    },
    {
        name: 'Databricks Unity Catalog',
        url: 'https://www.databricks.com/product/unity-catalog',
        description: 'Unified governance for data and AI assets on the Databricks Lakehouse Platform.',
    },
    {
        name: 'Cohere Models',
        url: 'https://cohere.com/',
        description: 'Access powerful large language models for generation, summarization, and more.',
    },
    {
        name: 'OpenAI Models',
        url: 'https://openai.com/',
        description: 'Connect to state-of-the-art models like GPT-4 for a wide range of tasks.',
    },
    {
        name: 'Anthropic Models',
        url: 'https://www.anthropic.com/',
        description: 'Access Claude family of models for helpful, harmless, and honest AI systems.',
    },
    {
        name: 'Mistral AI Models',
        url: 'https://mistral.ai/',
        description: 'Access high-performance open-source and commercial language models.',
    },
    {
        name: 'Localhost (Ollama)',
        url: 'http://localhost:11434',
        description: 'Connect to a local model server, such as one running via Ollama.',
    },
];
