// ===== AI Cost Comparator - Application Logic =====

// Current token size multiplier (1 = per 1K, 100 = per 100K, 1000 = per 1M)
let currentTokenMultiplier = 1;

document.addEventListener('DOMContentLoaded', () => {
    initPricingTable();
    initSortableTable();
    initTokenSizeToggle();
    initModelCheckboxes();
    initCalculator();
    initComparison();
    initNavigation();
    initModelModal();
    initBenchmarkComparison();
    setLastUpdatedDate();
    createRefreshUI();
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
        });
    });
}

// ===== Pricing Table =====

function initPricingTable() {
    const tbody = document.getElementById('pricing-body');
    tbody.innerHTML = '';

    const multiplier = currentTokenMultiplier;

    // Find cheapest input and output prices for highlighting (using base prices)
    const cheapestInput = Math.min(...pricingData.map(m => m.inputPrice));
    const cheapestOutput = Math.min(...pricingData.map(m => m.outputPrice));

    pricingData.forEach(model => {
        const tr = document.createElement('tr');
        
        const scaledInput = model.inputPrice * multiplier;
        const scaledOutput = model.outputPrice * multiplier;
        
        const isCheapestInput = model.inputPrice === cheapestInput;
        const isCheapestOutput = model.outputPrice === cheapestOutput;

        tr.innerHTML = `
            <td>
                <span class="provider-badge provider-${model.providerClass}">${model.provider}</span>
            </td>
            <td>
                <a href="#" class="model-link" data-model="${model.model}">
                    <span class="model-name">${model.model}</span>
                    <span class="model-link-icon">📊</span>
                </a>
                <br><small style="color: var(--text-muted); font-size: 0.8rem;">${model.description}</small>
            </td>
            <td>
                <span class="price-cell ${isCheapestInput ? 'price-cheapest' : ''}">
                    ${formatCurrencyShort(scaledInput)}
                    ${isCheapestInput ? ' 🏆' : ''}
                </span>
            </td>
            <td>
                <span class="price-cell ${isCheapestOutput ? 'price-cheapest' : ''}">
                    ${formatCurrencyShort(scaledOutput)}
                    ${isCheapestOutput ? ' 🏆' : ''}
                </span>
            </td>
            <td><span class="context-cell">${model.contextWindow}</span></td>
        `;

        tbody.appendChild(tr);
    });
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
    
    rows.sort((a, b) => {
        let valA, valB;
        
        switch (column) {
            case 'provider':
                valA = a.cells[0].textContent.trim().toLowerCase();
                valB = b.cells[0].textContent.trim().toLowerCase();
                break;
            case 'model':
                valA = a.cells[1].textContent.trim().toLowerCase();
                valB = b.cells[1].textContent.trim().toLowerCase();
                break;
            case 'input':
                valA = parsePrice(a.cells[2].textContent);
                valB = parsePrice(b.cells[2].textContent);
                break;
            case 'output':
                valA = parsePrice(a.cells[3].textContent);
                valB = parsePrice(b.cells[3].textContent);
                break;
            case 'context':
                valA = parseContext(a.cells[4].textContent);
                valB = parseContext(b.cells[4].textContent);
                break;
            default:
                return 0;
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

// ===== Calculator =====

function initCalculator() {
    const select = document.getElementById('calc-model');
    const calcBtn = document.getElementById('calc-btn');
    const resultsContent = document.querySelector('.results-content');
    const placeholder = document.querySelector('.results-placeholder');

    // Populate model dropdown
    pricingData.forEach(model => {
        const option = document.createElement('option');
        option.value = model.model;
        option.textContent = `${model.provider} - ${model.model}`;
        select.appendChild(option);
    });

    calcBtn.addEventListener('click', () => {
        const selectedModel = select.value;
        if (!selectedModel) {
            alert('Please select a model first.');
            return;
        }

        const model = pricingData.find(m => m.model === selectedModel);
        if (!model) return;

        const inputTokens = parseInt(document.getElementById('calc-input-tokens').value) || 0;
        const outputTokens = parseInt(document.getElementById('calc-output-tokens').value) || 0;
        const requests = parseInt(document.getElementById('calc-requests').value) || 0;

        if (inputTokens <= 0 || outputTokens <= 0 || requests <= 0) {
            alert('Please enter positive numbers for all fields.');
            return;
        }

        const costs = calculateCost(inputTokens, outputTokens, requests, model.inputPrice, model.outputPrice);

        // Update results
        document.getElementById('result-per-request').textContent = formatCurrency(costs.costPerRequest);
        document.getElementById('result-input-monthly').textContent = formatCurrency(costs.monthlyInputCost);
        document.getElementById('result-output-monthly').textContent = formatCurrency(costs.monthlyOutputCost);
        document.getElementById('result-total-monthly').textContent = formatCurrency(costs.totalMonthlyCost);
        document.getElementById('result-annual').textContent = formatCurrency(costs.annualCost);

        // Show results, hide placeholder
        placeholder.classList.add('hidden');
        resultsContent.classList.remove('hidden');
    });

    // Allow Enter key to trigger calculation
    const inputs = [document.getElementById('calc-input-tokens'), document.getElementById('calc-output-tokens'), document.getElementById('calc-requests')];
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') calcBtn.click();
        });
    });
}

