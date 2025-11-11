import React from 'react';
import styles from './StatsCard.module.css';

export default function StatsCard({ title, value, icon, color = 'blue' }) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.content}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.text}>
          <h3 className={styles.value}>{value}</h3>
          <p className={styles.title}>{title}</p>
        </div>
      </div>
    </div>
  );
}