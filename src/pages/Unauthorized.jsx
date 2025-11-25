// src/pages/Unauthorized.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Unauthorized.module.css';

export default function Unauthorized() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.icon}>🚫</div>
        <h1 className={styles.title}>Akses Ditolak</h1>
        <p className={styles.message}>
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <div className={styles.actions}>
          <Link to="/dashboard" className={styles.primaryButton}>
            Kembali ke Dashboard
          </Link>
          <Link to="/" className={styles.secondaryButton}>
            Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}