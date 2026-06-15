// ===== AI Cost Comparator - Application Logic =====

// Current token size multiplier (1 = per 1K, 100 = per 100K, 1000 = per 1M)
let currentTokenMultiplier = 1;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize column config first (loads saved preferences)
    initColumnConfig();
    // initColumnConfig calls applyColumnConfig which renders the table,
    // initializes checkboxes, and sets up sortable headers
    initTokenSizeToggle();
    initComparison();
    initNavigation();
    initModelModal();
    initBenchmarkComparison();
    initProviderFilter();
    initModelSearch();
    initChart();
    setLastUpdatedDate();
});

// ===== Utility Functions =====

function formatCurrency(amount) {
    if (amount < 0.0001) {
        return '$' + amount.toFixed(8);
    }
    if (amount < 0.01) {
        return '$' + amount.toFixed(6);
    }
    if (amount < 1) {
        return '$' + amount.toFixed(4);
    }
    return '$' + amount.toFixed(2);
}

function formatCurrencyShort(amount) {
    if (amount < 0.0001) return '< $0.0001';
    if (amount < 0.01) return '$' + amount.toFixed(6);
    if (amount < 1) return '$' + amount.toFixed(4);
    return '$' + amount.toFixed(2);
}

function calculateCost(inputTokens, outputTokens, requests, inputPrice, outputPrice) {
    const inputCostPerRequest = (inputTokens / 1000) * inputPrice;
    const outputCostPerRequest = (outputTokens / 1000) * outputPrice;
    const costPerRequest = inputCostPerRequest + outputCostPerRequest;
    const monthlyInputCost = inputCostPerRequest * requests;
    const monthlyOutputCost = outputCostPerRequest * requests;
    const totalMonthlyCost = costPerRequest * requests;
    const annualCost = totalMonthlyCost * 12;

    return {
        costPerRequest,
        monthlyInputCost,
        monthlyOutputCost,
        totalMonthlyCost,
        annualCost
    };
}

function setLastUpdatedDate() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('last-updated-date').textContent = now.toLocaleDateString('en-US', options);
}

// ===== Navigation =====

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Update active nav link on scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 150;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });
}

// ===== Token Size Toggle =====

function initTokenSizeToggle() {
    const buttons = document.querySelectorAll('#token-size-group .toggle-btn');
    
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update multiplier
            const size = btn.dataset.size;
            switch (size) {
                case '1K': currentTokenMultiplier = 1; break;
                case '100K': currentTokenMultiplier = 100; break;
                case '1M': currentTokenMultiplier = 1000; break;
            }
            
            // Update table header labels
            const headers = document.querySelectorAll('#pricing-table thead th');
            if (headers.length >= 3) {
                headers[2].innerHTML = `Input <span class="sort-icon"></span>`;
                headers[3].innerHTML = `Output <span class="sort-icon"></span>`;
            }
            
            // Re-render with new scale
            initPricingTable();
            
            // Re-apply provider filter after table re-render
            const searchInput = document.getElementById('model-search');
            if (searchInput) {
                searchInput.dispatchEvent(new Event('input'));
            }
        });
    });
}

// ===== Pricing Table =====

function initPricingTable() {
    // Use column config to render the table
    const config = getColumnConfig();
    applyColumnConfig(config);
}

// ===== Sortable Table =====

function initSortableTable() {
    const headers = document.querySelectorAll('#pricing-table .sortable');
    let currentSort = { column: null, direction: 'asc' };

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.sort;
            
            // Toggle direction if same column, else default to asc
            const direction = (currentSort.column === column && currentSort.direction === 'asc') ? 'desc' : 'asc';
            
            // Reset all headers
            headers.forEach(h => {
                h.classList.remove('sort-asc', 'sort-desc');
            });
            
            // Set active sort
            header.classList.add(direction === 'asc' ? 'sort-asc' : 'sort-desc');
            currentSort = { column, direction };
            
            sortTable(column, direction);
        });
    });
}

function sortTable(column, direction) {
    const tbody = document.getElementById('pricing-body');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    // Find the column index by looking at header data-sort attributes
    const headers = document.querySelectorAll('#pricing-table thead th.sortable');
    let colIndex = -1;
    headers.forEach((th, idx) => {
        if (th.dataset.sort === column) {
            colIndex = idx;
        }
    });
    
    if (colIndex === -1) return;
    
    rows.sort((a, b) => {
        let valA, valB;
        
        // Check if it's a benchmark column (starts with 'benchmark-')
        if (column.startsWith('benchmark-')) {
            // Benchmark columns contain percentage text like "88.5% 👑"
            valA = parseFloat(a.cells[colIndex]?.textContent?.replace(/[^0-9.]/g, '') || '0');
            valB = parseFloat(b.cells[colIndex]?.textContent?.replace(/[^0-9.]/g, '') || '0');
        } else {
            switch (column) {
                case 'provider':
                    valA = a.cells[colIndex]?.textContent?.trim().toLowerCase() || '';
                    valB = b.cells[colIndex]?.textContent?.trim().toLowerCase() || '';
                    break;
                case 'model':
                    valA = a.cells[colIndex]?.textContent?.trim().toLowerCase() || '';
                    valB = b.cells[colIndex]?.textContent?.trim().toLowerCase() || '';
                    break;
                case 'input':
                    valA = parsePrice(a.cells[colIndex]?.textContent || '');
                    valB = parsePrice(b.cells[colIndex]?.textContent || '');
                    break;
                case 'output':
                    valA = parsePrice(a.cells[colIndex]?.textContent || '');
                    valB = parsePrice(b.cells[colIndex]?.textContent || '');
                    break;
                case 'input-cached':
                    valA = parsePrice(a.cells[colIndex]?.textContent || '');
                    valB = parsePrice(b.cells[colIndex]?.textContent || '');
                    break;
                case 'context':
                    valA = parseContext(a.cells[colIndex]?.textContent || '');
                    valB = parseContext(b.cells[colIndex]?.textContent || '');
                    break;
                default:
                    return 0;
            }
        }
        
        if (typeof valA === 'string') {
            return direction === 'asc' 
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        } else {
            return direction === 'asc' 
                ? valA - valB
                : valB - valA;
        }
    });
    
    // Re-append sorted rows
    rows.forEach(row => tbody.appendChild(row));
}

