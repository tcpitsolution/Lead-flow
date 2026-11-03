import FeatureCard from './FeatureCard'
import styles from './Features.module.css'

const features = [
  {
    icon: '🔍',
    title: 'AI Client Finder',
    desc: 'Search any city and business type — LeadFlow finds real businesses from Google Maps, audits their websites, and gives you ready-to-send outreach messages.',
  },
  {
    icon: '📋',
    title: 'Lead Management',
    desc: 'Add leads with name, company, phone, email, and deal value. Move them through pipeline stages — Prospecting, Qualification, Proposal, Won, or Lost.',
  },
  {
    icon: '📅',
    title: 'Follow-up Reminders',
    desc: 'Set a follow-up date on any lead and never miss a callback. Your dashboard shows overdue and upcoming follow-ups at a glance.',
  },
  {
    icon: '🏢',
    title: 'Companies & Activities',
    desc: 'Organise leads by company and log every call, meeting, or note as an activity so your entire history is always in one place.',
  },
  {
    icon: '✅',
    title: 'Tasks',
    desc: 'Create tasks linked to your leads and mark them done as you go. Stay on top of every action item without switching tools.',
  },
  {
    icon: '📊',
    title: 'Pipeline & Analytics',
    desc: 'See your pipeline value, win rate, and monthly revenue forecast in a live dashboard built from your actual lead data — no fake numbers.',
  },
]

export default function Features() {
  return (
    <section className={styles.section}>
      <div className={styles.header} data-animate>
        <span className={styles.tag}>Features</span>
        <h2 className={styles.title}>What you get with LeadFlow</h2>
        <p className={styles.subtitle}>
          Every tool you need to find clients, track leads, and close more deals.
        </p>
      </div>
      <div className={styles.grid}>
        {features.map((f, i) => (
          <FeatureCard key={f.title} {...f} delay={(i % 3) * 100 + 100} />
        ))}
      </div>
    </section>
  )
}
