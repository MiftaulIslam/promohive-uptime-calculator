import Image from 'next/image';
import screens from '@/assets/photos/screens.jpg';
import dashboard from '@/assets/photos/dashboard.jpg';
import oncall from '@/assets/photos/oncall.jpg';
import { SAMPLE_SERVICES, SAMPLE_TARGET, uptimeBudget } from '@/lib/logic';

export function Problem() {
  return (
    <section className="problem below has-photo">
      <Image className="ph-bg" src={screens} alt="" fill sizes="100vw" placeholder="blur" />
      <div className="wrap">
        <h2 className="problem__head" data-in>A contract says 99.9% uptime and everyone nods</h2>
        <div className="problem__row">
          <p className="problem__big" data-in style={{ '--i': 1 }}>Few people know that allows about <span className="nb">43 minutes <span className="cellmark" aria-hidden="true"><span className="cellmark__lit" /></span></span> of downtime a month</p>
          <p className="problem__rest" data-in style={{ '--i': 2 }}>The real figure is lower when your app depends on a database, a payment gateway and an SMS provider, because their downtime adds up. Teams usually find this out during the first outage instead of when they sign.</p>
        </div>
      </div>
    </section>
  );
}

export function Maths() {
  const sample = uptimeBudget(SAMPLE_TARGET, SAMPLE_SERVICES);
  return (
    <section className="maths below">
      <div className="wrap">
        <div className="maths__head">
          <h2 data-in>Calendar maths you can check</h2>
          <p data-in style={{ '--i': 1 }}>A month is the average of 30.44 days and a year is 365.25 days, so the numbers line up with standard SLA tables.</p>
        </div>

        <figure className="ruler" data-in style={{ '--i': 2 }}>
          <div className="ruler__bars" aria-hidden="true">
            {Array.from({ length: 30 }, (_, i) => <i key={i} />)}
            <i className="sliver" />
          </div>
          <figcaption className="ruler__cap"><span>One month, 30 whole days</span><span className="ruler__sliver">The last 0.44 of a day, 10.5 hours</span></figcaption>
        </figure>

        <figure className="ruler ruler--year" data-in style={{ '--i': 3 }}>
          <div className="ruler__bars ruler__bars--year" aria-hidden="true" />
          <figcaption className="ruler__cap"><span>One year, 365 whole days</span><span className="ruler__sliver">And a quarter</span></figcaption>
        </figure>

        <div className="maths__foot">
          <p className="maths__note" data-in>The grid at the top draws 30 whole days to keep the cells even. The figures count the average month, which is 10.5 hours longer</p>
          <table className="sums" data-in style={{ '--i': 1 }} aria-label="The arithmetic behind the figures">
            <tbody>
              <tr><th scope="row">365.25 days ÷ 12</th><td>30.4375 days</td></tr>
              <tr><th scope="row">30.4375 days × 1,440 min</th><td>43,830 min</td></tr>
              <tr><th scope="row">365.25 days × 1,440 min</th><td>525,960 min</td></tr>
              <tr className="sums__live"><th scope="row">(1 − <span data-t="">{SAMPLE_TARGET}</span> ÷ 100) × 43,830</th><td id="check-month">{sample.month}</td></tr>
              <tr className="sums__live"><th scope="row">(1 − <span data-t="">{SAMPLE_TARGET}</span> ÷ 100) × 525,960</th><td id="check-year">{sample.year}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export function Who() {
  return (
    <section className="who below" aria-label="Who it is for">
      <article className="who__a" data-in>
        <Image className="who__tint" src={dashboard} alt="" fill sizes="(max-width: 900px) 100vw, 60vw" placeholder="blur" />
        <h2>Founders signing an SLA</h2>
        <p>Check what a promised uptime really allows before it goes into a contract.</p>
      </article>
      <article className="who__b has-photo" data-in style={{ '--i': 1 }}>
        <Image className="ph-bg" src={oncall} alt="" fill sizes="(max-width: 900px) 100vw, 45vw" placeholder="blur" />
        <span className="who__wire" aria-hidden="true"><i /><i /><i /></span>
        <h2>Engineers planning on-call</h2>
        <p>See how much downtime a month leaves once every dependency is counted.</p>
      </article>
    </section>
  );
}