function parsePrice(text) {
    // Handle formats like "$0.0025 🏆", "< $0.0001", "$0.0025"
    const cleaned = text.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

function parseContext(text) {
    // Handle formats like "128K", "1M", "2M", "16K"
    text = text.trim().toLowerCase();
    if (text.endsWith('m')) {
        return parseFloat(text) * 1000;
    }
    if (text.endsWith('k')) {
        return parseFloat(text);
    }
    return parseFloat(text) || 0;
}

// ===== Comparison =====

function initComparison() {
    const checkboxList = document.getElementById('compare-checkbox-list');
    const searchInput = document.getElementById('compare-model-search');
    const cardsWrapper = document.getElementById('comparison-cards-wrapper');
    const placeholder = document.querySelector('#comparison-results .results-placeholder');
    const modelCount = document.getElementById('compare-model-count');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const inputTokens = document.getElementById('compare-input-tokens');
    const outputTokens = document.getElementById('compare-output-tokens');
    const requests = document.getElementById('compare-requests');

    // Preset configurations
    const presets = {
        light: { input: 1000, output: 200, requests: 1000 },
        moderate: { input: 2000, output: 1000, requests: 10000 },
        heavy: { input: 4000, output: 2000, requests: 100000 }
    };

    // Populate checkbox list
    pricingData.forEach(model => {
        const item = document.createElement('label');
        item.className = 'comparison-checkbox-item';
        item.innerHTML = `
            <input type="checkbox" class="compare-cb" value="${model.model}">
            <span class="provider-badge provider-${model.providerClass}">${model.provider}</span>
            <span class="model-name">${model.model}</span>
            <span class="model-context">${model.contextWindow}</span>
        `;
        checkboxList.appendChild(item);
    });

    // Run comparison and render results
    function runComparison() {
        const checked = checkboxList.querySelectorAll('.compare-cb:checked');
        
        if (checked.length < 2) {
            placeholder.classList.remove('hidden');
            cardsWrapper.classList.add('hidden');
            return;
        }

        const inTokens = parseInt(inputTokens.value) || 1000;
        const cacheTokens = parseInt(document.getElementById('compare-cache-tokens').value) || 0;
        const outTokens = parseInt(outputTokens.value) || 500;
        const reqs = parseInt(requests.value) || 10000;

        if (inTokens <= 0 || outTokens <= 0 || reqs <= 0) return;

        // Calculate costs for each selected model
        const results = [];
        checked.forEach(cb => {
            const model = pricingData.find(m => m.model === cb.value);
            if (model) {
                // Split input tokens into cache hit and standard
                const standardInTokens = Math.max(0, inTokens - cacheTokens);
                const cacheHitTokens = Math.min(cacheTokens, inTokens);
                
                // Use cached price for cache hit tokens if model supports it
                const cachePrice = model.inputCachedPrice !== undefined ? model.inputCachedPrice : model.inputPrice;
                
                // Calculate blended input cost
                const standardInputCost = (standardInTokens / 1000) * model.inputPrice;
                const cacheInputCost = (cacheHitTokens / 1000) * cachePrice;
                const blendedInputPrice = (standardInputCost + cacheInputCost) / (inTokens / 1000);
                
                const costs = calculateCost(inTokens, outTokens, reqs, blendedInputPrice, model.outputPrice);
                
                // Calculate savings from cache
                const noCacheCost = calculateCost(inTokens, outTokens, reqs, model.inputPrice, model.outputPrice);
                const cacheSavings = noCacheCost.totalMonthlyCost - costs.totalMonthlyCost;
                
                results.push({
                    ...model,
                    ...costs,
                    cacheSavings,
                    cacheHitTokens: cacheHitTokens,
                    hasCachePricing: model.inputCachedPrice !== undefined
                });
            }
        });

        // Find cheapest
        const cheapest = Math.min(...results.map(r => r.totalMonthlyCost));

        // Sort by total monthly cost (cheapest first)
        results.sort((a, b) => a.totalMonthlyCost - b.totalMonthlyCost);

        // Render comparison cards
        cardsWrapper.innerHTML = '';
        
        results.forEach((result, idx) => {
            const isCheapest = result.totalMonthlyCost === cheapest;
            const percentageDiff = ((result.totalMonthlyCost - cheapest) / cheapest * 100).toFixed(1);
            const rank = idx + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-other';
            
            const card = document.createElement('div');
            card.className = 'comparison-card';
            card.innerHTML = `
                <div class="comparison-card-rank ${rankClass}">${rank}</div>
                <div class="comparison-card-info">
                    <div class="comparison-card-model">${result.model}</div>
                    <div class="comparison-card-provider">
                        <span class="provider-badge provider-${result.providerClass}">${result.provider}</span>
                        <span style="margin-left: 8px; color: var(--text-muted);">${result.contextWindow} context</span>
                    </div>
                </div>
                <div class="comparison-card-costs">
                    <div class="comparison-card-cost-item">
                        <div class="comparison-card-cost-label">Per Request</div>
                        <div class="comparison-card-cost-value">${formatCurrency(result.costPerRequest)}</div>
                    </div>
                    <div class="comparison-card-cost-item">
                        <div class="comparison-card-cost-label">Monthly</div>
                        <div class="comparison-card-cost-value ${isCheapest ? 'cheapest' : ''}">${formatCurrency(result.totalMonthlyCost)}</div>
                    </div>
                    <div class="comparison-card-cost-item">
                        <div class="comparison-card-cost-label">Annual</div>
                        <div class="comparison-card-cost-value">${formatCurrency(result.annualCost)}</div>
                    </div>
                </div>
                <div class="comparison-card-badge ${isCheapest ? 'cheapest-badge' : 'more-expensive'}">
                    ${isCheapest 
                        ? '✅ Cheapest' 
                        : `+${percentageDiff}%`
                    }
                </div>
                ${result.cacheHitTokens > 0 ? `
                    <div class="comparison-card-savings">
                        ⚡ ${result.cacheHitTokens.toLocaleString()} cache hits/req — saved ${formatCurrency(result.cacheSavings)}/mo
                    </div>
                ` : ''}
            `;
            cardsWrapper.appendChild(card);
        });

        // Show cards, hide placeholder
        placeholder.classList.add('hidden');
        cardsWrapper.classList.remove('hidden');
    }

    // Update count and checked styling, then auto-run comparison
    function updateAndRun() {
        const checked = checkboxList.querySelectorAll('.compare-cb:checked');
        const count = checked.length;
        modelCount.textContent = count === 0 
            ? '(choose 2+)' 
            : `(${count} selected)`;
        
        // Update checked styling on items
        checkboxList.querySelectorAll('.comparison-checkbox-item').forEach(item => {
            const cb = item.querySelector('.compare-cb');
            item.classList.toggle('checked', cb.checked);
        });
        
        // Auto-run comparison
        runComparison();
    }

    // Search/filter
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase().trim();
        checkboxList.querySelectorAll('.comparison-checkbox-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.classList.toggle('hidden', term && !text.includes(term));
        });
    });

    // Delegate checkbox changes
    checkboxList.addEventListener('change', updateAndRun);

    // Preset buttons
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const preset = presets[btn.dataset.preset];
            if (preset) {
                inputTokens.value = preset.input;
                outputTokens.value = preset.output;
                requests.value = preset.requests;
                // Auto-run comparison after preset change
                runComparison();
            }
        });
    });

    // Auto-run on input changes
    const cacheTokens = document.getElementById('compare-cache-tokens');
    [inputTokens, outputTokens, requests, cacheTokens].forEach(input => {
        if (input) input.addEventListener('input', runComparison);
    });
}

