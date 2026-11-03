import { Link } from "react-router-dom";
import styles from "./Hero.module.css";
import HeroShowcase from "./HeroShowcase";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <h1 className={styles.title} data-animate data-delay="200">
        Close more deals with
        <br />
        <span className={styles.accent}>intelligent lead tracking</span>
      </h1>

      <p className={styles.subtitle} data-animate data-delay="300">
        LeadFlow helps you manage leads, schedule follow-ups, and track your
        pipeline — all in one simple dashboard.
      </p>

      <div className={styles.cta} data-animate data-delay="400">
        <Link to="/signup" className={styles.primaryBtn}>
          Start for free
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <Link to="/features" className={styles.secondaryBtn}>
          See how it works
        </Link>
      </div>

      <div className={styles.demoWrapper} data-animate="zoom" data-delay="200">
        <div className={styles.demoGlow} />
        <HeroShowcase />
      </div>
    </section>
  );
}
