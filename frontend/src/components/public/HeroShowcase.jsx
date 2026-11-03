import styles from "./HeroShowcase.module.css";

const BARS = [60, 35, 100, 40, 85, 50, 90, 45, 75];

export default function HeroShowcase() {
  return (
    <div className={styles.frame}>
      <div className={styles.inner}>
        <div className={styles.left} data-animate="fade-left">

          <h2 className={styles.heading}>
            Manage your leads with{" "}
            <span className={styles.violet}>
              Advanced <u>CRM</u>
            </span>
          </h2>

          <p className={styles.lead}>
            Track every lead, follow-up, and meeting from one simple workspace
            built for modern sales teams.
          </p>

          <div className={styles.signup}>
            <input
              type="email"
              placeholder="What's your work email?"
              aria-label="Work email"
            />
            <button type="button">14 days free trial</button>
          </div>

          <div className={styles.checks}>
            <span><i>✓</i><b>Free trial</b> for 14 days</span>
            <span><i>✓</i><b>No credit card</b> required</span>
          </div>

        </div>

        <div className={styles.board} data-animate="fade-right" data-delay="200">
          <div className={`${styles.card} ${styles.task}`}>
            <small>Completed Tasks</small>
            <br />
            <b>12 Tasks</b>
            <span>View All</span>
          </div>

          <div className={`${styles.card} ${styles.comp}`}>
            <small>Active Leads</small>
            <big>48</big>
            <small>Leads added this month</small>
            <div className={styles.bars}>
              {BARS.map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className={`${styles.card} ${styles.main}`}>
            <div className={styles.row}>
              <div>
                <small>Follow-ups Done</small>
                <br />
                <b>34</b>
                <br />
                <em>This week</em>
              </div>
              <small>Pipeline View</small>
            </div>
            <svg viewBox="0 0 400 120" preserveAspectRatio="none">
              <path
                d="M0 70 C30 20 50 20 70 60 S110 100 140 60 S190 10 220 50 S270 110 300 50 S360 10 400 30"
                fill="none"
                stroke="#8b7cf6"
                strokeWidth="2.5"
              />
            </svg>
            <div className={styles.ring} />
          </div>

          <div className={`${styles.card} ${styles.exp}`}>
            <small>Meetings Scheduled</small>
            <br />
            <b>7</b>
            <em>↗ This week</em>
            <br />
            <small>Upcoming</small>
          </div>
        </div>

      </div>
    </div>
  );
}
