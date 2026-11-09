/* Pure logic for the Uptime Budget Calculator: no React, no DOM, so it runs in Node for checks too. */

// Minutes per period. A month is 365.25 / 12 days, the convention SLA tables use.
const MINUTES = { day: 1440, week: 10080, month: 43830, year: 525960 } as const;

export function formatDuration(m: number): string {
  // Round before picking the unit, so 59.97 min reads 1 h and not 60.0 min.
  const s = m * 60;
  if (+s.toFixed(1) < 10) return `${s.toFixed(1)} s`;
  if (Math.round(s) < 60) return `${Math.round(s)} s`;
  if (+m.toFixed(1) < 60) return `${m.toFixed(1)} min`;
  const tm = Math.round(m);
  if (tm < 48 * 60) {
    const h = Math.floor(tm / 60), mm = tm % 60;
    return mm ? `${h} h ${mm} min` : `${h} h`;
  }
  const th = Math.round(m / 60), d = Math.floor(th / 24), hh = th % 24;
  return hh ? `${d} days ${hh} h` : `${d} days`;
}

const formatPercent = (a: number): string => `${+(a * 100).toFixed(4)}%`;

export interface ServiceRow { name: string; value: string }

export interface UptimeResult {
  t: number;
  targetOk: boolean;
  /** Index of the first service with an unusable availability, or -1. */
  bad: number;
  error: string;
  day: string;
  week: string;
  month: string;
  year: string;
  chain: string;
  chainDown: string;
  verdict: string;
  short: boolean;
}

export function uptimeBudget(target: string, services: readonly ServiceRow[]): UptimeResult {
  const t = parseFloat(target);
  const targetOk = Number.isFinite(t) && t >= 50 && t <= 99.9999;
  const rows = services.map((s, i) => ({ name: s.name.trim() || `Service ${i + 1}`, value: s.value }));
  const bad = rows.findIndex((r) => r.value !== '' && !(parseFloat(r.value) > 0 && parseFloat(r.value) <= 100));
  const msgs: string[] = [];
  if (!targetOk) msgs.push(t >= 100 ? 'A target of 100% leaves no room for any downtime, so no provider offers it. Try 99.99.' : 'Enter a target between 50 and 99.9999.');
  if (bad >= 0) msgs.push(`${rows[bad].name}: enter an availability above 0 and up to 100.`);
  const budget = (k: keyof typeof MINUTES) => (targetOk ? formatDuration((1 - t / 100) * MINUTES[k]) : 'n/a');
  const base = { t, targetOk, bad, error: msgs.join(' '), day: budget('day'), week: budget('week'), month: budget('month'), year: budget('year') };

  const used = rows.filter((r) => r.value !== '');
  if (!used.length || bad >= 0) {
    const verdict = bad >= 0 ? 'Fix the highlighted service to see the combined figure.' : 'Add the services a request depends on to see the combined figure.';
    return { ...base, chain: 'n/a', chainDown: '', verdict, short: false };
  }
  // A request that needs every service in the chain is only up when all of them are, so availabilities multiply.
  const chain = used.reduce((a, r) => a * (parseFloat(r.value) / 100), 1);
  const chainDown = (1 - chain) * MINUTES.month;
  const out = { ...base, chain: formatPercent(chain), chainDown: ` · ${formatDuration(chainDown)} of downtime a month` };
  if (!targetOk) return { ...out, verdict: '', short: false };
  const spare = (1 - t / 100) * MINUTES.month - chainDown;
  // Under the 0.05 s that formatDuration shows as 0.0 s, so float noise reads as an exact match.
  const exact = Math.abs(spare) * 60 < 0.05;
  const short = spare < 0 && !exact;
  const verdict = short
    ? `This chain tops out at ${formatPercent(chain)}, so a ${t}% target is out of reach. It uses about ${formatDuration(-spare)} more downtime a month than the target allows.`
    : exact
      ? `This chain exactly meets a ${t}% target, with no downtime to spare.`
      : `This chain can meet a ${t}% target, with ${formatDuration(spare)} a month to spare.`;
  return { ...out, verdict, short };
}

/* The state the page is prerendered in. */
export const SAMPLE_TARGET = '99.9';
export const SAMPLE_SERVICES: readonly ServiceRow[] = [
  { name: 'App servers', value: '99.95' },
  { name: 'Database', value: '99.99' },
  { name: 'Payment gateway', value: '99.9' },
  { name: '', value: '' },
  { name: '', value: '' },
];
