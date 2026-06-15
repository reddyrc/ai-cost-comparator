// ===== Live Pricing Fetcher =====
// Fetches the latest pricing from official provider documentation pages
// Uses CORS proxies to bypass cross-origin restrictions

const CORS_PROXIES = [
    // Try multiple proxy services with different URL formats
    { url: (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}` },
    { url: (u) => `https://corsproxy.io/?${encodeURIComponent(u)}` },
    { url: (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}` },
];

const PRICING_SOURCES = {
    openai: {
        name: 'OpenAI',
        url: 'https://openai.com/api/pricing/',
        parser: parseOpenAIPricing
    },
    anthropic: {
        name: 'Anthropic',
        url: 'https://docs.anthropic.com/en/docs/about-claude/pricing',
        parser: parseAnthropicPricing
    },
    google: {
        name: 'Google',
        url: 'https://ai.google.dev/pricing',
        parser: parseGooglePricing
    },
    deepseek: {
        name: 'DeepSeek',
        url: 'https://api-docs.deepseek.com/quick_start/pricing',
        parser: parseDeepSeekPricing
    }
};

// ===== Fetch with CORS proxy fallback =====
async function fetchWithProxy(url, timeout = 15000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    for (const proxy of CORS_PROXIES) {
        try {
            const proxyUrl = proxy.url(url);
            console.log(`Trying proxy: ${proxyUrl.substring(0, 60)}...`);
            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: { 'Accept': 'text/html,application/json,*/*' }
            });
            if (response.ok) {
                clearTimeout(timeoutId);
                const text = await response.text();
                if (text && text.length > 100) {
                    return text;
                }
            }
        } catch (e) {
            console.warn(`Proxy failed:`, e.message);
            continue;
        }
    }
    clearTimeout(timeoutId);
    throw new Error('Could not fetch pricing data. CORS proxies unavailable.');
}

// ===== OpenAI Pricing Parser =====
function parseOpenAIPricing(html) {
    const models = [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // Try to find pricing data in script tags or structured data
    const scripts = doc.querySelectorAll('script');
    for (const script of scripts) {
        const text = script.textContent || '';
        if (text.includes('pricing') && (text.includes('gpt') || text.includes('o1'))) {
            // Look for JSON-like pricing structures
            const matches = text.match(/"model"\s*:\s*"([^"]+)"[^}]*"input"\s*:\s*([0-9.]+)[^}]*"output"\s*:\s*([0-9.]+)/gi);
            if (matches) {
                matches.forEach(m => {
                    const modelMatch = m.match(/"model"\s*:\s*"([^"]+)"/i);
                    const inputMatch = m.match(/"input"\s*:\s*([0-9.]+)/i);
                    const outputMatch = m.match(/"output"\s*:\s*([0-9.]+)/i);
                    if (modelMatch && inputMatch && outputMatch) {
                        models.push({
                            model: modelMatch[1],
                            inputPrice: parseFloat(inputMatch[1]),
                            outputPrice: parseFloat(outputMatch[1])
                        });
                    }
                });
            }
        }
    }

    // Fallback: parse from HTML table
    if (models.length === 0) {
        const tables = doc.querySelectorAll('table');
        tables.forEach(table => {
            const rows = table.querySelectorAll('tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 3) {
                    const modelName = cells[0].textContent.trim();
                    const inputText = cells[1].textContent.trim();
                    const outputText = cells[2].textContent.trim();
                    const inputPrice = extractPrice(inputText);
                    const outputPrice = extractPrice(outputText);
                    if (modelName && inputPrice && outputPrice && 
                        (modelName.toLowerCase().includes('gpt') || modelName.toLowerCase().includes('o1') || modelName.toLowerCase().includes('o3'))) {
                        models.push({
                            model: modelName,
                            inputPrice,
                            outputPrice
                        });
                    }
                }
            });
        });
    }

    return models;
}

// ===== Anthropic Pricing Parser =====
function parseAnthropicPricing(html) {
    const models = [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // Look for pricing tables
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
                const text = row.textContent.toLowerCase();
                if (text.includes('claude') || text.includes('opus') || text.includes('sonnet') || text.includes('haiku')) {
                    const modelName = cells[0].textContent.trim();
                    // Anthropic tables typically have input/output prices
                    const prices = [];
                    cells.forEach(cell => {
                        const price = extractPrice(cell.textContent);
                        if (price) prices.push(price);
                    });
                    if (prices.length >= 2) {
                        models.push({
                            model: modelName,
                            inputPrice: prices[0],
                            outputPrice: prices[1]
                        });
                    }
                }
            }
        });
    });

    // Fallback: search for structured data in scripts
    if (models.length === 0) {
        const scripts = doc.querySelectorAll('script');
        for (const script of scripts) {
            const text = script.textContent || '';
            if (text.includes('pricing') && text.includes('claude')) {
                const priceMatches = text.match(/\$([0-9.]+)\/million/g);
                if (priceMatches && priceMatches.length >= 2) {
                    // Anthropic prices are per million tokens, convert to per 1K
                    models.push({
                        model: 'Claude (from docs)',
                        inputPrice: parseFloat(priceMatches[0].replace('$', '')) / 1000,
                        outputPrice: parseFloat(priceMatches[1].replace('$', '')) / 1000
                    });
                }
            }
        }
    }

    return models;
}

// ===== Google Pricing Parser =====
function parseGooglePricing(html) {
    const models = [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    // Look for Gemini pricing tables
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
                const text = row.textContent.toLowerCase();
                if (text.includes('gemini') || text.includes('flash') || text.includes('pro')) {
                    const modelName = cells[0].textContent.trim();
                    const prices = [];
                    cells.forEach(cell => {
                        const price = extractPrice(cell.textContent);
                        if (price) prices.push(price);
                    });
                    if (prices.length >= 2) {
                        models.push({
                            model: modelName,
                            inputPrice: prices[0],
                            outputPrice: prices[1]
                        });
                    }
                }
            }
        });
    });

    return models;
}

// ===== DeepSeek Pricing Parser =====
function parseDeepSeekPricing(html) {
    const models = [];
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    const tables = doc.querySelectorAll('table');
    tables.forEach(table => {
        const rows = table.querySelectorAll('tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
                const text = row.textContent.toLowerCase();
                if (text.includes('deepseek') || text.includes('v3') || text.includes('r1') || text.includes('coder')) {
                    const modelName = cells[0].textContent.trim();
                    const prices = [];
                    cells.forEach(cell => {
                        const price = extractPrice(cell.textContent);
                        if (price) prices.push(price);
                    });
                    if (prices.length >= 2) {
                        models.push({
                            model: modelName,
                            inputPrice: prices[0],
                            outputPrice: prices[1]
                        });
                    }
                }
            }
        });
    });

    return models;
}

// ===== Price Extraction Helper =====
function extractPrice(text) {
    // Match patterns like: $0.0025, $0.00015/1K, $3.00/M, etc.
    const patterns = [
        /\$([0-9.]+)\s*\/\s*1K/i,
        /\$([0-9.]+)\s*per\s*1K/i,
        /\$([0-9.]+)\s*\/\s*1k/i,
        /\$([0-9.]+)/,
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let price = parseFloat(match[1]);
            // If the text mentions "/M" or "/million", convert to per 1K
            if (text.match(/\/\s*M(illion)?/i) || text.match(/per\s+million/i)) {
                price = price / 1000;
            }
            if (!isNaN(price) && price > 0) {
                return price;
            }
        }
    }
    return null;
}

// ===== Main Refresh Function =====
async function refreshPricing(progressCallback) {
    const results = {
        success: [],
        failed: [],
        updatedModels: []
    };

    const providers = Object.keys(PRICING_SOURCES);
    
    for (let i = 0; i < providers.length; i++) {
        const key = providers[i];
        const source = PRICING_SOURCES[key];
        
        if (progressCallback) {
            progressCallback(`Fetching ${source.name} pricing...`, (i + 1) / providers.length);
        }

        try {
            const html = await fetchWithProxy(source.url);
            const parsedModels = source.parser(html);
            
            if (parsedModels.length > 0) {
                // Update the pricingData array with fetched values
                let updatedCount = 0;
                parsedModels.forEach(fetched => {
                    // Find matching models in our data
                    const matches = pricingData.filter(m => 
                        m.provider === source.name && 
                        (m.model.toLowerCase().includes(fetched.model.toLowerCase().replace(/^claude\s*/i, '').trim()) ||
                         fetched.model.toLowerCase().includes(m.model.toLowerCase().split(' ').slice(0, 2).join(' ').toLowerCase()))
                    );
                    
                    matches.forEach(match => {
                        const oldInput = match.inputPrice;
                        const oldOutput = match.outputPrice;
                        match.inputPrice = fetched.inputPrice;
                        match.outputPrice = fetched.outputPrice;
                        updatedCount++;
                        results.updatedModels.push({
                            model: match.model,
                            provider: match.provider,
                            oldInput,
                            newInput: fetched.inputPrice,
                            oldOutput,
                            newOutput: fetched.outputPrice
                        });
                    });
                });
                
                results.success.push({
                    provider: source.name,
                    count: updatedCount
                });
            } else {
                results.failed.push({
                    provider: source.name,
                    reason: 'Could not parse pricing data from page'
                });
            }
        } catch (error) {
            results.failed.push({
                provider: source.name,
                reason: error.message
            });
        }
    }

    return results;
}

// ===== UI for Refresh Button =====
function createRefreshUI() {
    // Insert refresh button at the top of the pricing section, between header and table
    const sectionHeader = document.querySelector('.pricing-section .section-header');
    const tableContainer = document.querySelector('.table-container');
    
    const refreshContainer = document.createElement('div');
    refreshContainer.className = 'refresh-container';
    refreshContainer.innerHTML = `
        <button id="refresh-btn" class="btn-refresh" title="Fetch latest pricing from provider documentation">
            <span class="refresh-icon">🔄</span>
            <span class="refresh-text">Refresh Prices</span>
        </button>
        <div id="refresh-status" class="refresh-status hidden">
            <div class="refresh-progress">
                <div class="refresh-progress-bar" id="refresh-progress-bar"></div>
            </div>
            <span id="refresh-status-text">Fetching...</span>
        </div>
    `;
    
    sectionHeader.parentNode.insertBefore(refreshContainer, tableContainer);
    
    document.getElementById('refresh-btn').addEventListener('click', handleRefreshClick);
}

async function handleRefreshClick() {
    const btn = document.getElementById('refresh-btn');
    const status = document.getElementById('refresh-status');
    const statusText = document.getElementById('refresh-status-text');
    const progressBar = document.getElementById('refresh-progress-bar');
    
    btn.disabled = true;
    btn.classList.add('refreshing');
    status.classList.remove('hidden');
    progressBar.style.width = '0%';
    
    let results;
    try {
        results = await refreshPricing((message, progress) => {
            statusText.textContent = message;
            progressBar.style.width = (progress * 100) + '%';
        });
    } catch (e) {
        results = { success: [], failed: [{ provider: 'All', reason: e.message }], updatedModels: [] };
    }
    
    // Show results
    progressBar.style.width = '100%';
    statusText.textContent = 'Complete!';
    
    // Build summary message
    let message = '';
    if (results.success.length > 0) {
        const updated = results.success.filter(s => s.count > 0);
        if (updated.length > 0) {
            message += `✅ Updated ${results.updatedModels.length} prices across ${updated.length} providers. `;
        }
    }
    if (results.failed.length > 0) {
        message += `⚠️ ${results.failed.length} provider(s) could not be reached. `;
    }
    
    // If all failed, show a helpful message
    if (results.success.length === 0) {
        message = '⚠️ Could not reach provider pricing pages. CORS proxies may be blocked in your browser. Try opening this page via a local server (e.g., "python3 -m http.server") or deploy to a web host.';
    }
    
    // Show toast notification
    showToast(message || 'No pricing updates were found.', results.failed.length > 0 ? 'warning' : 'success');
    
    // Re-render the pricing table and re-populate calculator/comparison
    initPricingTable();
    repopulateCalculator();
    repopulateComparison();
    
    // Update the last updated date
    setLastUpdatedDate();
    
    // Reset button after delay
    setTimeout(() => {
        btn.disabled = false;
        btn.classList.remove('refreshing');
        status.classList.add('hidden');
    }, 3000);
}

function repopulateCalculator() {
    const select = document.getElementById('calc-model');
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- Select a model --</option>';
    pricingData.forEach(model => {
        const option = document.createElement('option');
        option.value = model.model;
        option.textContent = `${model.provider} - ${model.model}`;
        select.appendChild(option);
    });
    if (currentValue) select.value = currentValue;
}

function repopulateComparison() {
    const container = document.getElementById('compare-checkboxes');
    container.innerHTML = '';
    pricingData.forEach(model => {
        const label = document.createElement('label');
        label.className = 'checkbox-label';
        label.innerHTML = `
            <input type="checkbox" value="${model.model}">
            <span>${model.provider} - ${model.model}</span>
        `;
        container.appendChild(label);
    });
}

// ===== Toast Notification =====
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    document.body.appendChild(toast);
    
    // Animate in
    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
