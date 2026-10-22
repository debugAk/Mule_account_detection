import { Alert, Case, FraudRing, RiskTier } from '@mule-platform/shared-types';
import trainedAccountsRaw from './trained-accounts.json';

interface TrainedAccount {
  file: string;
  raw_account_no: string;
  holder_name: string;
  ifsc: string;
  tx_count: number;
  total_credit_inr: number;
  total_debit_inr: number;
  pass_through_ratio: number;
  unique_counterparties: number;
  signals: [string, string, string];
  mule_risk_score: number;
}

const trainedAccounts = trainedAccountsRaw as unknown as TrainedAccount[];

const BANKS = [
  { code: 'HDFC', name: 'HDFC Bank', ifscPrefix: 'HDFC000' },
  { code: 'SBIN', name: 'State Bank of India', ifscPrefix: 'SBIN000' },
  { code: 'ICIC', name: 'ICICI Bank', ifscPrefix: 'ICIC000' },
  { code: 'AXIS', name: 'Axis Bank', ifscPrefix: 'UTIB000' },
  { code: 'KKBK', name: 'Kotak Mahindra Bank', ifscPrefix: 'KKBK000' },
];

export const FRAUD_RINGS: FraudRing[] = [
  {
    id: 'RING-MH-8812',
    name: 'Mumbai Suburban Mule Syndicate 8812',
    accountCount: 42,
    totalExposedINR: 38450000,
    leadAccountMasked: 'HDFC-XXXX8812',
    deviceFingerprint: 'DEV-F7B2-991A-4C10',
    firstDetected: '2026-09-14T08:30:00Z',
    patternType: 'RAPID_DISPERSAL',
  },
  {
    id: 'RING-JH-4409',
    name: 'Jamtara Cluster — Telegram Part-Time Job Scam',
    accountCount: 68,
    totalExposedINR: 62100000,
    leadAccountMasked: 'SBIN-XXXX4409',
    deviceFingerprint: 'DEV-88CD-11FA-903E',
    firstDetected: '2026-08-02T11:15:00Z',
    patternType: 'DEVICE_FARM',
  },
  {
    id: 'RING-NCR-1903',
    name: 'NCR Crypto P2P Arbitrage Layering Network',
    accountCount: 29,
    totalExposedINR: 24700000,
    leadAccountMasked: 'ICIC-XXXX1903',
    deviceFingerprint: 'DEV-41A8-D882-77BA',
    firstDetected: '2026-10-01T14:45:00Z',
    patternType: 'CIRCULAR_ROUTING',
  },
];