// ===== Model Detail Modal =====

const BENCHMARK_LABELS = {
    mmlu: 'MMLU',
    humaneval: 'HumanEval',
    math: 'MATH',
    gpqa: 'GPQA',
    ifeval: 'IFEval'
};

const BENCHMARK_DESCRIPTIONS = {
    mmlu: 'Massive Multitask Language Understanding — measures knowledge across 57 subjects',
    humaneval: 'Code generation — measures ability to write correct Python functions from docstrings',
    math: 'Mathematical reasoning — measures ability to solve math problems at competition level',
    gpqa: 'Graduate-level Q&A — measures PhD-level scientific reasoning',
    ifeval: 'Instruction Following — measures ability to follow formatting constraints precisely'
};

function initModelModal() {
    const modal = document.getElementById('model-modal');
    const closeBtn = document.getElementById('modal-close');
    
    // Close on X button
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
    
    // Delegate click events for model links (since table re-renders)
    document.getElementById('pricing-body').addEventListener('click', (e) => {
        const link = e.target.closest('.model-link');
        if (link) {
            e.preventDefault();
            const modelName = link.dataset.model;
            const model = pricingData.find(m => m.model === modelName);
            if (model) {
                openModelModal(model);
            }
        }
    });
}

function openModelModal(model) {
    const modal = document.getElementById('model-modal');
    
    // Set provider badge
    const badge = document.getElementById('modal-provider-badge');
    badge.className = `provider-badge provider-${model.providerClass}`;
    badge.textContent = model.provider;
    
    // Set model name
    document.getElementById('modal-model-name').textContent = model.model;
    
    // Set docs links
    const docsLink = document.getElementById('modal-docs-link');
    docsLink.href = model.docsUrl || '#';
    const sourcePricing = document.getElementById('modal-source-pricing');
    sourcePricing.href = model.docsUrl || '#';
    
    // Set pricing
    document.getElementById('modal-input-price').textContent = formatCurrency(model.inputPrice);
    document.getElementById('modal-output-price').textContent = formatCurrency(model.outputPrice);
    document.getElementById('modal-context').textContent = model.contextWindow;
    
    // Set cache pricing if available
    const modalCachePrice = document.getElementById('modal-cache-price');
    if (modalCachePrice) {
        if (model.inputCachedPrice !== undefined) {
            modalCachePrice.textContent = formatCurrency(model.inputCachedPrice);
            modalCachePrice.parentElement.style.display = '';
        } else {
            modalCachePrice.parentElement.style.display = 'none';
        }
    }
    
    // Set benchmarks
    const benchmarkContainer = document.getElementById('modal-benchmarks');
    benchmarkContainer.innerHTML = '';
    
    if (model.benchmarks) {
        const benchmarkKeys = Object.keys(model.benchmarks);
        
        // Find the best score across all models for each benchmark
        const bestScores = {};
        benchmarkKeys.forEach(key => {
            bestScores[key] = Math.max(...pricingData.filter(m => m.benchmarks && m.benchmarks[key]).map(m => m.benchmarks[key]));
        });
        
        benchmarkKeys.forEach(key => {
            const score = model.benchmarks[key];
            const best = bestScores[key];
            const isBest = score === best;
            const percentage = (score / 100) * 100;
            
            const item = document.createElement('div');
            item.className = 'benchmark-item';
            item.innerHTML = `
                <div class="benchmark-header">
                    <span class="benchmark-name">${BENCHMARK_LABELS[key] || key}</span>
                    <span class="benchmark-score ${isBest ? 'benchmark-best' : ''}">
                        ${score.toFixed(1)}%
                        ${isBest ? ' 👑' : ''}
                    </span>
                </div>
                <div class="benchmark-bar-bg">
                    <div class="benchmark-bar" style="width: ${percentage}%"></div>
                </div>
                <div class="benchmark-desc">${BENCHMARK_DESCRIPTIONS[key] || ''}</div>
            `;
            benchmarkContainer.appendChild(item);
        });
    } else {
        benchmarkContainer.innerHTML = '<p style="color: var(--text-muted);">No benchmark data available for this model.</p>';
    }
    
    // Set cost estimates
    const estimatesContainer = document.getElementById('modal-estimates');
    estimatesContainer.innerHTML = '';
    
    const usageScenarios = [
        { label: 'Light (1K in / 200 out, 1K req/mo)', input: 1000, output: 200, requests: 1000 },
        { label: 'Moderate (2K in / 1K out, 10K req/mo)', input: 2000, output: 1000, requests: 10000 },
        { label: 'Heavy (4K in / 2K out, 100K req/mo)', input: 4000, output: 2000, requests: 100000 },
    ];
    
    usageScenarios.forEach(scenario => {
        const costs = calculateCost(scenario.input, scenario.output, scenario.requests, model.inputPrice, model.outputPrice);
        
        const card = document.createElement('div');
        card.className = 'estimate-card';
        card.innerHTML = `
            <div class="estimate-label">${scenario.label}</div>
            <div class="estimate-value">${formatCurrency(costs.totalMonthlyCost)}<span class="estimate-unit">/mo</span></div>
        `;
        estimatesContainer.appendChild(card);
    });
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// ===== Model Search =====

function initModelSearch() {
    const searchInput = document.getElementById('model-search');
    const filterCount = document.getElementById('filter-count');
    
    if (!searchInput) return;
    
    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedProviders = window.getSelectedProviders ? window.getSelectedProviders() : 'all';
        const rows = document.querySelectorAll('#pricing-body tr');
        let visibleCount = 0;
        
        rows.forEach(row => {
            const providerCell = row.querySelector('.provider-badge');
            const modelLink = row.querySelector('.model-link');
            if (!providerCell || !modelLink) return;
            
            const provider = providerCell.textContent.trim();
            const modelName = modelLink.dataset.model?.toLowerCase() || '';
            const modelDesc = row.querySelector('small')?.textContent?.toLowerCase() || '';
            
            // Check if provider matches selected providers
            let matchesProvider;
            if (selectedProviders === 'all') {
                matchesProvider = true;
            } else if (Array.isArray(selectedProviders)) {
                matchesProvider = selectedProviders.includes(provider);
            } else {
                matchesProvider = provider === selectedProviders;
            }
            
            const matchesSearch = !searchTerm || 
                modelName.includes(searchTerm) || 
                provider.toLowerCase().includes(searchTerm) ||
                modelDesc.includes(searchTerm);
            
            const matches = matchesProvider && matchesSearch;
            row.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });
        
        // Update count
        const total = pricingData.length;
        const isAllProviders = selectedProviders === 'all' || (Array.isArray(selectedProviders) && selectedProviders.length === [...new Set(pricingData.map(m => m.provider))].length);
        if (isAllProviders && !searchTerm) {
            filterCount.textContent = `Showing all ${total} models`;
        } else {
            filterCount.textContent = `Showing ${visibleCount} of ${total} models`;
        }
    }
    
    // Debounced search
    let debounceTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(filterTable, 200);
    });
}

