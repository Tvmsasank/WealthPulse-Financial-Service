import Papa from 'papaparse';

export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error('CSV file is empty or could not be parsed'));
        }
        const fields = results.meta.fields || [];
        resolve({
          fields,
          data: results.data
        });
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export function autoDetectMapping(fields = []) {
  const lowerFields = fields.map(f => f.toLowerCase().trim());

  let dateField = fields[lowerFields.findIndex(f => f.includes('date') || f.includes('time'))] || '';
  let merchantField = fields[lowerFields.findIndex(f => f.includes('merchant') || f.includes('description') || f.includes('payee') || f.includes('title') || f.includes('name'))] || '';
  let amountField = fields[lowerFields.findIndex(f => f === 'amount' || f.includes('amt') || f.includes('value'))] || '';
  let debitField = fields[lowerFields.findIndex(f => f.includes('debit') || f.includes('withdrawal') || f.includes('out'))] || '';
  let creditField = fields[lowerFields.findIndex(f => f.includes('credit') || f.includes('deposit') || f.includes('in'))] || '';
  let categoryField = fields[lowerFields.findIndex(f => f.includes('category') || f.includes('type'))] || '';
  let accountField = fields[lowerFields.findIndex(f => f.includes('account'))] || '';

  return {
    dateField,
    merchantField,
    amountField,
    debitField,
    creditField,
    categoryField,
    accountField
  };
}

export function mapCSVRowToTransaction(row, mapping, defaultAccount = 'Imported account') {
  const rawDate = row[mapping.dateField] || '';
  const rawMerchant = row[mapping.merchantField] || row[mapping.categoryField] || 'CSV Import';

  let date = new Date().toISOString().split('T')[0];
  if (rawDate) {
    const parsedDate = new Date(rawDate);
    if (!isNaN(parsedDate.getTime())) {
      date = parsedDate.toISOString().split('T')[0];
    }
  }

  let amount = 0;
  let type = 'expense';

  if (mapping.amountField && row[mapping.amountField] !== undefined) {
    const rawVal = parseFloat(row[mapping.amountField].toString().replace(/[\$,]/g, ''));
    if (!isNaN(rawVal)) {
      if (rawVal < 0) {
        type = 'expense';
        amount = Math.abs(rawVal);
      } else {
        type = 'income';
        amount = rawVal;
      }
    }
  } else {
    const debitVal = mapping.debitField ? parseFloat((row[mapping.debitField] || '').toString().replace(/[\$,]/g, '')) : NaN;
    const creditVal = mapping.creditField ? parseFloat((row[mapping.creditField] || '').toString().replace(/[\$,]/g, '')) : NaN;

    if (!isNaN(debitVal) && debitVal > 0) {
      type = 'expense';
      amount = debitVal;
    } else if (!isNaN(creditVal) && creditVal > 0) {
      type = 'income';
      amount = creditVal;
    }
  }

  const category = (mapping.categoryField && row[mapping.categoryField]) ? row[mapping.categoryField].trim() : 'Needs review';
  const account = (mapping.accountField && row[mapping.accountField]) ? row[mapping.accountField].trim() : defaultAccount;

  return {
    date,
    merchant: rawMerchant.trim() || 'Imported Transaction',
    amount: Math.abs(amount),
    type,
    category,
    account,
    tags: [],
    receipt: false,
    source: 'csv'
  };
}
