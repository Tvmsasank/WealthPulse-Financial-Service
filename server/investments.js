/**
 * Live Investment Price Fetcher for Indian Mutual Funds, Stocks & Cryptocurrencies
 */

// Memory cache for prices (expires every 1 minute for fast live updates)
const priceCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

// Popular Indian stock mapper (Company Name / Short Code -> Official NSE Ticker)
const INDIAN_STOCK_MAP = {
  'CANARA BANK': 'CANBK.NS',
  'CANARA': 'CANBK.NS',
  'CANBK': 'CANBK.NS',
  'CANBK.NS': 'CANBK.NS',
  'RELIANCE': 'RELIANCE.NS',
  'RELIANCE INDUSTRIES': 'RELIANCE.NS',
  'TATA MOTORS': 'TMPV.NS',
  'TATAMOTORS': 'TMPV.NS',
  'TATAMOTORS.NS': 'TMPV.NS',
  'TMCV': 'TMCV.NS',
  'TMCV.NS': 'TMCV.NS',
  'TMPV': 'TMPV.NS',
  'TMPV.NS': 'TMPV.NS',
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
  'DEBIL': 'DBEIL.NS',
  'DEBIL.NS': 'DBEIL.NS',
  'DBEIL': 'DBEIL.NS',
  'DBEIL.NS': 'DBEIL.NS',
  'DEEPAK BUILDERS': 'DBEIL.NS',
  'DEEPAK BUILDERS & ENGINEERS': 'DBEIL.NS',
  'DEVYANI': 'DEVYANI.NS',
  'DELHIVERY': 'DELHIVERY.NS',
  'DEEPAKNTR': 'DEEPAKNTR.NS',
  'DEEPINDS': 'DEEPINDS.NS',
  'DELTACORP': 'DELTACORP.NS',
  'DELTA': 'DELTA.BO',
  'DEBOCK': 'DEBOCK.NS'
};

// Popular Crypto mapper (Coin Name / Symbol -> Yahoo Finance INR Ticker)
const CRYPTO_MAP = {
  'BTC': 'BTC-INR',
  'BITCOIN': 'BTC-INR',
  'BTC-INR': 'BTC-INR',
  'ETH': 'ETH-INR',
  'ETHEREUM': 'ETH-INR',
  'ETH-INR': 'ETH-INR',
  'SOL': 'SOL-INR',
  'SOLANA': 'SOL-INR',
  'SOL-INR': 'SOL-INR',
  'DOGE': 'DOGE-INR',
  'DOGECOIN': 'DOGE-INR',
  'DOGE-INR': 'DOGE-INR',
  'XRP': 'XRP-INR',
  'RIPPLE': 'XRP-INR',
  'XRP-INR': 'XRP-INR',
  'USDT': 'USDT-INR',
  'TETHER': 'USDT-INR',
  'USDT-INR': 'USDT-INR',
  'BNB': 'BNB-INR',
  'BINANCE COIN': 'BNB-INR',
  'BNB-INR': 'BNB-INR',
  'ADA': 'ADA-INR',
  'CARDANO': 'ADA-INR',
  'ADA-INR': 'ADA-INR',
  'SHIB': 'SHIB-INR',
  'SHIBA INU': 'SHIB-INR',
  'SHIB-INR': 'SHIB-INR',
  'MATIC': 'MATIC-INR',
  'POLYGON': 'MATIC-INR',
  'MATIC-INR': 'MATIC-INR',
  'AVAX': 'AVAX-INR',
  'AVALANCHE': 'AVAX-INR',
  'AVAX-INR': 'AVAX-INR',
  'DOT': 'DOT-INR',
  'POLKADOT': 'DOT-INR',
  'DOT-INR': 'DOT-INR',
  'TRX': 'TRX-INR',
  'TRON': 'TRX-INR',
  'TRX-INR': 'TRX-INR'
};

/**
 * Resolve stock ticker for any Indian stock symbol or name
 */
export function resolveStockSymbol(symbolOrName) {
  if (!symbolOrName) return null;
  const rawInput = symbolOrName.trim().toUpperCase();

  // 1. Check Indian stock map dictionary FIRST
  if (INDIAN_STOCK_MAP[rawInput]) {
    return INDIAN_STOCK_MAP[rawInput];
  }

  // 2. If already ends with .NS or .BO
  if (rawInput.endsWith('.NS') || rawInput.endsWith('.BO')) {
    return rawInput;
  }

  const cleanSymbol = rawInput.replace(/[^A-Z0-9]/g, '');
  if (!cleanSymbol) return null;
  return `${cleanSymbol}.NS`;
}

/**
 * Resolve crypto ticker for any cryptocurrency
 */
export function resolveCryptoSymbol(symbolOrName) {
  if (!symbolOrName) return 'BTC-INR';
  const raw = symbolOrName.trim().toUpperCase();

  if (CRYPTO_MAP[raw]) {
    return CRYPTO_MAP[raw];
  }

  if (raw.endsWith('-INR') || raw.endsWith('-USD')) {
    return raw;
  }

  const clean = raw.replace(/[^A-Z0-9]/g, '');
  return `${clean}-INR`;
}

/**
 * Single symbol price query helper from Yahoo Finance API
 */
async function querySingleYahooSymbol(symbol) {
  if (!symbol) return null;
  const cacheKey = `price_${symbol}`;
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

  // 1. Try Primary Symbol (e.g. TMCV.NS, TMPV.NS, DBEIL.NS)
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
 * Fetch live Cryptocurrency price in INR
 */
export async function fetchCryptoPrice(symbolOrName) {
  if (!symbolOrName) return { price: null, symbol: null };
  const resolved = resolveCryptoSymbol(symbolOrName);

  let price = await querySingleYahooSymbol(resolved);
  if (price !== null) {
    return { price, symbol: resolved };
  }

  // Fallback: Try -USD converted to INR (~ ₹87)
  const usdSymbol = resolved.replace('-INR', '-USD');
  const usdPrice = await querySingleYahooSymbol(usdSymbol);
  if (usdPrice !== null) {
    const inrRate = 87.0;
    return { price: Math.round(usdPrice * inrRate * 100) / 100, symbol: resolved };
  }

  return { price: null, symbol: resolved };
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
    } else if (h.type === 'crypto' || h.type === 'cryptocurrency') {
      const cryptoResult = await fetchCryptoPrice(h.symbol || h.name);
      livePrice = cryptoResult.price;
      if (cryptoResult.symbol) {
        resolvedSymbol = cryptoResult.symbol;
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
      priceStatus = (h.type === 'stock' || h.type === 'mutual_fund' || h.type === 'crypto') ? 'invalid_symbol' : 'manual';
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
