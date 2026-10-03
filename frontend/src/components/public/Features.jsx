import FeatureCard from './FeatureCard'
import styles from './Features.module.css'

const features = [
  {
    icon: '🎯',
    title: 'Smart Lead Scoring',
    desc: 'Automatically score and prioritize leads based on engagement, behavior, and fit.',
  },
  {
    icon: '📅',
    title: 'Follow-up Reminders',
    desc: 'Never miss a follow-up. Set smart reminders and let the system keep you on track.',
  },
  {
    icon: '📊',
    title: 'Pipeline Analytics',
    desc: 'Visualize your entire sales pipeline with real-time charts and conversion metrics.',
  },
  {
    icon: '🤝',
    title: 'Meeting Scheduler',
    desc: 'Schedule and manage client meetings directly from your CRM dashboard.',
  },
  {
    icon: '📧',
    title: 'Email Integration',
    desc: 'Sync your inbox and track email opens, clicks, and replies automatically.',
  },
  {
    icon: '🔒',
    title: 'Role-based Access',
    desc: 'Control who sees what with granular permissions for your entire team.',
  },
]

export default function Features() {
  return (
    <section className={styles.section}>
      <div className={styles.header} data-animate>
        <span className={styles.tag}>Features</span>
        <h2 className={styles.title}>Everything you need to close deals faster</h2>
        <p className={styles.subtitle}>
          A complete toolkit for modern sales teams — from first contact to closed deal.
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
