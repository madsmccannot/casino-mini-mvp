import test from 'node:test';
import assert from 'node:assert/strict';
import { getProductionReadiness } from './productionReadiness';

const evidence = {
  LICENSE_JURISDICTION: 'test-jurisdiction',
  KYC_AML_PROVIDER: 'test-kyc',
  GEOFENCE_PROVIDER: 'test-geofence',
  RESPONSIBLE_GAMING_POLICY_VERSION: 'test-v1',
  SECURITY_REVIEW_ID: 'test-review',
  BACKUP_RESTORE_DRILL_AT: '2026-08-17T00:00:00Z',
  INCIDENT_RUNBOOK_VERSION: 'test-v1',
};

test('production readiness fails closed with default disabled providers', () => {
  const previous = { ...process.env };
  Object.assign(process.env, evidence, { NODE_ENV: 'production' });
  delete process.env.CUSTODY_MODE;
  delete process.env.BANKROLL_PROVIDER;
  delete process.env.SPORTSBOOK_PROVIDER;
  delete process.env.CASINO_CATALOG_PROVIDER;

  const result = getProductionReadiness();
  assert.equal(result.production, true);
  assert.equal(result.readyForRealMoney, false);
  assert.deepEqual(result.missingEvidence, []);
  assert.equal(result.disabledFinancialPaths.custody, true);

  process.env = previous;
});

test('production readiness reports missing evidence', () => {
  const previous = { ...process.env };
  Object.assign(process.env, { NODE_ENV: 'production' });
  delete process.env.LICENSE_JURISDICTION;
  delete process.env.SECURITY_REVIEW_ID;

  const result = getProductionReadiness();
  assert.equal(result.production, true);
  assert.equal(result.readyForRealMoney, false);
  assert.equal(result.missingEvidence.includes('LICENSE_JURISDICTION'), true);
  assert.equal(result.missingEvidence.includes('SECURITY_REVIEW_ID'), true);

  process.env = previous;
});
