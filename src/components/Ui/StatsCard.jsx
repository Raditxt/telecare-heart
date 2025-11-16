import React from 'react';
import styles from './StatsCard.module.css';

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  color = 'blue',
  status, // optional: normal, warning, critical
  subtitle // optional: text kecil di bawah value
}) {
  return (
    <div className={`${styles.card} ${styles[color]} ${status ? styles[status] : ''}`}>
      <div className={styles.content}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.text}>
          <h3 className={styles.value}>{value}</h3>
          <p className={styles.title}>{title}</p>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}