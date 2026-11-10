'use client';

import { useEffect, useRef, useState } from 'react';
import { formatDuration, SAMPLE_SERVICES, SAMPLE_TARGET, uptimeBudget, type ServiceRow } from '@/lib/logic';
import { stopTween, tween } from './client';
import MonthGrid from './MonthGrid';

const MONTH_MIN = 43830; // the 30.44-day month uptimeBudget uses; here it only converts its result into drawn hours
const PRESETS = ['99', '99.5', '99.9', '99.95', '99.99'];
const SAMPLE_MONTH = uptimeBudget(SAMPLE_TARGET, SAMPLE_SERVICES).month;

const cleanNum = (s: string) => s.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');

export default function UptimeTool() {
  const [target, setTarget] = useState(SAMPLE_TARGET);
  const [services, setServices] = useState(SAMPLE_SERVICES);
  const monthRef = useRef<HTMLOutputElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);

  const r = uptimeBudget(target, services);
  const ok = r.targetOk;
  const budgetMin = ok ? (1 - r.t / 100) * MONTH_MIN : 0;
  const hasChain = r.chain !== 'n/a';
  const chainMin = hasChain ? (1 - parseFloat(r.chain) / 100) * MONTH_MIN : 0;
  const emberH = r.short ? Math.max(0, chainMin - budgetMin) / 60 : 0;
  const over = r.short ? r.verdict.match(/about (.+) more downtime/)?.[1] ?? '' : '';
  const showTargetErr = !ok && Boolean(r.error);
  const showChainErr = ok && r.bad >= 0;
  const announce = ok ? `${r.t}% uptime allows ${r.month} of downtime a month. ${r.verdict}` : r.error;

  // React renders a constant here and only the tween writes the figure, so the two never fight over the text node.
  useEffect(() => {
    const el = monthRef.current!;
    if (ok) tween(el, budgetMin, (v) => (Math.abs(v - budgetMin) < 1e-6 ? r.month : formatDuration(v)), 420);
    else { stopTween(el); el.textContent = 'no month to draw'; }
  }, [ok, budgetMin, r.month]);

  // The worked sums are server-rendered further down the page, so they are updated in place.
  useEffect(() => {
    document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = ok ? String(r.t) : 'target'; });
    document.getElementById('check-month')!.textContent = r.month;
    document.getElementById('check-year')!.textContent = r.year;
  }, [ok, r.t, r.month, r.year]);

  useEffect(() => {
    const id = setTimeout(() => { liveRef.current!.textContent = announce; }, 400);
    return () => clearTimeout(id);
  }, [announce]);

  const setRow = (i: number, patch: Partial<ServiceRow>) => setServices((rows) => rows.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <form className="tool" noValidate onSubmit={(e) => e.preventDefault()}>
      <div className="wrap">
        <h1 className="tool__name">Uptime Budget Calculator</h1>
        <p className="tool__intro">A free calculator for founders and engineers agreeing an SLA. It turns an uptime target into the downtime it allows and checks whether your chain of services can meet it. No sign-up, and it runs in your browser.</p>

        <p className={ok ? 'say' : 'say is-void'}>
          <span className="say__line">
            <label className="sr-only" htmlFor="u-target">Availability target (%)</label>
            <span className="say__field">
              <input className="say__input" id="u-target" name="target" type="text" inputMode="decimal" autoComplete="off" spellCheck={false} placeholder={SAMPLE_TARGET} aria-describedby="u-target-hint" aria-invalid={!ok} value={target} onChange={(e) => setTarget(cleanNum(e.target.value))} />
              <span className="say__fit" aria-hidden="true">{target || SAMPLE_TARGET}</span>
            </span>
            <span className="say__pct">%</span> uptime allows
          </span>
          {' '}
          <span className="say__line say__line--out"><output className="say__out" ref={monthRef} htmlFor="u-target" aria-live="off">{SAMPLE_MONTH}</output><span className="say__rest"> of downtime a month</span></span>
        </p>

        <div className="targets">
          <fieldset className="presets">
            <legend className="presets__legend">Common targets</legend>
            <div className="presets__row">
              {PRESETS.map((p) => <button key={p} className="preset" type="button" aria-pressed={ok && Number(p) === r.t} onClick={() => setTarget(p)}>{p}%</button>)}
            </div>
          </fieldset>
          <p className="targets__hint" id="u-target-hint" hidden={showTargetErr}>Three nines is 99.9, four nines is 99.99</p>
          <p className="targets__error" hidden={!showTargetErr}>{showTargetErr ? r.error : ''}</p>
        </div>

        <div className="band">
          <MonthGrid honeyH={budgetMin / 60} emberH={emberH} ok={ok} month={r.month} over={over} />

          <fieldset className="chain">
            <legend className="chain__legend">Services a request depends on</legend>
            <p className="chain__hint" id="chain-hint">Use each provider’s published availability. Leave a row empty to skip it</p>
            <ol className="chain__wire">
              {services.map((row, i) => {
                const empty = row.value === '';
                const state = i === r.bad ? ' is-bad' : empty ? ' is-empty' : ' is-on';
                return (
                  <li key={i} className={`row${state}`}>
                    <i className="row__node" aria-hidden="true" />
                    <label className="sr-only" htmlFor={`u-n${i}`}>Service {i + 1} name</label>
                    <input className="row__name" id={`u-n${i}`} type="text" placeholder={`Service ${i + 1}`} autoComplete="off" value={row.name} onChange={(e) => setRow(i, { name: e.target.value })} />
                    <label className="sr-only" htmlFor={`u-a${i}`}>Service {i + 1} availability (%)</label>
                    <span className="row__val">
                      <input className="row__pct" id={`u-a${i}`} type="text" inputMode="decimal" placeholder="%" autoComplete="off" aria-describedby="chain-hint" aria-invalid={i === r.bad} value={row.value} onChange={(e) => setRow(i, { value: cleanNum(e.target.value) })} />
                      <span className="row__unit" aria-hidden="true">%</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className={`sum${r.short ? ' is-short' : ''}${ok && hasChain && !r.short ? ' is-ok' : ''}`}>
              <i className="sum__term" aria-hidden="true" />
              <div className="sum__read">
                <p className="sum__label">Your chain of services</p>
                <p className="sum__fig"><output className="sum__chain" aria-live="off">{r.chain}</output><span className="sum__down">{r.chainDown.replace(/^ · /, '')}</span></p>
                <p className="sum__verdict">{r.verdict}</p>
                <p className="sum__error" hidden={!showChainErr}>{showChainErr ? r.error : ''}</p>
              </div>
            </div>
          </fieldset>
        </div>

        <table className="figs" role="table" aria-label="Downtime allowed by the target, per period">
          <tbody role="rowgroup">
            <tr role="row"><th scope="row" role="rowheader">Per day</th><td role="cell"><output aria-live="off">{r.day}</output></td></tr>
            <tr role="row"><th scope="row" role="rowheader">Per week</th><td role="cell"><output aria-live="off">{r.week}</output></td></tr>
            <tr role="row"><th scope="row" role="rowheader">Per month</th><td role="cell"><output aria-live="off">{r.month}</output></td></tr>
            <tr role="row"><th scope="row" role="rowheader">Per year</th><td role="cell"><output aria-live="off">{r.year}</output></td></tr>
          </tbody>
        </table>
        <p className="sr-only" ref={liveRef} aria-live="polite" />
      </div>
    </form>
  );
}
