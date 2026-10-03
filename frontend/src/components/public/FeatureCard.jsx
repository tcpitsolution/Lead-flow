import styles from "./FeatureCard.module.css";

export default function FeatureCard({ icon, title, desc, delay = 0 }) {
  return (
    <div className={styles.card} data-animate data-delay={delay}>
      <span className={styles.icon}>{icon}</span>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{desc}</p>
    </div>
  );
}
