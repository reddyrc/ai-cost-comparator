// AI Model Pricing Data
// Prices are per 1K tokens unless otherwise noted
// Last updated: June 2026

const pricingData = [
    // ===== OpenAI =====
    {
        provider: 'OpenAI',
        providerClass: 'openai',
        model: 'GPT-5.5',
        inputPrice: 0.0025,
        outputPrice: 0.01,
        contextWindow: '128K',
        description: 'Latest flagship model',
        benchmarks: {
            mmlu: 92.5,
            humaneval: 96.8,
            math: 94.2,
            gpqa: 88.1,
            ifeval: 91.3
        },
        docsUrl: 'https://platform.openai.com/docs/models'
    },
    {
        provider: 'OpenAI',
        providerClass: 'openai',
        model: 'GPT-4o',
        inputPrice: 0.0025,
        outputPrice: 0.01,
        contextWindow: '128K',
        description: 'Most capable GPT-4 model with vision',
        benchmarks: {
            mmlu: 88.7,
            humaneval: 90.2,
            math: 76.6,
            gpqa: 79.3,
            ifeval: 85.1
        },
        docsUrl: 'https://platform.openai.com/docs/models'
    },
    {
        provider: 'OpenAI',
        providerClass: 'openai',
        model: 'GPT-4o Mini',
        inputPrice: 0.00015,
        outputPrice: 0.0006,
        contextWindow: '128K',
        description: 'Affordable small model for simple tasks',
        benchmarks: {
            mmlu: 82.0,
            humaneval: 87.2,
            math: 70.2,
            gpqa: 65.4,
            ifeval: 79.8
        },
        docsUrl: 'https://platform.openai.com/docs/models'
    },
    {
        provider: 'OpenAI',
        providerClass: 'openai',
        model: 'GPT-4 Turbo',
        inputPrice: 0.01,
        outputPrice: 0.03,
        contextWindow: '128K',
        description: 'Previous generation high-performance model',
        benchmarks: {
            mmlu: 86.4,
            humaneval: 87.1,
            math: 72.6,
            gpqa: 75.8,
            ifeval: 83.0
        },
        docsUrl: 'https://platform.openai.com/docs/models'
    },
    {
        provider: 'OpenAI',
        providerClass: 'openai',
        model: 'GPT-3.5 Turbo',
        inputPrice: 0.0005,
        outputPrice: 0.0015,
        contextWindow: '16K',
        description: 'Fast and cost-effective for simple tasks',
        benchmarks: {
            mmlu: 70.0,
            humaneval: 72.5,
            math: 34.1,
            gpqa: 48.2,
            ifeval: 65.3
        },
        docsUrl: 'https://platform.openai.com/docs/models'
    },
    {
        provider: 'OpenAI',
        providerClass: 'openai',
        model: 'o1',
        inputPrice: 0.015,
        outputPrice: 0.06,
        contextWindow: '200K',
        description: 'Reasoning model for complex problems',
        benchmarks: {
            mmlu: 92.3,
            humaneval: 93.5,
            math: 94.8,
            gpqa: 86.7,
            ifeval: 89.2
        },
        docsUrl: 'https://platform.openai.com/docs/models'
    },
    {
        provider: 'OpenAI',
        providerClass: 'openai',
        model: 'o1-mini',
        inputPrice: 0.003,
        outputPrice: 0.012,
        contextWindow: '200K',
        description: 'Faster, cheaper reasoning model',
        benchmarks: {
            mmlu: 85.2,
            humaneval: 90.8,
            math: 90.0,
            gpqa: 78.4,
            ifeval: 82.6
        },
        docsUrl: 'https://platform.openai.com/docs/models'
    },
    {
        provider: 'OpenAI',
        providerClass: 'openai',
        model: 'o3-mini',
        inputPrice: 0.0011,
        outputPrice: 0.0044,
        contextWindow: '200K',
        description: 'Latest reasoning model, best value',
        benchmarks: {
            mmlu: 87.8,
            humaneval: 92.1,
            math: 92.5,
            gpqa: 81.3,
            ifeval: 84.7
        },
        docsUrl: 'https://platform.openai.com/docs/models'
    },

    // ===== Anthropic =====
    {
        provider: 'Anthropic',
        providerClass: 'anthropic',
        model: 'Claude Opus 4.8',
        inputPrice: 0.005,
        outputPrice: 0.025,
        contextWindow: '1M',
        description: 'Most capable Opus-tier model for complex reasoning',
        benchmarks: {
            mmlu: 93.1,
            humaneval: 95.2,
            math: 93.8,
            gpqa: 89.5,
            ifeval: 92.4
        },
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    {
        provider: 'Anthropic',
        providerClass: 'anthropic',
        model: 'Claude Sonnet 4.6',
        inputPrice: 0.003,
        outputPrice: 0.015,
        contextWindow: '1M',
        description: 'Best combination of speed and intelligence',
        benchmarks: {
            mmlu: 90.5,
            humaneval: 92.8,
            math: 88.4,
            gpqa: 85.2,
            ifeval: 89.7
        },
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    {
        provider: 'Anthropic',
        providerClass: 'anthropic',
        model: 'Claude Haiku 4.5',
        inputPrice: 0.001,
        outputPrice: 0.005,
        contextWindow: '200K',
        description: 'Fastest model with near-frontier intelligence',
        benchmarks: {
            mmlu: 85.3,
            humaneval: 88.1,
            math: 82.6,
            gpqa: 76.8,
            ifeval: 83.5
        },
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    {
        provider: 'Anthropic',
        providerClass: 'anthropic',
        model: 'Claude Opus 4.7',
        inputPrice: 0.005,
        outputPrice: 0.025,
        contextWindow: '1M',
        description: 'Previous Opus generation (legacy)',
        benchmarks: {
            mmlu: 91.8,
            humaneval: 93.6,
            math: 91.2,
            gpqa: 87.4,
            ifeval: 90.1
        },
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    {
        provider: 'Anthropic',
        providerClass: 'anthropic',
        model: 'Claude Opus 4.6',
        inputPrice: 0.005,
        outputPrice: 0.025,
        contextWindow: '1M',
        description: 'Previous Opus generation (legacy)',
        benchmarks: {
            mmlu: 90.2,
            humaneval: 91.5,
            math: 88.7,
            gpqa: 84.9,
            ifeval: 88.3
        },
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    {
        provider: 'Anthropic',
        providerClass: 'anthropic',
        model: 'Claude Sonnet 4.5',
        inputPrice: 0.003,
        outputPrice: 0.015,
        contextWindow: '200K',
        description: 'Previous Sonnet generation (legacy)',
        benchmarks: {
            mmlu: 88.9,
            humaneval: 90.4,
            math: 85.1,
            gpqa: 81.6,
            ifeval: 86.2
        },
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    {
        provider: 'Anthropic',
        providerClass: 'anthropic',
        model: 'Claude 3.5 Sonnet',
        inputPrice: 0.003,
        outputPrice: 0.015,
        contextWindow: '200K',
        description: 'Best balance of speed and capability',
        benchmarks: {
            mmlu: 88.7,
            humaneval: 92.0,
            math: 78.5,
            gpqa: 79.8,
            ifeval: 84.6
        },
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    {
        provider: 'Anthropic',
        providerClass: 'anthropic',
        model: 'Claude 3.5 Haiku',
        inputPrice: 0.0008,
        outputPrice: 0.004,
        contextWindow: '200K',
        description: 'Fast and affordable for everyday tasks',
        benchmarks: {
            mmlu: 78.5,
            humaneval: 82.3,
            math: 68.9,
            gpqa: 65.2,
            ifeval: 75.8
        },
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },
    {
        provider: 'Anthropic',
        providerClass: 'anthropic',
        model: 'Claude 3 Opus',
        inputPrice: 0.015,
        outputPrice: 0.075,
        contextWindow: '200K',
        description: 'Most powerful Claude 3 model',
        benchmarks: {
            mmlu: 86.8,
            humaneval: 84.1,
            math: 60.1,
            gpqa: 74.5,
            ifeval: 80.3
        },
        docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models'
    },

    // ===== Google =====
    {
        provider: 'Google',
        providerClass: 'google',
        model: 'Gemini 2.0 Flash',
        inputPrice: 0.0001,
        outputPrice: 0.0004,
        contextWindow: '1M',
        description: 'Ultra-fast, ultra-cheap flash model',
        benchmarks: {
            mmlu: 79.5,
            humaneval: 84.2,
            math: 75.8,
            gpqa: 70.1,
            ifeval: 78.6
        },
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models'
    },
    {
        provider: 'Google',
        providerClass: 'google',
        model: 'Gemini 2.0 Pro',
        inputPrice: 0.002,
        outputPrice: 0.008,
        contextWindow: '2M',
        description: 'Most capable Gemini model',
        benchmarks: {
            mmlu: 87.2,
            humaneval: 89.5,
            math: 83.4,
            gpqa: 80.8,
            ifeval: 85.3
        },
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models'
    },
    {
        provider: 'Google',
        providerClass: 'google',
        model: 'Gemini 1.5 Pro',
        inputPrice: 0.00125,
        outputPrice: 0.005,
        contextWindow: '2M',
        description: 'Previous generation Pro model',
        benchmarks: {
            mmlu: 85.9,
            humaneval: 84.1,
            math: 67.7,
            gpqa: 77.8,
            ifeval: 82.4
        },
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models'
    },
    {
        provider: 'Google',
        providerClass: 'google',
        model: 'Gemini 1.5 Flash',
        inputPrice: 0.000075,
        outputPrice: 0.0003,
        contextWindow: '1M',
        description: 'Cost-effective flash model',
        benchmarks: {
            mmlu: 75.8,
            humaneval: 78.3,
            math: 62.4,
            gpqa: 63.5,
            ifeval: 72.1
        },
        docsUrl: 'https://ai.google.dev/gemini-api/docs/models'
    },

    // ===== Meta =====
    {
        provider: 'Meta',
        providerClass: 'meta',
        model: 'Llama 3.1 405B',
        inputPrice: 0.002,
        outputPrice: 0.002,
        contextWindow: '128K',
        description: 'Largest open-source Llama model',
        benchmarks: {
            mmlu: 87.3,
            humaneval: 89.0,
            math: 73.5,
            gpqa: 78.2,
            ifeval: 83.8
        },
        docsUrl: 'https://llama.meta.com/docs/model-cards-and-prompt-formats'
    },
    {
        provider: 'Meta',
        providerClass: 'meta',
        model: 'Llama 3.1 70B',
        inputPrice: 0.00059,
        outputPrice: 0.00079,
        contextWindow: '128K',
        description: 'Mid-size open-source model',
        benchmarks: {
            mmlu: 82.0,
            humaneval: 82.6,
            math: 58.5,
            gpqa: 70.3,
            ifeval: 78.5
        },
        docsUrl: 'https://llama.meta.com/docs/model-cards-and-prompt-formats'
    },
    {
        provider: 'Meta',
        providerClass: 'meta',
        model: 'Llama 3.1 8B',
        inputPrice: 0.00006,
        outputPrice: 0.00006,
        contextWindow: '128K',
        description: 'Small, fast open-source model',
        benchmarks: {
            mmlu: 66.7,
            humaneval: 72.6,
            math: 36.8,
            gpqa: 52.4,
            ifeval: 65.2
        },
        docsUrl: 'https://llama.meta.com/docs/model-cards-and-prompt-formats'
    },
    {
        provider: 'Meta',
        providerClass: 'meta',
        model: 'Llama 4 17B',
        inputPrice: 0.0001,
        outputPrice: 0.0001,
        contextWindow: '256K',
        description: 'Latest generation small model',
        benchmarks: {
            mmlu: 72.4,
            humaneval: 76.8,
            math: 52.3,
            gpqa: 60.1,
            ifeval: 70.5
        },
        docsUrl: 'https://llama.meta.com/docs/model-cards-and-prompt-formats'
    },

    // ===== Mistral =====
    {
        provider: 'Mistral',
        providerClass: 'mistral',
        model: 'Mistral Large 2',
        inputPrice: 0.002,
        outputPrice: 0.006,
        contextWindow: '128K',
        description: 'Most capable Mistral model',
        benchmarks: {
            mmlu: 84.0,
            humaneval: 86.5,
            math: 72.8,
            gpqa: 76.4,
            ifeval: 81.2
        },
        docsUrl: 'https://docs.mistral.ai/getting-started/models/'
    },
    {
        provider: 'Mistral',
        providerClass: 'mistral',
        model: 'Mistral Small 3.1',
        inputPrice: 0.0002,
        outputPrice: 0.0006,
        contextWindow: '128K',
        description: 'Efficient small model',
        benchmarks: {
            mmlu: 71.5,
            humaneval: 74.2,
            math: 48.6,
            gpqa: 58.3,
            ifeval: 68.9
        },
        docsUrl: 'https://docs.mistral.ai/getting-started/models/'
    },
    {
        provider: 'Mistral',
        providerClass: 'mistral',
        model: 'Codestral',
        inputPrice: 0.001,
        outputPrice: 0.003,
        contextWindow: '256K',
        description: 'Specialized for code generation',
        benchmarks: {
            mmlu: 68.2,
            humaneval: 91.5,
            math: 52.4,
            gpqa: 55.8,
            ifeval: 72.3
        },
        docsUrl: 'https://docs.mistral.ai/getting-started/models/'
    },

    // ===== DeepSeek =====
    {
        provider: 'DeepSeek',
        providerClass: 'deepseek',
        model: 'DeepSeek-V3',
        inputPrice: 0.00027,
        outputPrice: 0.0011,
        contextWindow: '128K',
        description: 'Latest flagship model, strong general performance',
        benchmarks: {
            mmlu: 88.5,
            humaneval: 90.2,
            math: 85.4,
            gpqa: 82.1,
            ifeval: 86.7
        },
        docsUrl: 'https://api-docs.deepseek.com/'
    },
    {
        provider: 'DeepSeek',
        providerClass: 'deepseek',
        model: 'DeepSeek-R1',
        inputPrice: 0.00055,
        outputPrice: 0.00219,
        contextWindow: '128K',
        description: 'Reasoning model with chain-of-thought',
        benchmarks: {
            mmlu: 90.8,
            humaneval: 92.4,
            math: 93.1,
            gpqa: 85.6,
            ifeval: 88.2
        },
        docsUrl: 'https://api-docs.deepseek.com/'
    },
    {
        provider: 'DeepSeek',
        providerClass: 'deepseek',
        model: 'DeepSeek-Coder-V2',
        inputPrice: 0.00014,
        outputPrice: 0.00028,
        contextWindow: '128K',
        description: 'Specialized code generation model',
        benchmarks: {
            mmlu: 72.5,
            humaneval: 93.8,
            math: 58.2,
            gpqa: 62.4,
            ifeval: 74.1
        },
        docsUrl: 'https://api-docs.deepseek.com/'
    },
    {
        provider: 'DeepSeek',
        providerClass: 'deepseek',
        model: 'DeepSeek-V4 Flash',
        inputPrice: 0.00007,
        outputPrice: 0.00028,
        contextWindow: '1M',
        description: 'Fast, cost-efficient V4 model',
        benchmarks: {
            mmlu: 85.2,
            humaneval: 88.6,
            math: 82.1,
            gpqa: 78.5,
            ifeval: 83.4
        },
        docsUrl: 'https://api-docs.deepseek.com/'
    },
    {
        provider: 'DeepSeek',
        providerClass: 'deepseek',
        model: 'DeepSeek-V4 Pro',
        inputPrice: 0.0005,
        outputPrice: 0.002,
        contextWindow: '1M',
        description: 'High-performance V4 flagship model',
        benchmarks: {
            mmlu: 91.2,
            humaneval: 93.5,
            math: 90.8,
            gpqa: 87.3,
            ifeval: 90.1
        },
        docsUrl: 'https://api-docs.deepseek.com/'
    },

    // ===== Cohere =====
    {
        provider: 'Cohere',
        providerClass: 'cohere',
        model: 'Command R+',
        inputPrice: 0.003,
        outputPrice: 0.015,
        contextWindow: '128K',
        description: 'Enterprise RAG-optimized model',
        benchmarks: {
            mmlu: 75.7,
            humaneval: 68.5,
            math: 42.3,
            gpqa: 60.2,
            ifeval: 72.8
        },
        docsUrl: 'https://docs.cohere.com/docs/models'
    },
    {
        provider: 'Cohere',
        providerClass: 'cohere',
        model: 'Command R',
        inputPrice: 0.0005,
        outputPrice: 0.0015,
        contextWindow: '128K',
        description: 'Cost-effective RAG model',
        benchmarks: {
            mmlu: 68.2,
            humaneval: 62.8,
            math: 35.6,
            gpqa: 52.4,
            ifeval: 65.1
        },
        docsUrl: 'https://docs.cohere.com/docs/models'
    },
    {
        provider: 'Cohere',
        providerClass: 'cohere',
        model: 'Command A',
        inputPrice: 0.0025,
        outputPrice: 0.01,
        contextWindow: '256K',
        description: 'Latest generation command model',
        benchmarks: {
            mmlu: 82.4,
            humaneval: 85.1,
            math: 72.6,
            gpqa: 74.8,
            ifeval: 80.3
        },
        docsUrl: 'https://docs.cohere.com/docs/models'
    }
];

// Sort by provider then by model name (to keep model families together)
pricingData.sort((a, b) => {
    if (a.provider < b.provider) return -1;
    if (a.provider > b.provider) return 1;
    return a.model.localeCompare(b.model);
});
