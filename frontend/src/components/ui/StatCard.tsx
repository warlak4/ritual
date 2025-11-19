import styles from './statcard.module.css';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  icon?: string;
}

export function StatCard({ title, value, subtitle, trend, icon }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.title}>{title}</p>
          <h3 className="brand-heading">{value}</h3>
        </div>
        {icon ? <span className={styles.icon}>{icon}</span> : null}
      </div>
      <div className={styles.footer}>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
        {trend ? (
          <span className={`${styles.trend} ${trend.value >= 0 ? styles.up : styles.down}`}>
            {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
          </span>
        ) : null}
      </div>
    </div>
  );
}

