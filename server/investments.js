/**
 * Live Investment Price Fetcher for Indian Mutual Funds and Stocks
 */

// Memory cache for prices (expires every 1 minute for fast live updates)
const priceCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

// Popular Indian stock mapper (Company Name / Short Code -> Official NSE Ticker)
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
  'KOTAK BANK': 'KOTAKBANK.NS',
  'GLAND': 'GLAND.NS',
  'GLAND PHARMA': 'GLAND.NS',
  'IRFC': 'IRFC.NS',
  'INDIAN RAILWAY FINANCE': 'IRFC.NS',
  'LAURUSLABS': 'LAURUSLABS.NS',
  'LAURUS LABS': 'LAURUSLABS.NS',
  'OLAELEC': 'OLAELEC.NS',
  'OLA ELECTRIC': 'OLAELEC.NS',
  'TMCV': 'TATAMTRDVR.NS',
  'TMPV': 'TATAMOTORS.NS',
  'DEVYANI': 'DEVYANI.NS',
  'DELHIVERY': 'DELHIVERY.NS',
  'DEEPAKNTR': 'DEEPAKNTR.NS',
  'DEEPINDS': 'DEEPINDS.NS',
  'DELTACORP': 'DELTACORP.NS',
  'DELTA': 'DELTA.BO',
  'DEBOCK': 'DEBOCK.NS'
};

/**
 * Resolve stock ticker for any Indian stock symbol or name
 */
export function resolveStockSymbol(symbolOrName) {
  if (!symbolOrName) return null;
  const rawInput = symbolOrName.trim().toUpperCase();

  if (INDIAN_STOCK_MAP[rawInput]) {
    return INDIAN_STOCK_MAP[rawInput];
  }

  if (rawInput.endsWith('.NS') || rawInput.endsWith('.BO')) {
    return rawInput;
  }

  const cleanSymbol = rawInput.replace(/[^A-Z0-9]/g, '');
  if (!cleanSymbol) return null;
  return `${cleanSymbol}.NS`;
}

/**
 * Single symbol price query helper from Yahoo Finance API
 */
async function querySingleYahooSymbol(symbol) {
  if (!symbol) return null;
  const cacheKey = `stock_${symbol}`;
  const cached = priceCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.price;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });

    if (res.ok) {
      const data = await res.json();
      const meta = data?.chart?.result?.[0]?.meta;
      const livePrice = meta?.regularMarketPrice || meta?.chartPreviousClose || meta?.previousClose;
      if (livePrice && typeof livePrice === 'number' && livePrice > 0) {
        priceCache.set(cacheKey, { price: livePrice, timestamp: Date.now() });
        return livePrice;
      }
    }
  } catch (err) {
    // Ignore single query error
  }
  return null;
}

/**
 * Fetch live stock price with dual NSE (.NS) and BSE (.BO) fallback resolution
 */
export async function fetchStockPrice(symbolOrName) {
  if (!symbolOrName) return { price: null, symbol: null };
  const primarySymbol = resolveStockSymbol(symbolOrName);

  // 1. Try Primary Symbol (e.g. CANBK.NS or DELTA.BO)
  let price = await querySingleYahooSymbol(primarySymbol);
  if (price !== null) {
    return { price, symbol: primarySymbol };
  }

  // 2. Fallback: If .NS failed, try .BO (BSE India)
  if (primarySymbol && primarySymbol.endsWith('.NS')) {
    const bseSymbol = primarySymbol.replace(/\.NS$/, '.BO');
    price = await querySingleYahooSymbol(bseSymbol);
    if (price !== null) {
      return { price, symbol: bseSymbol };
    }
  }

  // 3. Fallback: If clean name without extension
  const rawClean = symbolOrName.trim().replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (rawClean && rawClean !== primarySymbol.replace(/\.NS$/, '')) {
    price = await querySingleYahooSymbol(`${rawClean}.NS`);
    if (price !== null) {
      return { price, symbol: `${rawClean}.NS` };
    }
    price = await querySingleYahooSymbol(`${rawClean}.BO`);
    if (price !== null) {
      return { price, symbol: `${rawClean}.BO` };
    }
  }

  return { price: null, symbol: primarySymbol };
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

  const searchQuery = cleanMFSearchQuery(rawQuery);
  try {
    const searchRes = await fetch(`https://api.mfapi.in/mf/search?q=${encodeURIComponent(searchQuery)}`);
    if (searchRes.ok) {
      const results = await searchRes.json();
      if (Array.isArray(results) && results.length > 0) {
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
    let resolvedSymbol = h.symbol || '';
    let priceStatus = 'ok';

    if (h.type === 'stock') {
      const stockResult = await fetchStockPrice(h.symbol || h.name);
      livePrice = stockResult.price;
      if (stockResult.symbol) {
        resolvedSymbol = stockResult.symbol;
      }
    } else if (h.type === 'mutual_fund') {
      liveData = await fetchMutualFundNav(h.symbol || h.name);
      livePrice = typeof liveData === 'object' && liveData ? liveData.price : liveData;
      if (typeof liveData === 'object' && liveData?.schemeCode) {
        resolvedSymbol = String(liveData.schemeCode);
      }
    }

    if (livePrice !== null && !isNaN(livePrice) && livePrice > 0) {
      const currentValuation = Math.round((livePrice * (h.quantity || 1)) * 100) / 100;
      const totalCost = Math.round(((h.buyPrice || livePrice) * (h.quantity || 1)) * 100) / 100;
      const unrealizedPnL = Math.round((currentValuation - totalCost) * 100) / 100;
      const pnlPercentage = totalCost > 0 ? Math.round(((unrealizedPnL / totalCost) * 100) * 100) / 100 : 0;

      updatedHoldings.push({
        ...h,
        symbol: resolvedSymbol || h.symbol || '',
        currentPrice: livePrice,
        currentValuation,
        unrealizedPnL,
        pnlPercentage,
        priceStatus: 'ok',
        lastPriceSyncAt: new Date().toISOString()
      });
    } else {
      // Flag symbol as needing manual symbol entry if live price could not be fetched
      priceStatus = (h.type === 'stock' || h.type === 'mutual_fund') ? 'invalid_symbol' : 'manual';
      const currentPrice = h.currentPrice || h.buyPrice || 0;
      const currentValuation = Math.round((currentPrice * (h.quantity || 1)) * 100) / 100;
      const totalCost = Math.round(((h.buyPrice || currentPrice) * (h.quantity || 1)) * 100) / 100;
      const unrealizedPnL = Math.round((currentValuation - totalCost) * 100) / 100;
      const pnlPercentage = totalCost > 0 ? Math.round(((unrealizedPnL / totalCost) * 100) * 100) / 100 : 0;

      updatedHoldings.push({
        ...h,
        symbol: resolvedSymbol || h.symbol || '',
        currentPrice,
        currentValuation,
        unrealizedPnL,
        pnlPercentage,
        priceStatus
      });
    }
  }

  return updatedHoldings;
}
