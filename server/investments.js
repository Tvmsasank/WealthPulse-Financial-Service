/**
 * Live Investment Price Fetcher for Indian Mutual Funds and Stocks
 */

// Memory cache for prices (expires every 5 minutes)
const priceCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

// Popular Indian stock mapper (Company Name -> NSE Ticker)
const INDIAN_STOCK_MAP = {
  'CANARA BANK': 'CANBK.NS',
  'CANARA': 'CANBK.NS',
  'CANBK': 'CANBK.NS',
  'RELIANCE': 'RELIANCE.NS',
  'RELIANCE INDUSTRIES': 'RELIANCE.NS',
  'TATA MOTORS': 'TATAMOTORS.NS',
  'TATAMOTORS': 'TATAMOTORS.NS',
  'INFOSYS': 'INFY.NS',
  'INFY': 'INFY.NS',
  'TCS': 'TCS.NS',
  'TATA CONSULTANCY SERVICES': 'TCS.NS',
  'HDFC BANK': 'HDFCBANK.NS',
  'HDFCBANK': 'HDFCBANK.NS',
  'ICICI BANK': 'ICICIBANK.NS',
  'ICICIBANK': 'ICICIBANK.NS',
  'TATA STEEL': 'TATASTEEL.NS',
  'TATASTEEL': 'TATASTEEL.NS',
  'SBI': 'SBIN.NS',
  'STATE BANK OF INDIA': 'SBIN.NS',
  'SBIN': 'SBIN.NS',
  'ITC': 'ITC.NS',
  'BAJAJ HOUSING': 'BAJAJHFL.NS',
  'BAJAJHFL': 'BAJAJHFL.NS',
  'ZOMATO': 'ZOMATO.NS',
  'PAYTM': 'PAYTM.NS',
  'JIO FINANCIAL': 'JIOFIN.NS',
  'JIOFIN': 'JIOFIN.NS',
  'WIPRO': 'WIPRO.NS',
  'BHARTI AIRTEL': 'BHARTIARTL.NS',
  'AIRTEL': 'BHARTIARTL.NS',
  'L&T': 'LT.NS',
  'LARSEN': 'LT.NS',
  'AXIS BANK': 'AXISBANK.NS',
  'KOTAK BANK': 'KOTAKBANK.NS'
};

/**
 * Fetch live stock price using Yahoo Finance API (supports NSE/BSE e.g. CANBK.NS, RELIANCE.NS, TATAMOTORS.NS)
 */
export async function fetchStockPrice(symbolOrName) {
  if (!symbolOrName) return null;
  const rawInput = symbolOrName.trim().toUpperCase();

  // 1. Check Indian stock map dictionary
  let formattedSymbol = INDIAN_STOCK_MAP[rawInput];

  if (!formattedSymbol) {
    // 2. Clean input (remove spaces / special characters)
    const cleanSymbol = rawInput.replace(/[^A-Z0-9\.]/g, '');
    if (!cleanSymbol) return null;
    formattedSymbol = cleanSymbol.includes('.') ? cleanSymbol : `${cleanSymbol}.NS`;
  }

  const cacheKey = `stock_${formattedSymbol}`;
  const cached = priceCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.price;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formattedSymbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      // regularMarketPrice or chartPreviousClose (Last Traded Price when market is closed)
      const regularMarketPrice = meta?.regularMarketPrice || meta?.chartPreviousClose;
      if (regularMarketPrice && typeof regularMarketPrice === 'number' && regularMarketPrice > 0) {
        priceCache.set(cacheKey, { price: regularMarketPrice, timestamp: Date.now() });
        return regularMarketPrice;
      }
    }
  } catch (err) {
    console.error(`Failed to fetch live stock price for ${formattedSymbol}:`, err.message);
  }

  return null;
}

/**
 * Clean complex fund names for accurate API search
 */
function cleanMFSearchQuery(rawText) {
  if (!rawText) return '';
  const trimmed = rawText.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;

  return trimmed
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\|/g, '')
    .replace(/inida/gi, 'India')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch live Mutual Fund NAV from mfapi.in (100% accurate Indian MF API down to 4 decimal places)
 */
