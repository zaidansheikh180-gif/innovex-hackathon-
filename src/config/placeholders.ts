/**
 * @file placeholders.ts
 * Centralized configuration for all TBD labels, visual tokens, limits, and defaults.
 * All items in this file are clearly marked as placeholders or proposed defaults,
 * making them easy to adjust in a single place.
 */

export const PLACEHOLDERS = {
  // App Branding (Status: Chosen)
  appName: 'JalSetu',
  appTagline: 'Know Your Supply. Report the Problem. Improve Your Village.',
  villageName: 'Malligehalli',

  // Areas List (Status: TBD - Generic area labels; no area-management screen yet)
  areas: [
    { id: 'area-1', name: 'Area 1' },
    { id: 'area-2', name: 'Area 2' },
    { id: 'area-3', name: 'Area 3' },
  ],

  // Text Length Limits (Status: Proposed Default)
  textLimits: {
    reportNote: 500,
    noticeMessage: 500,
    waterTestResult: 500,
    waterTestSource: 200,
  },

  // Import Action Behaviour (Status: Proposed Default)
  importBehavior: 'replace' as const, // 'replace' | 'merge'

  // Visual Design Tokens (Status: TBD - Neutral Placeholders)
  designTokens: {
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    primaryColor: '#0f766e', // Calm teal placeholder
    primaryHover: '#115e59',
    surfaceBg: '#f8fafc',    // Slate 50
    cardBg: '#ffffff',
    borderColor: '#e2e8f0',  // Slate 200
    textPrimary: '#0f172a',  // Slate 900
    textMuted: '#64748b',    // Slate 500
    borderRadius: '0.5rem',  // Rounded-lg placeholder
    touchTargetMin: '44px',
  },

  // Disclaimer Statements (Status: Chosen Rules)
  disclaimers: {
    deviceOnly: 'This application stores records solely in this web browser on this device. Data does not automatically sync across phones or computers.',
    sampleDataNotice: 'A new install starts with no records. Reset or replace data anytime in Data Settings.',
    demoRoleNotice: 'Role switching is a demonstration convenience, not secure authentication or login.',
    safetyNotice: 'This app records schedules and reported issues. It does not certify drinking water safety, detect underground leaks, or automatically dispatch repairs.',
  },
} as const;
