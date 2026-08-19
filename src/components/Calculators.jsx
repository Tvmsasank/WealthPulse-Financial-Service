import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Coins,
  ArrowDownRight,
  Building,
  Scale,
  Sparkles,
  PieChart as PieChartIcon,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

export default function Calculators({ isPrivacyMode = false }) {
  const [activeCalc, setActiveCalc] = useState('sip'); // 'sip' | 'lumpsum' | 'swp' | 'epf' | 'policy'

  // --- SIP STATE ---
  const [sipMonthly, setSipMonthly] = useState(10000);
  const [sipReturnRate, setSipReturnRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // --- LUMPSUM STATE ---
  const [lumpAmount, setLumpAmount] = useState(100000);
  const [lumpReturnRate, setLumpReturnRate] = useState(12);
  const [lumpYears, setLumpYears] = useState(10);

  // --- SWP STATE ---
  const [swpCorpus, setSwpCorpus] = useState(5000000);
  const [swpMonthlyWithdrawal, setSwpMonthlyWithdrawal] = useState(35000);
  const [swpReturnRate, setSwpReturnRate] = useState(8);
  const [swpYears, setSwpYears] = useState(15);

  // --- EPF STATE ---
  const [epfBasic, setEpfBasic] = useState(45000);
  const [epfCurrentAge, setEpfCurrentAge] = useState(26);
  const [epfRetireAge, setEpfRetireAge] = useState(58);
  const [epfSalaryHike, setEpfSalaryHike] = useState(7);
  const [epfInterestRate, setEpfInterestRate] = useState(8.25);
  const [epfCurrentBalance, setEpfCurrentBalance] = useState(250000);

  // --- POLICY VS SIP STATE ---
  const [policyAnnualPremium, setPolicyAnnualPremium] = useState(60000);
  const [policyTenure, setPolicyTenure] = useState(20);
  const [policyMaturitySum, setPolicyMaturitySum] = useState(2200000);
  const [policySipRate, setPolicySipRate] = useState(12);

  const mask = (val) => (isPrivacyMode ? '₹••••••••' : val);
  const formatInr = (num) =>
    isPrivacyMode
      ? '₹••••••••'
      : '₹' +
        Math.round(num).toLocaleString('en-IN', {
          maximumFractionDigits: 0
        });

  // ==========================================
  // 1. SIP CALCULATIONS (Compound Monthly)
  // M = P * ({[1 + i]^n - 1} / i) * (1 + i)
  // ==========================================
  const sipMonths = sipYears * 12;
  const sipMonthlyRate = sipReturnRate / 12 / 100;
  const sipTotalInvested = sipMonthly * sipMonths;
  const sipTotalValue =
    sipMonthlyRate > 0
      ? sipMonthly *
        ((Math.pow(1 + sipMonthlyRate, sipMonths) - 1) / sipMonthlyRate) *
        (1 + sipMonthlyRate)
      : sipTotalInvested;
  const sipEstReturns = Math.max(0, sipTotalValue - sipTotalInvested);
  const sipInvestedPct = Math.round((sipTotalInvested / sipTotalValue) * 100) || 50;

  // ==========================================
  // 2. LUMPSUM CALCULATIONS (A = P * (1 + r/n)^(nt))
  // ==========================================
  const lumpTotalInvested = lumpAmount;
  const lumpTotalValue = lumpAmount * Math.pow(1 + lumpReturnRate / 100, lumpYears);
  const lumpEstReturns = Math.max(0, lumpTotalValue - lumpTotalInvested);
  const lumpInvestedPct = Math.round((lumpTotalInvested / lumpTotalValue) * 100) || 50;

  // ==========================================
  // 3. SWP CALCULATIONS (Systematic Withdrawal Plan)
  // ==========================================
  let swpRemaining = swpCorpus;
  let swpTotalWithdrawn = 0;
  const swpTotalMonths = swpYears * 12;
  const swpMonthlyR = swpReturnRate / 12 / 100;
  let swpDepletedMonth = null;

  for (let m = 1; m <= swpTotalMonths; m++) {
    swpRemaining = swpRemaining * (1 + swpMonthlyR) - swpMonthlyWithdrawal;
    swpTotalWithdrawn += swpMonthlyWithdrawal;
    if (swpRemaining <= 0 && swpDepletedMonth === null) {
      swpDepletedMonth = m;
      swpRemaining = 0;
      break;
    }
  }

  // ==========================================
  // 4. EPF CALCULATIONS (Employee Provident Fund)
  // Employee 12%, Employer 3.67% into EPF
  // ==========================================
  const epfDurationYears = Math.max(1, epfRetireAge - epfCurrentAge);
  let epfBalance = epfCurrentBalance;
  let epfTotalEmployee = 0;
  let epfTotalEmployer = 0;
  let currentSalary = epfBasic;

  for (let y = 1; y <= epfDurationYears; y++) {
    const monthlyEmpContrib = currentSalary * 0.12;
    const monthlyEmprContrib = currentSalary * 0.0367;
    const annualEmpContrib = monthlyEmpContrib * 12;
    const annualEmprContrib = monthlyEmprContrib * 12;

    epfTotalEmployee += annualEmpContrib;
    epfTotalEmployer += annualEmprContrib;

    const totalYearlyContrib = annualEmpContrib + annualEmprContrib;
    const interest = (epfBalance + totalYearlyContrib / 2) * (epfInterestRate / 100);

    epfBalance += totalYearlyContrib + interest;
    currentSalary *= 1 + epfSalaryHike / 100;
  }

  const epfTotalInterest = Math.max(
    0,
    epfBalance - (epfCurrentBalance + epfTotalEmployee + epfTotalEmployer)
  );

  // ==========================================
  // 5. POLICY VS SIP COMPARISON
  // ==========================================
  const policyTotalPremiumPaid = policyAnnualPremium * policyTenure;
  const policyMonthlyEq = policyAnnualPremium / 12;
  const policySipMonths = policyTenure * 12;
  const policySipMonthlyR = policySipRate / 12 / 100;
  const sipEquivalentValue =
    policyMonthlyEq *
    ((Math.pow(1 + policySipMonthlyR, policySipMonths) - 1) / policySipMonthlyR) *
    (1 + policySipMonthlyR);
  const policyWealthGap = Math.max(0, sipEquivalentValue - policyMaturitySum);
  const policyMultiple = (sipEquivalentValue / policyMaturitySum).toFixed(1);

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 8px 60px 8px' }}>
      {/* Top Header Banner */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              borderRadius: '12px',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex'
            }}
          >
            <Calculator size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>
              Indian Financial Calculators
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Precision compound interest, retirement, and policy comparison engines built for India
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div
        className="no-scrollbar"
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          padding: '6px',
          marginBottom: '24px',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          width: 'fit-content',
          maxWidth: '100%'
        }}
      >
        <button
          type="button"
          className={`btn ${activeCalc === 'sip' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '9px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', whiteSpace: 'nowrap', gap: '6px' }}
          onClick={() => setActiveCalc('sip')}
        >
          <TrendingUp size={16} /> SIP Calculator
        </button>

        <button
          type="button"
          className={`btn ${activeCalc === 'lumpsum' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '9px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', whiteSpace: 'nowrap', gap: '6px' }}
          onClick={() => setActiveCalc('lumpsum')}
        >
          <Coins size={16} /> Lumpsum Calculator
        </button>

        <button
          type="button"
          className={`btn ${activeCalc === 'swp' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '9px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', whiteSpace: 'nowrap', gap: '6px' }}
          onClick={() => setActiveCalc('swp')}
        >
          <ArrowDownRight size={16} /> SWP (Withdrawal)
        </button>

        <button
          type="button"
          className={`btn ${activeCalc === 'epf' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '9px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', whiteSpace: 'nowrap', gap: '6px' }}
          onClick={() => setActiveCalc('epf')}
        >
          <Building size={16} /> EPF Retirement
        </button>

        <button
          type="button"
          className={`btn ${activeCalc === 'policy' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '9px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', whiteSpace: 'nowrap', gap: '6px' }}
          onClick={() => setActiveCalc('policy')}
        >
          <Scale size={16} /> Policy vs SIP Comparison
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. SIP CALCULATOR */}
      {/* ========================================================================= */}
      {activeCalc === 'sip' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {/* Inputs Card */}
          <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} style={{ color: 'var(--primary)' }} /> Systematic Investment Plan (SIP)
            </h2>

            {/* Monthly Investment */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Monthly Investment</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{mask(`₹${sipMonthly.toLocaleString('en-IN')}`)}</div>
              </div>
              <input
                type="range"
                min="500"
                max="200000"
                step="500"
                value={sipMonthly}
                onChange={(e) => setSipMonthly(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {[5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '8px' }}
                    onClick={() => setSipMonthly(amt)}
                  >
                    +₹{amt >= 1000 ? amt / 1000 + 'k' : amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Expected Return Rate */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Expected Annual Return (p.a.)</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981' }}>{sipReturnRate}%</div>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={sipReturnRate}
                onChange={(e) => setSipReturnRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {[10, 12, 15, 18].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '8px' }}
                    onClick={() => setSipReturnRate(rate)}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            {/* Time Period */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Investment Period</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#38BDF8' }}>{sipYears} Years</div>
              </div>
              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={sipYears}
                onChange={(e) => setSipYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38BDF8' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {[5, 10, 15, 20, 25].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '8px' }}
                    onClick={() => setSipYears(yr)}
                  >
                    {yr}Y
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Wealth Creation Summary
              </div>

              {/* Total Maturity Value */}
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: '16px',
                  background: 'var(--hero-bg)',
                  border: 'var(--hero-border)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Expected Total Corpus</div>
                <div style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: '900', color: 'var(--primary)', marginTop: '4px' }}>
                  {formatInr(sipTotalValue)}
                </div>
              </div>

              {/* Breakdown Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38BDF8' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Invested Principal Amount</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{formatInr(sipTotalInvested)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estimated Wealth Gain</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#10B981' }}>+{formatInr(sipEstReturns)}</span>
                </div>
              </div>

              {/* Visual Split Bar */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex', background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ width: `${sipInvestedPct}%`, background: '#38BDF8', transition: 'width 0.3s ease' }} title={`Invested: ${sipInvestedPct}%`} />
                  <div style={{ width: `${100 - sipInvestedPct}%`, background: '#10B981', transition: 'width 0.3s ease' }} title={`Returns: ${100 - sipInvestedPct}%`} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>Principal: {sipInvestedPct}%</span>
                  <span>Profit Gains: {100 - sipInvestedPct}%</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
              💡 Compounding power: In {sipYears} years, your ₹{sipMonthly.toLocaleString('en-IN')}/mo creates a wealth multiple of {(sipTotalValue / sipTotalInvested).toFixed(1)}x!
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. LUMPSUM CALCULATOR */}
      {/* ========================================================================= */}
      {activeCalc === 'lumpsum' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coins size={18} style={{ color: '#FBBF24' }} /> One-Time Lumpsum Investment
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Total One-Time Investment</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{mask(`₹${lumpAmount.toLocaleString('en-IN')}`)}</div>
              </div>
              <input
                type="range"
                min="5000"
                max="2500000"
                step="5000"
                value={lumpAmount}
                onChange={(e) => setLumpAmount(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#FBBF24' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {[50000, 100000, 250000, 500000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '8px' }}
                    onClick={() => setLumpAmount(amt)}
                  >
                    ₹{amt >= 100000 ? amt / 100000 + 'L' : amt / 1000 + 'k'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Expected Annual Return (CAGR)</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981' }}>{lumpReturnRate}%</div>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="0.5"
                value={lumpReturnRate}
                onChange={(e) => setLumpReturnRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Holding Period</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#38BDF8' }}>{lumpYears} Years</div>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                step="1"
                value={lumpYears}
                onChange={(e) => setLumpYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38BDF8' }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Lumpsum Maturity Projection
              </div>

              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: '16px',
                  background: 'var(--hero-bg)',
                  border: 'var(--hero-border)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Expected Maturity Value</div>
                <div style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: '900', color: '#FBBF24', marginTop: '4px' }}>
                  {formatInr(lumpTotalValue)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Initial Principal Invested</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{formatInr(lumpTotalInvested)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Estimated Compound Gain</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#10B981' }}>+{formatInr(lumpEstReturns)}</span>
                </div>
              </div>

              <div style={{ height: '12px', borderRadius: '6px', overflow: 'hidden', display: 'flex', background: 'rgba(255, 255, 255, 0.05)' }}>
                <div style={{ width: `${lumpInvestedPct}%`, background: '#38BDF8', transition: 'width 0.3s ease' }} />
                <div style={{ width: `${100 - lumpInvestedPct}%`, background: '#FBBF24', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
              🚀 Multiplier: Your one-time investment grows by {(lumpTotalValue / lumpTotalInvested).toFixed(2)}x at {lumpReturnRate}% CAGR over {lumpYears} years!
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SWP (SYSTEMATIC WITHDRAWAL PLAN) */}
      {/* ========================================================================= */}
      {activeCalc === 'swp' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ArrowDownRight size={18} style={{ color: '#38BDF8' }} /> Systematic Withdrawal Plan (SWP)
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Total Initial Corpus (₹)</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{mask(`₹${swpCorpus.toLocaleString('en-IN')}`)}</div>
              </div>
              <input
                type="range"
                min="500000"
                max="20000000"
                step="250000"
                value={swpCorpus}
                onChange={(e) => setSwpCorpus(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Monthly Withdrawal Amount</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#F87171' }}>{mask(`₹${swpMonthlyWithdrawal.toLocaleString('en-IN')}/mo`)}</div>
              </div>
              <input
                type="range"
                min="5000"
                max="200000"
                step="2500"
                value={swpMonthlyWithdrawal}
                onChange={(e) => setSwpMonthlyWithdrawal(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F87171' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Expected Portfolio Return (%)</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981' }}>{swpReturnRate}%</div>
              </div>
              <input
                type="range"
                min="4"
                max="18"
                step="0.5"
                value={swpReturnRate}
                onChange={(e) => setSwpReturnRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Withdrawal Duration</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#38BDF8' }}>{swpYears} Years</div>
              </div>
              <input
                type="range"
                min="1"
                max="35"
                step="1"
                value={swpYears}
                onChange={(e) => setSwpYears(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38BDF8' }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Cash Flow & Longevity Projection
              </div>

              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: '16px',
                  background: swpDepletedMonth ? 'rgba(239, 68, 68, 0.12)' : 'var(--hero-bg)',
                  border: swpDepletedMonth ? '1px solid #EF4444' : 'var(--hero-border)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Remaining Final Balance</div>
                <div style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: '900', color: swpDepletedMonth ? '#F87171' : 'var(--primary)', marginTop: '4px' }}>
                  {formatInr(swpRemaining)}
                </div>
                {swpDepletedMonth && (
                  <div style={{ fontSize: '12px', color: '#F87171', marginTop: '4px', fontWeight: '700' }}>
                    ⚠️ Corpus exhausted at Month {swpDepletedMonth} ({Math.floor(swpDepletedMonth / 12)}Y {swpDepletedMonth % 12}M)
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Initial Principal Corpus</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{formatInr(swpCorpus)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Cash Received (Withdrawals)</span>
                  <span style={{ fontSize: '14px', fontWeight: '800', color: '#10B981' }}>{formatInr(swpTotalWithdrawn)}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
              💡 Tax Tip: SWP from Equity Mutual Funds attracts low 12.5% LTCG on the gain portion only, creating tax-efficient monthly income!
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. EPF CALCULATOR */}
      {/* ========================================================================= */}
      {activeCalc === 'epf' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building size={18} style={{ color: '#38BDF8' }} /> Employee Provident Fund (EPF India)
            </h2>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Monthly Basic Salary + DA</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{mask(`₹${epfBasic.toLocaleString('en-IN')}`)}</div>
              </div>
              <input
                type="range"
                min="15000"
                max="400000"
                step="5000"
                value={epfBasic}
                onChange={(e) => setEpfBasic(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Current Age: <strong>{epfCurrentAge} Yrs</strong></label>
                <input
                  type="range"
                  min="18"
                  max="55"
                  value={epfCurrentAge}
                  onChange={(e) => setEpfCurrentAge(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38BDF8' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Retire Age: <strong>{epfRetireAge} Yrs</strong></label>
                <input
                  type="range"
                  min="55"
                  max="65"
                  value={epfRetireAge}
                  onChange={(e) => setEpfRetireAge(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#38BDF8' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Annual Salary Increment (%)</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981' }}>{epfSalaryHike}%</div>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={epfSalaryHike}
                onChange={(e) => setEpfSalaryHike(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Existing EPF Balance</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#FBBF24' }}>{mask(`₹${epfCurrentBalance.toLocaleString('en-IN')}`)}</div>
              </div>
              <input
                type="range"
                min="0"
                max="3000000"
                step="25000"
                value={epfCurrentBalance}
                onChange={(e) => setEpfCurrentBalance(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#FBBF24' }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                EPF Maturity Corpus at Age {epfRetireAge} (8.25% p.a.)
              </div>

              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: '16px',
                  background: 'var(--hero-bg)',
                  border: 'var(--hero-border)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Guaranteed EPF Retirement Corpus</div>
                <div style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: '900', color: 'var(--primary)', marginTop: '4px' }}>
                  {formatInr(epfBalance)}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Total Employee Share (12%)</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{formatInr(epfTotalEmployee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Total Employer EPF Share (3.67%)</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{formatInr(epfTotalEmployer)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Total Compounded Interest Earned</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#10B981' }}>+{formatInr(epfTotalInterest)}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
              🏛️ EPFO Rules: 8.33% of employer contribution goes into EPS (Pension Scheme). EPF interest is tax-exempt up to ₹2.5L employee contribution/year.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. POLICY VS SIP COMPARISON */}
      {/* ========================================================================= */}
      {activeCalc === 'policy' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ padding: '24px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={18} style={{ color: '#F87171' }} /> Traditional Policy vs Mutual Fund SIP
            </h2>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Annual Policy Premium (₹)</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>{mask(`₹${policyAnnualPremium.toLocaleString('en-IN')}`)}</div>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="5000"
                value={policyAnnualPremium}
                onChange={(e) => setPolicyAnnualPremium(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#F87171' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Policy Tenure (Years)</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#38BDF8' }}>{policyTenure} Years</div>
              </div>
              <input
                type="range"
                min="5"
                max="35"
                step="1"
                value={policyTenure}
                onChange={(e) => setPolicyTenure(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38BDF8' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Guaranteed / Expected Policy Maturity</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#FBBF24' }}>{mask(`₹${policyMaturitySum.toLocaleString('en-IN')}`)}</div>
              </div>
              <input
                type="range"
                min="100000"
                max="10000000"
                step="50000"
                value={policyMaturitySum}
                onChange={(e) => setPolicyMaturitySum(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#FBBF24' }}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Benchmark Index / Mutual Fund CAGR (%)</label>
                <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981' }}>{policySipRate}%</div>
              </div>
              <input
                type="range"
                min="8"
                max="18"
                step="0.5"
                value={policySipRate}
                onChange={(e) => setPolicySipRate(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#10B981' }}
              />
            </div>
          </div>

          <div className="card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Head-to-Head Wealth Comparison
              </div>

              {/* Wealth Difference Alert Banner */}
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: '16px',
                  background: 'var(--hero-bg)',
                  border: 'var(--hero-border)',
                  marginBottom: '20px'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>Opportunity Wealth Gap</div>
                <div style={{ fontSize: 'clamp(24px, 3.5vw, 32px)', fontWeight: '900', color: 'var(--primary)', marginTop: '2px' }}>
                  +{formatInr(policyWealthGap)}
                </div>
                <div style={{ fontSize: '12px', color: '#38BDF8', fontWeight: '700', marginTop: '4px' }}>
                  ⚡ SIP generates {policyMultiple}x more wealth than the policy!
                </div>
              </div>

              {/* Comparison Table */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)' }}>
                  <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Total Premiums Invested</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{formatInr(policyTotalPremiumPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.06)' }}>
                  <span style={{ fontSize: '12.5px', color: '#F87171' }}>Endowment / Policy Return (~5% IRR)</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#F87171' }}>{formatInr(policyMaturitySum)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)' }}>
                  <span style={{ fontSize: '12.5px', color: '#10B981' }}>Mutual Fund SIP ({policySipRate}% CAGR)</span>
                  <span style={{ fontSize: '13px', fontWeight: '800', color: '#10B981' }}>{formatInr(sipEquivalentValue)}</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '16px' }}>
              🎯 Golden Financial Rule: Buy Pure Term Insurance for protection (cheap ₹500/mo for ₹1 Crore cover) and invest the balance in Index Fund SIPs!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
