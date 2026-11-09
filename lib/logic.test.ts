import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration, SAMPLE_SERVICES, SAMPLE_TARGET, uptimeBudget } from './logic.ts';

test('formatDuration keeps existing units', () => {
  assert.equal(formatDuration(0.05), '3.0 s');
  assert.equal(formatDuration(0.5), '30 s');
  assert.equal(formatDuration(43.83), '43.8 min');
  assert.equal(formatDuration(90), '1 h 30 min');
  assert.equal(formatDuration(3 * 1440 + 120), '3 days 2 h');
});

test('formatDuration rounds before it picks the unit', () => {
  assert.equal(formatDuration(59.97), '1 h');
  assert.equal(formatDuration(0.9999), '1.0 min');
  assert.equal(formatDuration(9.96 / 60), '10 s');
});

test('uptime budget for 99.9', () => {
  const r = uptimeBudget('99.9', [{ name: 'App', value: '99.95' }]);
  assert.equal(r.month, '43.8 min');
  assert.equal(r.verdict, 'This chain can meet a 99.9% target, with 21.9 min a month to spare.');
  assert.equal(r.short, false);
});

test('the sample the page is prerendered in', () => {
  const r = uptimeBudget(SAMPLE_TARGET, SAMPLE_SERVICES);
  assert.equal(r.month, '43.8 min');
  assert.equal(r.year, '8 h 46 min');
  assert.equal(r.bad, -1);
});

test('uptime says a target is out of reach', () => {
  const r = uptimeBudget('99.99', [{ name: 'App', value: '99.9' }]);
  assert.equal(r.short, true);
  assert.match(r.verdict, /^This chain tops out at 99.9%, so a 99.99% target is out of reach/);
});

test('uptime says when the chain exactly meets the target', () => {
  const r = uptimeBudget('99.9', [{ name: 'App', value: '99.9' }]);
  assert.equal(r.short, false);
  assert.equal(r.verdict, 'This chain exactly meets a 99.9% target, with no downtime to spare.');
});

test('uptime target check matches its message', () => {
  assert.equal(uptimeBudget('99.9999', []).targetOk, true);
  const r = uptimeBudget('99.99999', []);
  assert.equal(r.targetOk, false);
  assert.equal(r.error, 'Enter a target between 50 and 99.9999.');
  assert.equal(uptimeBudget('100', []).error, 'A target of 100% leaves no room for any downtime, so no provider offers it. Try 99.99.');
});
