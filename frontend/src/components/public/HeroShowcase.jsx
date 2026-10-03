import styles from "./HeroShowcase.module.css";

const BARS = [60, 35, 100, 40, 85, 50, 90, 45, 75];
const LOGOS = ["Invert", "experia", "Proline", "Chroma", "Hitech", "experia"];

export default function HeroShowcase() {
  return (
    <div className={styles.frame}>
      <div className={styles.inner}>
        <div className={styles.left} data-animate="fade-left">
          <div className={styles.rating}>
            <span className={styles.stars}>★★★★★</span>
            Loved by 74,94084+ happy customers
          </div>

          <h2 className={styles.heading}>
            Transform our Business with{" "}
            <span className={styles.violet}>
              Advanced <u>CRM</u>
            </span>
          </h2>

          <p className={styles.lead}>
            Elevate your business with an advanced CRM platform that simplifies
            management and accelerates success.
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
            <span>
              <i>✓</i>
              <b>Free forever</b> for core features
            </span>
            <span>
              <i>✓</i>
              <b>No credit card</b> required
            </span>
          </div>

          <div className={styles.proof}>
            <div className={styles.score}>
              <strong>
                4.8 <span>★</span>
              </strong>
              <small>Reviews</small>
            </div>
            <div className={styles.faces}>
              <div />
              <div />
              <div />
              <div />
            </div>
            <p>
              More than 6.7M users have used
              <br />
              Mynex for their daily business
            </p>
          </div>
        </div>

        <div className={styles.board} data-animate="fade-right" data-delay="200">
          <div className={`${styles.card} ${styles.task}`}>
            <small>Completed Task</small>
            <br />
            <b>44 Task</b>
            <span>View All</span>
          </div>

          <div className={`${styles.card} ${styles.comp}`}>
            <small>Highlighted Companies</small>
            <big>$1,641k</big>
            <small>Total Transaction &amp; Activities in Last Month</small>
            <div className={styles.bars}>
              {BARS.map((h, i) => (
                <i key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className={`${styles.card} ${styles.main}`}>
            <div className={styles.row}>
              <div>
                <small>Total Sales</small>
                <br />
                <b>$76,933</b>
                <br />
                <em>8.5% Up from yesterday</em>
              </div>
              <small>Sales Analytics</small>
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
            <small>Total Expenses</small>
            <br />
            <b>$8,414</b>
            <em>↗ 12%</em>
            <br />
            <small>This Month</small>
          </div>
        </div>

        <div className={styles.logos}>
          {LOGOS.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