// ===== Comparison =====

function initComparison() {
    const checkboxContainer = document.getElementById('compare-checkboxes');
    const compareBtn = document.getElementById('compare-btn');
    const comparisonWrapper = document.querySelector('.comparison-table-wrapper');
    const placeholder = document.querySelector('#comparison-results .results-placeholder');
    const comparisonBody = document.getElementById('comparison-body');

    // Populate checkboxes
    pricingData.forEach(model => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${model.model}">
            <span>${model.provider} - ${model.model}</span>
        `;
        checkboxContainer.appendChild(label);
    });

    compareBtn.addEventListener('click', () => {
        const checkedBoxes = document.querySelectorAll('#compare-checkboxes input[type="checkbox"]:checked');
        
        if (checkedBoxes.length < 2) {
            alert('Please select at least 2 models to compare.');
            return;
        }

        const inputTokens = parseInt(document.getElementById('compare-input-tokens').value) || 1000;
        const outputTokens = parseInt(document.getElementById('compare-output-tokens').value) || 500;
        const requests = parseInt(document.getElementById('compare-requests').value) || 10000;

        if (inputTokens <= 0 || outputTokens <= 0 || requests <= 0) {
            alert('Please enter positive numbers for all fields.');
            return;
        }

        // Calculate costs for each selected model
        const results = [];
        checkedBoxes.forEach(checkbox => {
            const model = pricingData.find(m => m.model === checkbox.value);
            if (model) {
                const costs = calculateCost(inputTokens, outputTokens, requests, model.inputPrice, model.outputPrice);
                results.push({
                    ...model,
                    ...costs
                });
            }
        });

        // Find cheapest
        const cheapest = Math.min(...results.map(r => r.totalMonthlyCost));

        // Sort by total monthly cost (cheapest first)
        results.sort((a, b) => a.totalMonthlyCost - b.totalMonthlyCost);

        // Render comparison table
        comparisonBody.innerHTML = '';
        results.forEach(result => {
            const isCheapest = result.totalMonthlyCost === cheapest;
            const percentageDiff = ((result.totalMonthlyCost - cheapest) / cheapest * 100).toFixed(1);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="model-name">${result.model}</span>
                    <br><span class="provider-badge provider-${result.providerClass}">${result.provider}</span>
                </td>
                <td>${result.provider}</td>
                <td><strong>${formatCurrency(result.costPerRequest)}</strong></td>
                <td><strong>${formatCurrency(result.totalMonthlyCost)}</strong></td>
                <td><strong>${formatCurrency(result.annualCost)}</strong></td>
                <td>
                    ${isCheapest 
                        ? '<span class="cheapest-badge">✅ Cheapest</span>' 
                        : `<span class="more-expensive">${percentageDiff}% more</span>`
                    }
                </td>
            `;
            comparisonBody.appendChild(tr);
        });

        // Show comparison table, hide placeholder
        placeholder.classList.add('hidden');
        comparisonWrapper.classList.remove('hidden');
    });

    // Allow Enter key to trigger comparison
    const inputs = [document.getElementById('compare-input-tokens'), document.getElementById('compare-output-tokens'), document.getElementById('compare-requests')];
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') compareBtn.click();
        });
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
    
    // Set docs link
    const docsLink = document.getElementById('modal-docs-link');
    docsLink.href = model.docsUrl || '#';
    
    // Set pricing
    document.getElementById('modal-input-price').textContent = formatCurrency(model.inputPrice);
    document.getElementById('modal-output-price').textContent = formatCurrency(model.outputPrice);
    document.getElementById('modal-context').textContent = model.contextWindow;
    
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
            // Check if checkbox already exists
            if (row.querySelector('.model-checkbox')) return;
            
            const checkboxCell = document.createElement('td');
            checkboxCell.className = 'td-checkbox';
            const modelName = row.querySelector('.model-link')?.dataset?.model || '';
            checkboxCell.innerHTML = `<input type="checkbox" class="model-checkbox" value="${modelName}">`;
            row.insertBefore(checkboxCell, row.firstChild);
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
