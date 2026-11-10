import type { Faq } from './Shell';
import { company, links, service } from '@/lib/site';

/** Shown on the page and in the FAQPage structured data, so the two always match. Figures follow lib/logic.ts. */
export const FAQ: readonly Faq[] = [
  {
    q: 'How much downtime does 99.9% uptime allow?',
    a: 'A 99.9% availability target, often called three nines, allows about 43.8 minutes of downtime a month, 10.1 minutes a week, 1.4 minutes a day and 8 hours 46 minutes a year. The calculator uses an average month of 30.44 days and a year of 365.25 days, the convention most SLA tables follow, so its figures line up with what providers publish.',
  },
  {
    q: 'How do I work out the combined uptime of several services?',
    a: 'When a request needs every service in a chain to be up, their availabilities multiply. App servers at 99.95%, a database at 99.99% and a payment gateway at 99.9% come to about 99.84% together, or roughly 1 hour 10 minutes of downtime a month. That chain cannot meet a 99.9% target, which allows only 43.8 minutes, and the calculator says so.',
  },
  {
    q: 'What do the nines in an SLA mean?',
    a: 'The nines count the 9s in an availability percentage: 99.9% is three nines and 99.99% is four nines. Each extra nine cuts the allowed downtime by a factor of ten, from about 43.8 minutes a month at three nines to 4.4 minutes at four nines and about 26 seconds at five nines.',
  },
  {
    q: 'Why does the calculator not accept a 100% target?',
    a: 'A 100% target leaves no room for any downtime at all, planned maintenance included, so no hosting or cloud provider offers it. The calculator asks for a lower figure such as 99.99 instead. It accepts any target from 50% to 99.9999%, and each service in the chain can be anything above 0% and up to 100%.',
  },
  {
    q: 'Is the Uptime Budget Calculator free, and is anything I enter sent anywhere?',
    a: `Yes, it is free and needs no account or sign-up. Every calculation runs in your browser, so the targets and service names you type are never sent to a server or saved. The calculator is published by ${company.name}, a software studio in Dhaka, Bangladesh, and the page loads no ads or trackers.`,
  },
];

export function Guide() {
  return (
    <section className="ph-guide below" aria-labelledby="guide-h">
      <div className="wrap ph-guide__grid">
        <div>
          <h2 id="guide-h">How to use the uptime calculator</h2>
          <ol className="ph-steps">
            <li><p>Type your availability target into the headline, or pick one of the common targets from 99% to 99.99%.</p></li>
            <li><p>Read the downtime it allows per day, week, month and year, with the month drawn to scale in the grid.</p></li>
            <li><p>Under <strong>Services a request depends on</strong>, enter each provider’s published availability, such as your app servers, database and payment gateway.</p></li>
            <li><p>Check the combined figure. It says whether the chain can meet your target, and how much downtime a month is left over or missing.</p></li>
          </ol>
        </div>

        <div>
          <h2 id="faq-h">Uptime and SLA questions</h2>
          <div className="ph-faq">
            {FAQ.map((f) => (
              <div key={f.q}>
                <h3>{f.q}</h3>
                <p>{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="ph-guide__more">
          This calculator is published by <a href={links.home}>{company.name}</a>, which also sets up <a href={service('cloud-devops')}>cloud hosting and DevOps</a>, builds <a href={service('api-backend')}>APIs and backends</a> and runs <a href={service('database-infrastructure')}>database infrastructure</a> for teams that have to meet the uptime they promise.
        </p>
      </div>
    </section>
  );
}
