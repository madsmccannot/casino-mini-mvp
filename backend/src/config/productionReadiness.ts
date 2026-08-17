const requiredEvidence = [
  'LICENSE_JURISDICTION',
  'KYC_AML_PROVIDER',
  'GEOFENCE_PROVIDER',
  'RESPONSIBLE_GAMING_POLICY_VERSION',
  'SECURITY_REVIEW_ID',
  'BACKUP_RESTORE_DRILL_AT',
  'INCIDENT_RUNBOOK_VERSION',
];

export const getProductionReadiness = () => {
  const missingEvidence = requiredEvidence.filter((name) => !process.env[name]?.trim());
  const custodyDisabled = (process.env.CUSTODY_MODE?.trim() || 'disabled') === 'disabled';
  const bankrollDisabled = (process.env.BANKROLL_PROVIDER?.trim() || 'disabled') === 'disabled';
  const sportsDisabled = (process.env.SPORTSBOOK_PROVIDER?.trim() || 'disabled') === 'disabled';
  const catalogDisabled = (process.env.CASINO_CATALOG_PROVIDER?.trim() || 'disabled') === 'disabled';
  return {
    production: process.env.NODE_ENV === 'production',
    readyForRealMoney: missingEvidence.length === 0 && !custodyDisabled && !bankrollDisabled && !sportsDisabled && !catalogDisabled,
    missingEvidence,
    disabledFinancialPaths: { custody: custodyDisabled, bankroll: bankrollDisabled, sportsbook: sportsDisabled, casinoCatalog: catalogDisabled },
  };
};
