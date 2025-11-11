import React, { useState, useEffect } from "react";
import { login } from "../services/auth";
import { useNavigate, Link, useLocation } from "react-router-dom"; // ✅ TAMBAH useLocation
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const location = useLocation(); // ✅ UNTUK DAPATKAN STATE DARI REGISTER

  // ✅ EFFECT UNTUK HANDLE SUCCESS MESSAGE DARI REGISTER
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear state agar tidak muncul lagi saat refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  const isDesktop = window.innerWidth >= 1024;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage(""); // Clear success message saat login attempt
    setIsLoading(true);

    try {
      await login(email, password);
      setSuccessMessage("Login berhasil! Mengarahkan ke dashboard...");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Gagal login. Periksa email dan password Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.main} ${isMobile ? styles.mainMobile : styles.mainDesktop}`}>
        
        {/* Form Column */}
        <div className={`
          ${styles.formColumn} 
          ${isMobile ? styles.formColumnMobile : ''}
          ${isTablet ? styles.formColumnTablet : ''}
          ${isDesktop ? styles.formColumnDesktop : ''}
        `}>
          <div className={styles.formContainer}>
            
            {/* Header */}
            <div className={styles.header}>
              <h1 className={`${styles.title} ${isDesktop ? styles.titleDesktop : styles.titleMobile}`}>
                TeleCare-Heart
              </h1>
              <p className={`${styles.subtitle} ${isDesktop ? styles.subtitleDesktop : styles.subtitleMobile}`}>
                Masuk ke Akun Anda
              </p>
            </div>

            {/* ✅ SUCCESS MESSAGE DARI REGISTER */}
            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Form */}
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email</label>
              <input
                id="email"
                type="email"
                placeholder="contoh@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`${styles.button} ${isLoading ? styles.buttonDisabled : ''}`}
            >
              {isLoading ? (
                <>
                  <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }} />
                  </svg>
                  Memproses...
                </>
              ) : (
                'Masuk'
              )}
            </button>

            {/* Register Link */}
            <div className={styles.registerLink}>
              <p>
                Belum punya akun?{' '}
                <Link to="/register" className={styles.link}>
                  Daftar di sini
                </Link>
              </p>
            </div>

            {/* Demo Info */}
            <div className={styles.demoInfo}>
              <p className={styles.demoTitle}>Demo Login:</p>
              <p className={styles.demoText}>Email: test@example.com</p>
              <p className={styles.demoText}>Password: password123</p>
            </div>
          </div>
        </div>

        {/* Sidebar (Desktop Only) */}
        {!isMobile && (
          <div className={`
            ${styles.sidebar} 
            ${isTablet ? styles.sidebarTablet : ''}
            ${isDesktop ? styles.sidebarDesktop : ''}
          `}>
            <div className={styles.sidebarContent}>
              
              <div className={styles.heartIcon}>
                <div className={styles.iconContainer}>
                  <svg className={styles.icon} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </div>

              <h2 className={`${styles.sidebarTitle} ${isDesktop ? styles.sidebarTitleDesktop : styles.sidebarTitleTablet}`}>
                Monitoring Jantung Digital
              </h2>
              
              <p className={`${styles.sidebarText} ${isDesktop ? styles.sidebarTextDesktop : styles.sidebarTextTablet}`}>
                Akses data pasien Anda kapan saja, di mana saja dengan sistem terintegrasi dan aman.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}