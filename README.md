# AI Model Cost Comparator

Compare costs across 30+ AI models from 7 providers. View token pricing, calculate usage costs, and compare model benchmarks side-by-side.

## 🌐 Live Site

**[https://reddyrc.github.io/ai-cost-comparator/](https://reddyrc.github.io/ai-cost-comparator/)**

## Features

- **Pricing Table** — Sortable, filterable table with input/output/cached pricing per 1K tokens, context window info, and customizable columns
- **Side-by-Side Comparison** — Select multiple models, set usage parameters (input/output tokens, cache hits, monthly requests), and see ranked cost cards
- **Model Comparison Chart** — Radar and bar chart visualization of benchmark performance (MMLU, HumanEval, MATH, GPQA, IFEval)
- **Model Detail Modal** — Click any model name for detailed pricing, benchmark progress bars, and cost estimates
- **Benchmark Comparison** — Select models via checkboxes and compare benchmark scores side-by-side
- **Provider Filter** — Multi-select filter to show/hide models by provider
- **Token Size Toggle** — Switch between per-1K, per-100K, and per-1M token pricing views

## Providers Covered

| Provider | Models | Cache Pricing |
|----------|--------|---------------|
| OpenAI | GPT-5.5, GPT-4o, GPT-4o Mini, GPT-4 Turbo, GPT-3.5 Turbo, o1, o1-mini, o3-mini | ✅ 50% cache hit |
| Anthropic | Claude Opus 4.8, Sonnet 4.6, Haiku 4.5, Opus 4.7, Opus 4.6, Sonnet 4.5, 3.5 Sonnet, 3.5 Haiku, 3 Opus | ✅ 10% cache hit |
| Google | Gemini 2.0 Flash, 2.0 Pro, 1.5 Pro, 1.5 Flash, 3.1 Pro | ✅ 25% cache hit |
| Meta | Llama 3.1 405B, 3.1 70B, 3.1 8B, Llama 4 17B | ❌ No caching |
| Mistral | Mistral Large 2, Small 3.1, Codestral | ✅ 50% cache hit |
| DeepSeek | DeepSeek-V3, R1, Coder-V2, V4 Flash, V4 Pro | ✅ 10-40% cache hit |
| Kimi | K2.7 Code, K2.6, K2.5, Moonshot V1 (8K/32K/128K text + vision) | ✅ 20% auto cache |
| Cohere | Command R+, Command R, Command A | ❌ No caching |

## Usage

1. Browse the **Pricing Table** to see all models and their token costs
2. Use the **Side-by-Side Comparison** to estimate costs for your specific usage
3. Explore the **Model Comparison Chart** to visualize benchmark performance vs cost
4. Click any model name for detailed information in the modal

## Development

This is a static site with no build step. Simply open `index.html` in a browser or serve it locally:

```bash
python3 -m http.server 8000
# or
npx serve .
```

### Updating Prices

The repository includes a GitHub Actions workflow that can fetch the latest pricing from provider documentation pages. To run it:

1. Go to **Actions** → **Update AI Model Prices** → **Run workflow**
2. The workflow will scrape provider pricing pages, update `data.js`, and create a PR with the changes

## Data Sources

- [OpenAI Pricing](https://platform.openai.com/docs/pricing)
- [Anthropic Models](https://docs.anthropic.com/en/docs/about-claude/models)
- [Google AI Models](https://ai.google.dev/gemini-api/docs/models)
- [Meta Llama Docs](https://llama.meta.com/docs/model-cards-and-prompt-formats)
- [Mistral Models](https://docs.mistral.ai/getting-started/models/)
- [DeepSeek Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [Cohere Models](https://docs.cohere.com/docs/models)

## License

MIT