export async function fetchMutualFundNav(schemeNameOrCode) {
  if (!schemeNameOrCode) return null;
  const rawQuery = schemeNameOrCode.trim();
  const cacheKey = `mf_${rawQuery.toLowerCase()}`;

  const cached = priceCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached;
  }

  // 1. If numeric scheme code (e.g., 122639 for Parag Parikh, 148457 for Nippon India)
  if (/^\d+$/.test(rawQuery)) {
    try {
      const res = await fetch(`https://api.mfapi.in/mf/${rawQuery}`);
      if (res.ok) {
        const data = await res.json();
        const latestNav = parseFloat(data?.data?.[0]?.nav);
        if (!isNaN(latestNav) && latestNav > 0) {
          const result = { price: latestNav, schemeCode: rawQuery, schemeName: data?.meta?.scheme_name };
          priceCache.set(cacheKey, { ...result, timestamp: Date.now() });
          return result;
        }
      }
    } catch (err) {
      console.error(`mfapi code lookup error for ${rawQuery}:`, err.message);
    }
  }

  // 2. Search by Cleaned Fund Name on mfapi.in
  const searchQuery = cleanMFSearchQuery(rawQuery);
  try {
    const searchRes = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(searchQuery)}`);
    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
        // Prioritize Direct Plan Growth > Growth > First Match
        let bestMatch = results.find(r => 
          r.schemeName.toLowerCase().includes('direct') && r.schemeName.toLowerCase().includes('growth')
        );
        if (!bestMatch) {
          bestMatch = results.find(r => r.schemeName.toLowerCase().includes('growth'));
        }
        if (!bestMatch) {
          bestMatch = results[0];
        }

        if (bestMatch && bestMatch.schemeCode) {
          const detailRes = await fetch(`https://api.mfapi.in/mf/${bestMatch.schemeCode}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            const latestNav = parseFloat(detailData?.data?.[0]?.nav);
            if (!isNaN(latestNav) && latestNav > 0) {
              const result = { price: latestNav, schemeCode: String(bestMatch.schemeCode), schemeName: bestMatch.schemeName };
              priceCache.set(cacheKey, { ...result, timestamp: Date.now() });
              return result;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`mfapi search error for ${searchQuery}:`, err.message);
  }

  // 3. Fallback to AMFI NAVAll.txt
  try {
    const res = await fetch('https://www.amfiindia.com/spages/NAVAll.txt', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');

      for (const line of lines) {
        const parts = line.split(';');
        if (parts.length >= 5) {
          const code = parts[0]?.trim();
          const name = parts[3]?.trim();
          const navStr = parts[4]?.trim();

          if (code === searchQuery || (name && name.toLowerCase().includes(searchQuery.toLowerCase()))) {
            const nav = parseFloat(navStr);
            if (!isNaN(nav) && nav > 0) {
              const result = { price: nav, schemeCode: code, schemeName: name };
              priceCache.set(cacheKey, { ...result, timestamp: Date.now() });
              return result;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(`Failed to fetch AMFI MF NAV for ${rawQuery}:`, err.message);
  }

  return null;
}

/**
 * Batch price updates for array of holdings
 */
export async function refreshHoldingsPrices(holdings = []) {
  const updatedHoldings = [];

  for (const h of holdings) {
    let liveData = null;
    let livePrice = null;

    if (h.type === 'stock') {
      livePrice = await fetchStockPrice(h.symbol || h.name);
    } else if (h.type === 'mutual_fund') {
      liveData = await fetchMutualFundNav(h.symbol || h.name);
      livePrice = typeof liveData === 'object' && liveData ? liveData.price : liveData;
    }

    if (livePrice !== null && !isNaN(livePrice) && livePrice > 0) {
      const currentValuation = Math.round((livePrice * (h.quantity || 1)) * 100) / 100;
      const totalCost = Math.round(((h.buyPrice || livePrice) * (h.quantity || 1)) * 100) / 100;
      const unrealizedPnL = Math.round((currentValuation - totalCost) * 100) / 100;
      const pnlPercentage = totalCost > 0 ? Math.round(((unrealizedPnL / totalCost) * 100) * 100) / 100 : 0;

      updatedHoldings.push({
        ...h,
        symbol: h.type === 'stock' ? (INDIAN_STOCK_MAP[h.name.toUpperCase()] || h.symbol || '') : ((typeof liveData === 'object' && liveData?.schemeCode) ? liveData.schemeCode : (h.symbol || '')),
        currentPrice: livePrice,
        currentValuation,
        unrealizedPnL,
        pnlPercentage,
        lastPriceSyncAt: new Date().toISOString()
      });
    } else {
      // Keep existing price if live API call failed or for manual assets
      const currentPrice = h.currentPrice || h.buyPrice || 0;
      const currentValuation = Math.round((currentPrice * (h.quantity || 1)) * 100) / 100;
      const totalCost = Math.round(((h.buyPrice || currentPrice) * (h.quantity || 1)) * 100) / 100;
      const unrealizedPnL = Math.round((currentValuation - totalCost) * 100) / 100;
      const pnlPercentage = totalCost > 0 ? Math.round(((unrealizedPnL / totalCost) * 100) * 100) / 100 : 0;

      updatedHoldings.push({
        ...h,
        currentPrice,
        currentValuation,
        unrealizedPnL,
        pnlPercentage
      });
    }
  }

  return updatedHoldings;
}