// ===== Token Estimator =====

function initTokenEstimator() {
    const textarea = document.getElementById('token-estimator-input');
    const countDisplay = document.getElementById('estimated-token-count');
    const useBtn = document.getElementById('use-estimated-tokens');
    const inputTokensField = document.getElementById('calc-input-tokens');
    
    if (!textarea || !countDisplay) return;
    
    // Estimate tokens: ~4 characters per token for English text
    // More accurate: count words and multiply by ~1.3
    function estimateTokens(text) {
        if (!text || !text.trim()) return 0;
        
        // Remove extra whitespace
        const cleaned = text.trim();
        
        // Method 1: Character-based (4 chars ≈ 1 token)
        const charEstimate = Math.ceil(cleaned.length / 4);
        
        // Method 2: Word-based (1 token ≈ 0.75 words)
        const words = cleaned.split(/\s+/).length;
        const wordEstimate = Math.ceil(words * 1.3);
        
        // Method 3: For code-heavy text, use character-based
        const codeIndicators = (cleaned.match(/[{}\[\]();=<>+\-*/]/g) || []).length;
        const isCodeHeavy = codeIndicators > cleaned.length * 0.05;
        
        // Use weighted average
        let estimate;
        if (isCodeHeavy) {
            // Code: characters are more reliable
            estimate = Math.ceil(cleaned.length / 3.5);
        } else {
            // Natural language: average both methods
            estimate = Math.ceil((charEstimate + wordEstimate) / 2);
        }
        
        return Math.max(1, estimate);
    }
    
    textarea.addEventListener('input', () => {
        const text = textarea.value;
        const estimated = estimateTokens(text);
        countDisplay.textContent = estimated.toLocaleString();
    });
    
    // Use estimated tokens as input
    useBtn.addEventListener('click', () => {
        const estimated = parseInt(countDisplay.textContent.replace(/,/g, ''));
        if (estimated > 0) {
            inputTokensField.value = estimated;
            // Visual feedback
            useBtn.textContent = '✅ Applied!';
            setTimeout(() => {
                useBtn.textContent = 'Use as Input';
            }, 1500);
        }
    });
}

// ===== Chart (Radar & Bar) =====

// Chart colors for up to 10 models
const CHART_COLORS = [
    '#6c5ce7', '#00cec9', '#fdcb6e', '#ff6b6b', '#a29bfe',
    '#00b894', '#e17055', '#0984e3', '#fd79a8', '#636e72'
];

function initChart() {
    const checkboxList = document.getElementById('chart-checkbox-list');
    const searchInput = document.getElementById('chart-model-search');
    const canvas = document.getElementById('comparison-chart');
    const placeholder = document.getElementById('chart-placeholder');
    const chartTypeGroup = document.getElementById('chart-type-group');
    const modelCount = document.getElementById('chart-model-count');
    
    if (!checkboxList || !canvas) return;
    
    let selectedModels = [];
    let chartType = 'radar'; // 'radar' or 'bar'
    
    // Populate checkbox list (same style as comparison section)
    pricingData.forEach(model => {
        const item = document.createElement('label');
        item.className = 'comparison-checkbox-item';
        item.innerHTML = `
            <input type="checkbox" class="chart-model-cb" value="${model.model}">
            <span class="provider-badge provider-${model.providerClass}">${model.provider}</span>
            <span class="model-name">${model.model}</span>
            <span class="model-context">${model.contextWindow}</span>
        `;
        checkboxList.appendChild(item);
    });
    
    // Search/filter
    searchInput.addEventListener('input', () => {
        const term = searchInput.value.toLowerCase().trim();
        checkboxList.querySelectorAll('.comparison-checkbox-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.classList.toggle('hidden', term && !text.includes(term));
        });
    });
    
    // Chart type toggle
    chartTypeGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.toggle-btn');
        if (!btn) return;
        
        chartTypeGroup.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        chartType = btn.dataset.chart;
        
        if (selectedModels.length >= 2) {
            drawChart(selectedModels, chartType);
        }
    });
    
    // Update count and checked styling
    function updateChart() {
        const checked = checkboxList.querySelectorAll('.chart-model-cb:checked');
        const count = checked.length;
        modelCount.textContent = count === 0 
            ? '(choose 2+)' 
            : `(${count} selected)`;
        
        // Update checked styling on items
        checkboxList.querySelectorAll('.comparison-checkbox-item').forEach(item => {
            const cb = item.querySelector('.chart-model-cb');
            item.classList.toggle('checked', cb.checked);
        });
        
        // Build selected models
        selectedModels = [];
        checked.forEach(cb => {
            const model = pricingData.find(m => m.model === cb.value);
            if (model) selectedModels.push(model);
        });
        
        // Draw or show placeholder
        if (selectedModels.length >= 2) {
            placeholder.classList.add('hidden');
            canvas.classList.remove('hidden');
            drawChart(selectedModels, chartType);
        } else {
            placeholder.classList.remove('hidden');
            canvas.classList.add('hidden');
        }
    }
    
    // Delegate checkbox changes
    checkboxList.addEventListener('change', updateChart);
}

