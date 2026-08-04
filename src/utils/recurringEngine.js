export function normalizeMerchant(merchant) {
  if (!merchant) return '';
  let str = merchant.toString().toLowerCase().trim();
  // Remove terminal # and numbers e.g. "Netflix #12345" -> "netflix"
  str = str.replace(/#\s*\d+$/g, '');
  // Remove long digit sequences (e.g. transaction reference codes like 83726194)
  str = str.replace(/\b\d{6,}\b/g, '');
  // Remove special characters / punctuation
  str = str.replace(/[^a-z0-9\s]/g, ' ');
  // Collapse whitespace
  return str.replace(/\s+/g, ' ').trim();
}

const SUBSCRIPTION_HINTS = [
  'netflix', 'spotify', 'hulu', 'disney', 'youtube', 'icloud', 'dropbox',
  'adobe', 'microsoft', 'amazon prime', 'patreon', 'membership', 'studio',
  'gym', 'openai', 'chatgpt', 'canva', 'notion', 'zoom', 'slack', 'github'
];

const RECURRING_HINTS = [
  'mortgage', 'rent', 'loan', 'insurance', 'utility', 'utilities',
  'electric', 'water', 'internet', 'phone', 'mobile', 'daycare',
  'tuition', 'lease', 'car payment', 'auto payment', 'hoa', 'property tax'
];

export function detectRecurring(transactions = [], dismissedPatterns = []) {
  const dismissedSet = new Set((dismissedPatterns || []).map(p => p.toLowerCase()));
  const expenses = transactions.filter(t => t.type === 'expense' && t.amount > 0);

  // Group by normalized merchant
  const groups = {};
  for (const tx of expenses) {
    const norm = normalizeMerchant(tx.merchant);
    if (!norm) continue;
    if (!groups[norm]) {
      groups[norm] = {
        normMerchant: norm,
        displayMerchant: tx.merchant,
        category: tx.category,
        account: tx.account,
        transactions: []
      };
    }
    groups[norm].transactions.push(tx);
  }

  const suggestions = [];

  for (const key of Object.keys(groups)) {
    if (dismissedSet.has(key)) continue;

    const group = groups[key];
    const txs = group.transactions;

    // Get unique dates
    const dateObjs = Array.from(new Set(txs.map(t => t.date)))
      .sort((a, b) => new Date(a) - new Date(b))
      .map(d => new Date(d));

    if (dateObjs.length < 2) continue; // Require at least 2 unique dates

    // Calculate intervals between consecutive dates
    const intervals = [];
    for (let i = 1; i < dateObjs.length; i++) {
      const diffMs = dateObjs[i] - dateObjs[i - 1];
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      intervals.push(diffDays);
    }

    if (intervals.length === 0) continue;

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Window classification
    let cadence = null;
    if (avgInterval >= 5 && avgInterval <= 9) cadence = 'weekly';
    else if (avgInterval >= 12 && avgInterval <= 17) cadence = 'biweekly';
    else if (avgInterval >= 24 && avgInterval <= 40) cadence = 'monthly';
    else if (avgInterval >= 75 && avgInterval <= 110) cadence = 'quarterly';
    else if (avgInterval >= 330 && avgInterval <= 400) cadence = 'annual';

    if (!cadence) continue; // Reject if interval doesn't fit windows

    // Amounts
    const amounts = txs.map(t => Math.abs(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxDev = Math.max(...amounts.map(a => Math.abs(a - avgAmount)));
    const variation = avgAmount > 0 ? (maxDev / avgAmount) : 0;

    // Hints matching
    const catLower = (group.category || '').toLowerCase();
    const isSubHint = SUBSCRIPTION_HINTS.some(h => key.includes(h)) || catLower.includes('subscription');
    const isRecHint = RECURRING_HINTS.some(h => key.includes(h)) || catLower.includes('utility') || catLower.includes('insurance') || catLower.includes('housing');

    let type = 'recurring';
    if (isSubHint) {
      type = 'subscription';
    } else if (isRecHint) {
      type = 'recurring';
    }

    // Amount variation checks
    const maxAllowedVariation = (type === 'subscription') ? 0.20 : 0.35;
    if (variation > maxAllowedVariation) continue;

    // False positive protection for unhinted merchants
    if (!isSubHint && !isRecHint) {
      if (dateObjs.length < 3) continue; // Requires at least 3 occurrences
      if (['weekly', 'biweekly'].includes(cadence)) continue; // Must be monthly, quarterly, or annual
      if (variation > 0.03) continue; // Must have <= 3% variation
    }

    // Confidence level
    const maxIntervalDev = Math.max(...intervals.map(i => Math.abs(i - avgInterval)));
    const isHighConfidence = dateObjs.length >= 3 && variation <= 0.12 && maxIntervalDev <= 5;
    const confidence = isHighConfidence ? 'High' : 'Likely';

    // Calculate monthly equivalent amount
    let monthlyEquivalent = avgAmount;
    if (cadence === 'weekly') monthlyEquivalent = (avgAmount * 52) / 12;
    else if (cadence === 'biweekly') monthlyEquivalent = (avgAmount * 26) / 12;
    else if (cadence === 'monthly') monthlyEquivalent = avgAmount;
    else if (cadence === 'quarterly') monthlyEquivalent = avgAmount / 3;
    else if (cadence === 'annual') monthlyEquivalent = avgAmount / 12;

    // Calculate next expected date based on last date + avgInterval
    const lastDate = dateObjs[dateObjs.length - 1];
    const nextDate = new Date(lastDate.getTime() + avgInterval * 24 * 60 * 60 * 1000);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    suggestions.push({
      id: `sug_${key}_${cadence}`,
      patternKey: key,
      merchant: group.displayMerchant,
      normMerchant: key,
      category: group.category || (type === 'subscription' ? 'Subscriptions' : 'Utilities'),
      account: group.account || 'Main Checking',
      cadence,
      type,
      occurrenceCount: dateObjs.length,
      averageAmount: avgAmount,
      monthlyEquivalent,
      confidence,
      variationPercent: (variation * 100).toFixed(1),
      nextDate: nextDateStr
    });
  }

  return suggestions;
}