export function generateSeedAlerts(count = 450): Alert[] {
  const alerts: Alert[] = [];
  const now = Date.now();

  // 1. Add trained SOA accounts first
  trainedAccounts.forEach((t, idx) => {
    const bank = BANKS[idx % BANKS.length];
    const last4 = t.raw_account_no.slice(-4).padStart(4, '0');
    const nameParts = t.holder_name.split(' ');
    const first = nameParts[0] || 'Unknown';
    const last = nameParts[1] || '';
    const maskedName = `${first.charAt(0)}*** ${last ? last.charAt(0) + '***' : ''}`.trim();
    const riskScore = t.mule_risk_score;
    const tier: RiskTier = riskScore >= 85 ? 'CRITICAL' : riskScore >= 70 ? 'HIGH' : riskScore >= 50 ? 'MEDIUM' : 'LOW';

    alerts.push({
      id: `ALT-SOA-${8000 + idx}`,
      accountId: `${bank.code}-XXXX${last4}`,
      accountHolderMasked: maskedName,
      bankName: bank.name,
      ifsc: t.ifsc || `${bank.ifscPrefix}${1000 + idx}`,
      upiHandleMasked: `${first.toLowerCase()}.${last ? last.charAt(0).toLowerCase() : 'x'}**@${bank.code.toLowerCase()}`,
      riskScore,
      riskTier: tier,
      passThroughRatio: t.pass_through_ratio,
      graphDegree: Math.min(250, Math.max(5, Math.round(Math.log2(t.unique_counterparties + 1) * 8))),
      accountAgeDays: Math.max(7, (idx * 17) % 360),
      amountAtRiskINR: Math.round(t.total_credit_inr),
      timestamp: new Date(now - (idx * 24 + 12) * 60 * 1000).toISOString(),
      ringId: idx % 4 === 0 ? FRAUD_RINGS[idx % FRAUD_RINGS.length].id : undefined,
      status: idx % 7 === 0 ? 'INVESTIGATING' : 'NEW',
      queueCategory: idx % 3 === 0 ? 'HIGH_RISK' : 'MY_QUEUE',
      signals: t.signals,
      assignedTo: idx % 2 === 0 ? 'ANALYST-104 (Current Session)' : undefined,
      isRestricted: idx === 3 || idx === 11,
    });
  });

  // 2. Synthesize remainder to reach 450 items
  for (let i = alerts.length + 1; i <= count; i++) {
    const bank = BANKS[i % BANKS.length];
    const last4 = String(1000 + ((i * 37) % 9000));
    const riskScore = i % 5 === 0 ? 88 + (i % 12) : i % 3 === 0 ? 72 + (i % 16) : 38 + (i % 25);
    const tier: RiskTier = riskScore >= 80 ? 'CRITICAL' : riskScore >= 65 ? 'HIGH' : 'MEDIUM';

    alerts.push({
      id: `ALT-${80000 + i}`,
      accountId: `${bank.code}-XXXX${last4}`,
      accountHolderMasked: `R*** K***`,
      bankName: bank.name,
      ifsc: `${bank.ifscPrefix}${1000 + (i % 8999)}`,
      upiHandleMasked: `analyst.flag${i % 100}@${bank.code.toLowerCase()}`,
      riskScore,
      riskTier: tier,
      passThroughRatio: Number((0.75 + (Math.sin(i) * 0.12 + 0.12)).toFixed(2)),
      graphDegree: 4 + ((i * 5) % 28),
      accountAgeDays: Math.max(5, (i * 11) % 400),
      amountAtRiskINR: Math.round((55000 + ((i * 18450) % 1900000)) / 100) * 100,
      timestamp: new Date(now - (i * 12 + 5) * 60 * 1000).toISOString(),
      ringId: i % 8 === 0 ? FRAUD_RINGS[i % FRAUD_RINGS.length].id : undefined,
      status: 'NEW',
      queueCategory: riskScore >= 75 ? 'HIGH_RISK' : 'NEW_TODAY',
      signals: [
        '96.2% fund pass-through within 18 mins of inward transfer flurry',
        'Device fingerprint shared with known syndicate proxy node',
        'Sudden turnover spike: 42 UPI inward deposits followed by immediate IMPS transfer'
      ],
      assignedTo: i % 4 === 0 ? 'ANALYST-104 (Current Session)' : undefined,
      isRestricted: i % 30 === 0,
    });
  }

  return alerts;
}

export function generateSeedCases(alerts: Alert[]): Case[] {
  return alerts.filter(a => a.riskScore >= 75).slice(0, 32).map((alt, idx) => ({
    id: `CAS-2026-${1000 + idx}`,
    alertId: alt.id,
    title: `Rapid Mule Layering on ${alt.accountId} (${alt.bankName})`,
    riskScore: alt.riskScore,
    primaryAccount: alt.accountId,
    primaryHolderMasked: alt.accountHolderMasked,
    bankName: alt.bankName,
    ifsc: alt.ifsc,
    slaDeadline: new Date(Date.now() + Math.max(0.8, 12 - idx * 0.38) * 3600 * 1000).toISOString(),
    status: idx % 6 === 0 ? 'UNDER_REVIEW' : idx % 9 === 0 ? 'STR_SUBMITTED' : 'OPEN',
    assignedAnalyst: 'ANALYST-104 (Current Session)',
    totalExposedINR: alt.amountAtRiskINR,
    summary: `Automated detection triggered by pass-through velocity ${alt.passThroughRatio} with ${alt.graphDegree} counterparty edges. ${alt.signals[0]}.`,
    createdAt: alt.timestamp,
  }));
}