function drawChart(models, type) {
    const canvas = document.getElementById('comparison-chart');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = Math.min(rect.width - 40, 800);
    const height = Math.min(500, width * 0.65);
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);
    
    // Clear
    ctx.clearRect(0, 0, width, height);
    
    if (type === 'radar') {
        drawRadarChart(ctx, models, width, height);
    } else {
        drawBarChart(ctx, models, width, height);
    }
}

function drawRadarChart(ctx, models, width, height) {
    const benchmarkKeys = ['mmlu', 'humaneval', 'math', 'gpqa', 'ifeval'];
    const labels = benchmarkKeys.map(k => BENCHMARK_LABELS[k]);
    const numAxes = labels.length;
    
    const padding = { top: 40, bottom: 40, left: 40, right: 40 };
    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const radius = Math.min(centerX - padding.left, centerY - padding.top) - 20;
    
    // Draw grid
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
        const r = (radius / levels) * level;
        ctx.beginPath();
        for (let i = 0; i <= numAxes; i++) {
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const x = centerX + r * Math.cos(angle);
            const y = centerY + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Draw axes
    for (let i = 0; i < numAxes; i++) {
        const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Label
        const labelR = radius + 18;
        const lx = centerX + labelR * Math.cos(angle);
        const ly = centerY + labelR * Math.sin(angle);
        ctx.fillStyle = '#9898b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(labels[i], lx, ly);
    }
    
    // Draw data
    const maxScore = 100;
    models.forEach((model, idx) => {
        const color = CHART_COLORS[idx % CHART_COLORS.length];
        const scores = benchmarkKeys.map(k => model.benchmarks?.[k] || 0);
        
        ctx.beginPath();
        scores.forEach((score, i) => {
            const value = score / maxScore;
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const x = centerX + radius * value * Math.cos(angle);
            const y = centerY + radius * value * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fillStyle = color + '30';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw points
        scores.forEach((score, i) => {
            const value = score / maxScore;
            const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
            const x = centerX + radius * value * Math.cos(angle);
            const y = centerY + radius * value * Math.sin(angle);
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    });
    
    // Draw legend
    drawLegend(ctx, models, width, height);
}

function drawBarChart(ctx, models, width, height) {
    const benchmarkKeys = ['mmlu', 'humaneval', 'math', 'gpqa', 'ifeval'];
    const labels = benchmarkKeys.map(k => BENCHMARK_LABELS[k]);
    
    const padding = { top: 30, bottom: 50, left: 50, right: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    const groupWidth = chartWidth / labels.length;
    const barWidth = Math.min((groupWidth * 0.7) / models.length, 20);
    const groupPadding = groupWidth * 0.15;
    
    // Draw axes
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    
    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.stroke();
    
    // X axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();
    
    // Y axis labels and grid lines
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const y = padding.top + chartHeight - (chartHeight / ySteps) * i;
        const value = (100 / ySteps) * i;
        
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.stroke();
        
        ctx.fillStyle = '#6868a0';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(value + '%', padding.left - 8, y);
    }
    
    // Draw bars
    models.forEach((model, modelIdx) => {
        const color = CHART_COLORS[modelIdx % CHART_COLORS.length];
        
        labels.forEach((label, labelIdx) => {
            const score = model.benchmarks?.[benchmarkKeys[labelIdx]] || 0;
            const x = padding.left + groupPadding + labelIdx * groupWidth + modelIdx * barWidth;
            const barHeight = (score / 100) * chartHeight;
            const y = padding.top + chartHeight - barHeight;
            
            // Bar with rounded top
            const radius = 3;
            ctx.beginPath();
            ctx.moveTo(x, padding.top + chartHeight);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
            ctx.lineTo(x + barWidth, padding.top + chartHeight);
            ctx.closePath();
            
            ctx.fillStyle = color + '80';
            ctx.fill();
            
            // Score text on top of bar
            if (score > 0) {
                ctx.fillStyle = color;
                ctx.font = '9px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(score.toFixed(1) + '%', x + barWidth / 2, y - 4);
            }
        });
    });
    
    // X axis labels
    labels.forEach((label, i) => {
        const x = padding.left + groupPadding + i * groupWidth + (groupWidth * 0.7) / 2;
        ctx.fillStyle = '#9898b8';
        ctx.font = '11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(label, x, padding.top + chartHeight + 8);
    });
    
    // Draw legend
    drawLegend(ctx, models, width, height);
}

function drawLegend(ctx, models, width, height) {
    const legendY = height - 8;
    let xOffset = width / 2 - (models.length * 100) / 2;
    
    models.forEach((model, idx) => {
        const color = CHART_COLORS[idx % CHART_COLORS.length];
        
        // Color box
        ctx.fillStyle = color;
        ctx.fillRect(xOffset, legendY - 6, 10, 10);
        
        // Label
        ctx.fillStyle = '#9898b8';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Truncate long names
        let name = model.model;
        if (name.length > 20) name = name.substring(0, 18) + '…';
        
        ctx.fillText(name, xOffset + 16, legendY);
        xOffset += Math.min(name.length * 7 + 30, 160);
    });
}

// ===== Column Configuration =====

// Default column definitions
const COLUMN_DEFS = [
    { id: 'provider', label: 'Provider', desc: 'Model provider name', alwaysOn: true, default: true },
    { id: 'model', label: 'Model', desc: 'Model name and description', alwaysOn: true, default: true },
    { id: 'input', label: 'Input Price', desc: 'Cost per token for input/prompt', alwaysOn: false, default: true },
    { id: 'output', label: 'Output Price', desc: 'Cost per token for output/completion', alwaysOn: false, default: true },
    { id: 'input-cached', label: 'Cached Input', desc: 'Cost per token for cached input (cache hit)', alwaysOn: false, default: false },
    { id: 'context', label: 'Context Window', desc: 'Maximum context length', alwaysOn: false, default: true },
    { id: 'benchmark-mmlu', label: 'MMLU', desc: 'Knowledge benchmark score', alwaysOn: false, default: false, benchmark: 'mmlu' },
    { id: 'benchmark-humaneval', label: 'HumanEval', desc: 'Code generation score', alwaysOn: false, default: false, benchmark: 'humaneval' },
    { id: 'benchmark-math', label: 'MATH', desc: 'Math reasoning score', alwaysOn: false, default: false, benchmark: 'math' },
    { id: 'benchmark-gpqa', label: 'GPQA', desc: 'Graduate-level Q&A score', alwaysOn: false, default: false, benchmark: 'gpqa' },
    { id: 'benchmark-ifeval', label: 'IFEval', desc: 'Instruction following score', alwaysOn: false, default: false, benchmark: 'ifeval' },
];

// Load saved column config from localStorage, or use defaults
function getColumnConfig() {
    try {
        const saved = localStorage.getItem('ai-cost-columns');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {}
    // Return default config
    const config = {};
    COLUMN_DEFS.forEach(col => {
        config[col.id] = col.default;
    });
    return config;
}

function saveColumnConfig(config) {
    try {
        localStorage.setItem('ai-cost-columns', JSON.stringify(config));
    } catch (e) {}
}

function initColumnConfig() {
    const modal = document.getElementById('columns-modal');
    const closeBtn = document.getElementById('columns-modal-close');
    const openBtn = document.getElementById('columns-btn');
    const togglesContainer = document.getElementById('column-toggles');
    const applyBtn = document.getElementById('columns-apply');
    const resetBtn = document.getElementById('columns-reset');
    
    // Open modal
    openBtn.addEventListener('click', () => {
        renderColumnToggles(togglesContainer);
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
    
    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
    
    // Apply changes
    applyBtn.addEventListener('click', () => {
        const checkboxes = togglesContainer.querySelectorAll('input[type="checkbox"]');
        const config = {};
        checkboxes.forEach(cb => {
            config[cb.value] = cb.checked;
        });
        saveColumnConfig(config);
        applyColumnConfig(config);
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    });
    
    // Reset to defaults
    resetBtn.addEventListener('click', () => {
        const config = {};
        COLUMN_DEFS.forEach(col => {
            config[col.id] = col.default;
        });
        renderColumnToggles(togglesContainer, config);
    });
    
    // Apply initial config
    const config = getColumnConfig();
    applyColumnConfig(config);
}

function renderColumnToggles(container, configOverride) {
    const config = configOverride || getColumnConfig();
    container.innerHTML = '';
    
    COLUMN_DEFS.forEach(col => {
        const isChecked = config[col.id] !== undefined ? config[col.id] : col.default;
        const isDisabled = col.alwaysOn;
        
        const item = document.createElement('label');
        item.className = `column-toggle-item${isDisabled ? ' disabled' : ''}`;
        item.innerHTML = `
            <input type="checkbox" value="${col.id}" ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
            <div>
                <div class="column-toggle-label">${col.label}</div>
                <div class="column-toggle-desc">${col.desc}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function applyColumnConfig(config) {
    const thead = document.querySelector('#pricing-table thead tr');
    const tbody = document.getElementById('pricing-body');
    
    // Build the header row based on config
    let headerHTML = '<th class="th-checkbox"><input type="checkbox" id="select-all-models" title="Select all models"></th>';
    
    COLUMN_DEFS.forEach(col => {
        const show = config[col.id] !== undefined ? config[col.id] : col.default;
        if (!show) return;
        const extraClass = col.id === 'model' ? ' sticky-col' : '';
        headerHTML += `<th data-sort="${col.id}" class="sortable${extraClass}">${col.label} <span class="sort-icon"></span></th>`;
    });
    
    thead.innerHTML = headerHTML;
    
    // Re-render table body with new columns
    const multiplier = currentTokenMultiplier;
    const cheapestInput = Math.min(...pricingData.map(m => m.inputPrice));
    const cheapestOutput = Math.min(...pricingData.map(m => m.outputPrice));
    
    tbody.innerHTML = '';
    
    pricingData.forEach(model => {
        const tr = document.createElement('tr');
        const scaledInput = model.inputPrice * multiplier;
        const scaledOutput = model.outputPrice * multiplier;
        const isCheapestInput = model.inputPrice === cheapestInput;
        const isCheapestOutput = model.outputPrice === cheapestOutput;
        
        let cellsHTML = '<td class="td-checkbox"></td>'; // checkbox placeholder
        
        COLUMN_DEFS.forEach(col => {
            const show = config[col.id] !== undefined ? config[col.id] : col.default;
            if (!show) return;
            
            switch (col.id) {
                case 'provider':
                    cellsHTML += `<td><span class="provider-badge provider-${model.providerClass}">${model.provider}</span></td>`;
                    break;
                case 'model':
                    cellsHTML += `
                        <td class="sticky-col">
                            <a href="#" class="model-link" data-model="${model.model}">
                                <span class="model-name">${model.model}</span>
                                <span class="model-link-icon">📊</span>
                            </a>
                            <br><small style="color: var(--text-muted); font-size: 0.8rem;">${model.description}</small>
                        </td>
                    `;
                    break;
                case 'input':
                    cellsHTML += `
                        <td>
                            <span class="price-cell ${isCheapestInput ? 'price-cheapest' : ''}">
                                ${formatCurrencyShort(scaledInput)}
                                ${isCheapestInput ? ' 🏆' : ''}
                            </span>
                        </td>
                    `;
                    break;
                case 'output':
                    cellsHTML += `
                        <td>
                            <span class="price-cell ${isCheapestOutput ? 'price-cheapest' : ''}">
                                ${formatCurrencyShort(scaledOutput)}
                                ${isCheapestOutput ? ' 🏆' : ''}
                            </span>
                        </td>
                    `;
                    break;
                case 'input-cached':
                    if (model.inputCachedPrice !== undefined) {
                        const scaledCached = model.inputCachedPrice * multiplier;
                        cellsHTML += `
                            <td>
                                <span class="price-cell price-cached">
                                    ${formatCurrencyShort(scaledCached)}
                                </span>
                                <br><small style="color: var(--text-muted); font-size: 0.75rem;">cache hit</small>
                            </td>
                        `;
                    } else {
                        cellsHTML += `<td><span class="text-muted">—</span></td>`;
                    }
                    break;
                case 'context':
                    cellsHTML += `<td><span class="context-cell">${model.contextWindow}</span></td>`;
                    break;
                default:
                    // Benchmark columns
                    if (col.benchmark && model.benchmarks && model.benchmarks[col.benchmark] !== undefined) {
                        const score = model.benchmarks[col.benchmark];
                        const best = Math.max(...pricingData.filter(m => m.benchmarks && m.benchmarks[col.benchmark]).map(m => m.benchmarks[col.benchmark]));
                        const isBest = score === best;
                        cellsHTML += `
                            <td>
                                <span class="benchmark-table-score ${isBest ? 'benchmark-table-best' : ''}">
                                    ${score.toFixed(1)}%
                                    ${isBest ? ' 👑' : ''}
                                </span>
                                <div class="benchmark-table-bar-bg">
                                    <div class="benchmark-table-bar" style="width: ${(score / 100) * 100}%"></div>
                                </div>
                            </td>
                        `;
                    } else {
                        cellsHTML += `<td><span class="text-muted">—</span></td>`;
                    }
                    break;
            }
        });
        
        tr.innerHTML = cellsHTML;
        tbody.appendChild(tr);
    });
    
    // Re-initialize checkboxes and sortable headers
    initModelCheckboxes();
    initSortableTable();
    
    // Re-apply provider filter after table re-render
    const searchInput = document.getElementById('model-search');
    if (searchInput) {
        searchInput.dispatchEvent(new Event('input'));
    }
    
    // Re-bind select-all
    const selectAll = document.getElementById('select-all-models');
    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const checkboxes = tbody.querySelectorAll('.model-checkbox');
            checkboxes.forEach(cb => cb.checked = selectAll.checked);
            // Update compare bar
            const compareBar = document.getElementById('compare-bar');
            const compareBarCount = document.getElementById('compare-bar-count');
            const checked = tbody.querySelectorAll('.model-checkbox:checked');
            if (checked.length > 0) {
                compareBarCount.textContent = `${checked.length} model${checked.length !== 1 ? 's' : ''} selected`;
                compareBar.classList.remove('hidden');
            } else {
                compareBar.classList.add('hidden');
            }
        });
    }
}

// ===== Provider Multi-Select Filter =====

function initProviderFilter() {
    const container = document.getElementById('provider-multiselect');
    const btn = document.getElementById('provider-filter-btn');
    const label = document.getElementById('provider-filter-label');
    const dropdown = document.getElementById('provider-filter-dropdown');
    const checkboxList = document.getElementById('provider-checkbox-list');
    const allCheckbox = document.getElementById('provider-all');
    const filterCount = document.getElementById('filter-count');
    
    // Get unique providers sorted alphabetically
    const providers = [...new Set(pricingData.map(m => m.provider))].sort();
    
    // Populate provider checkboxes
    providers.forEach(provider => {
        const item = document.createElement('label');
        item.className = 'provider-multiselect-option';
        item.innerHTML = `
            <input type="checkbox" value="${provider}" checked>
            <span>${provider}</span>
        `;
        checkboxList.appendChild(item);
    });
    
    // Update label text based on selected providers
    function updateLabel() {
        const checked = checkboxList.querySelectorAll('input[type="checkbox"]:checked');
        const allChecked = checked.length === providers.length;
        
        if (allChecked) {
            label.textContent = 'All Providers';
        } else if (checked.length === 0) {
            label.textContent = 'None selected';
        } else if (checked.length <= 2) {
            label.textContent = [...checked].map(cb => cb.value).join(', ');
        } else {
            label.textContent = `${checked.length} providers`;
        }
    }
    
    // Toggle dropdown
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        container.classList.toggle('open');
        dropdown.classList.toggle('hidden');
    });
    
    // Close dropdown on outside click
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            container.classList.remove('open');
            dropdown.classList.add('hidden');
        }
    });
    
    // "All Providers" checkbox logic
    allCheckbox.addEventListener('change', () => {
        const providerCheckboxes = checkboxList.querySelectorAll('input[type="checkbox"]');
        providerCheckboxes.forEach(cb => cb.checked = allCheckbox.checked);
        updateLabel();
        triggerFilter();
    });
    
    // Individual provider checkbox logic
    checkboxList.addEventListener('change', (e) => {
        const providerCheckboxes = checkboxList.querySelectorAll('input[type="checkbox"]');
        const checked = checkboxList.querySelectorAll('input[type="checkbox"]:checked');
        
        // Update "All Providers" checkbox state
        allCheckbox.checked = checked.length === providers.length;
        allCheckbox.indeterminate = checked.length > 0 && checked.length < providers.length;
        
        updateLabel();
        triggerFilter();
    });
    
    // Trigger the search/filter function
    function triggerFilter() {
        const searchInput = document.getElementById('model-search');
        if (searchInput) {
            searchInput.dispatchEvent(new Event('input'));
        }
        document.getElementById('select-all-models').checked = false;
    }
    
    // Get selected providers (returns array of provider names, or 'all')
    window.getSelectedProviders = function() {
        const allChecked = allCheckbox.checked;
        if (allChecked) return 'all';
        
        const checked = checkboxList.querySelectorAll('input[type="checkbox"]:checked');
        return [...checked].map(cb => cb.value);
    };
}

// ===== Model Checkboxes in Pricing Table =====

function initModelCheckboxes() {
    const tbody = document.getElementById('pricing-body');
    const selectAll = document.getElementById('select-all-models');
    const compareBar = document.getElementById('compare-bar');
    const compareBarCount = document.getElementById('compare-bar-count');
    const clearBtn = document.getElementById('compare-bar-clear');
    const compareBtn = document.getElementById('compare-bar-btn');
    
    // Add checkboxes to each row after table is rendered
    function addCheckboxes() {
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            // Check if checkbox already exists in this row
            if (row.querySelector('.model-checkbox')) return;
            
            // Check if the header has a checkbox column
            const headerCheckbox = document.querySelector('#pricing-table thead .th-checkbox');
            if (!headerCheckbox) return;
            
            // Look for existing td-checkbox cell (placed by applyColumnConfig)
            let checkboxCell = row.querySelector('.td-checkbox');
            const modelName = row.querySelector('.model-link')?.dataset?.model || '';
            
            if (checkboxCell) {
                // Populate the existing cell with the checkbox input
                checkboxCell.innerHTML = `<input type="checkbox" class="model-checkbox" value="${modelName}">`;
            } else {
                // No existing cell - create one and prepend it
                checkboxCell = document.createElement('td');
                checkboxCell.className = 'td-checkbox';
                checkboxCell.innerHTML = `<input type="checkbox" class="model-checkbox" value="${modelName}">`;
                row.insertBefore(checkboxCell, row.firstChild);
            }
        });
    }
    
    // Initial add
    addCheckboxes();
    
    // Re-add after sort (table re-renders)
    const observer = new MutationObserver(() => addCheckboxes());
    observer.observe(tbody, { childList: true });
    
    // Update compare bar visibility
    function updateCompareBar() {
        const checked = tbody.querySelectorAll('.model-checkbox:checked');
        const count = checked.length;
        
        if (count > 0) {
            compareBarCount.textContent = `${count} model${count !== 1 ? 's' : ''} selected`;
            compareBar.classList.remove('hidden');
            compareBtn.disabled = count < 2;
            compareBtn.textContent = count < 2 ? 'Select 2+ models' : `Compare ${count} Models`;
        } else {
            compareBar.classList.add('hidden');
        }
    }
    
    // Delegate checkbox changes
    tbody.addEventListener('change', (e) => {
        if (e.target.classList.contains('model-checkbox')) {
            updateCompareBar();
        }
    });
    
    // Select all
    selectAll.addEventListener('change', () => {
        const checkboxes = tbody.querySelectorAll('.model-checkbox');
        checkboxes.forEach(cb => cb.checked = selectAll.checked);
        updateCompareBar();
    });
    
    // Clear selection
    clearBtn.addEventListener('click', () => {
        const checkboxes = tbody.querySelectorAll('.model-checkbox');
        checkboxes.forEach(cb => cb.checked = false);
        selectAll.checked = false;
        updateCompareBar();
    });
    
    // Open benchmark comparison
    compareBtn.addEventListener('click', () => {
        const checked = tbody.querySelectorAll('.model-checkbox:checked');
        if (checked.length < 2) return;
        
        const selectedModels = [];
        checked.forEach(cb => {
            const model = pricingData.find(m => m.model === cb.value);
            if (model) selectedModels.push(model);
        });
        
        openBenchmarkComparison(selectedModels);
    });
}

// ===== Benchmark Comparison =====

function initBenchmarkComparison() {
    const modal = document.getElementById('benchmark-modal');
    const closeBtn = document.getElementById('benchmark-modal-close');
    
    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
}

function openBenchmarkComparison(models) {
    const modal = document.getElementById('benchmark-modal');
    const wrapper = document.getElementById('benchmark-comparison-wrapper');
    
    const benchmarkKeys = Object.keys(BENCHMARK_LABELS);
    
    // Find best score for each benchmark across selected models
    const bestScores = {};
    benchmarkKeys.forEach(key => {
        bestScores[key] = Math.max(...models.filter(m => m.benchmarks && m.benchmarks[key]).map(m => m.benchmarks[key]));
    });
    
    // Calculate overall average for each model
    models.forEach(model => {
        if (model.benchmarks) {
            const scores = benchmarkKeys.filter(k => model.benchmarks[k]).map(k => model.benchmarks[k]);
            model._avgBenchmark = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
        } else {
            model._avgBenchmark = 0;
        }
    });
    
    // Sort models by average benchmark score (best first)
    models.sort((a, b) => b._avgBenchmark - a._avgBenchmark);
    
    let html = `
        <div class="benchmark-comparison-intro">
            <p>Comparing <strong>${models.length} models</strong> across ${benchmarkKeys.length} benchmarks. Sorted by average score.</p>
        </div>
        <div class="benchmark-comparison-table-wrapper">
            <table class="benchmark-comparison-table">
                <thead>
                    <tr>
                        <th>Model</th>
                        <th>Provider</th>
                        ${benchmarkKeys.map(key => `<th>${BENCHMARK_LABELS[key]}</th>`).join('')}
                        <th>Avg Score</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    models.forEach(model => {
        const providerClass = model.providerClass || '';
        const avgScore = model._avgBenchmark || 0;
        const isTopAvg = avgScore === Math.max(...models.map(m => m._avgBenchmark));
        
        html += `
            <tr>
                <td><span class="model-name">${model.model}</span></td>
                <td><span class="provider-badge provider-${providerClass}">${model.provider}</span></td>
        `;
        
        benchmarkKeys.forEach(key => {
            const score = model.benchmarks?.[key];
            const best = bestScores[key];
            const isBest = score === best;
            
            if (score !== undefined && score !== null) {
                html += `
                    <td class="td-benchmark-score ${isBest ? 'td-benchmark-best' : ''}">
                        <span class="benchmark-score-value">${score.toFixed(1)}%</span>
                        <div class="benchmark-score-bar-bg">
                            <div class="benchmark-score-bar" style="width: ${(score / 100) * 100}%"></div>
                        </div>
                        ${isBest ? '<span class="benchmark-crown">👑</span>' : ''}
                    </td>
                `;
            } else {
                html += `<td class="td-benchmark-score">—</td>`;
            }
        });
        
        html += `
                <td class="td-benchmark-avg ${isTopAvg ? 'td-benchmark-best' : ''}">
                    <strong>${avgScore.toFixed(1)}%</strong>
                    ${isTopAvg ? ' 👑' : ''}
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        <div class="benchmark-comparison-legend">
            <span>👑 Best in category</span>
            <span class="legend-dot" style="background: var(--accent);"></span> Score bar
        </div>
    `;
    
    wrapper.innerHTML = html;
    
    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
