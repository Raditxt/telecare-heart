import React, { useState, useEffect, useCallback } from "react";
import { register } from "../services/auth";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Register.module.css";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    deviceId: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  const navigate = useNavigate();

  // Handle window resize with debounce
  useEffect(() => {
    let timeoutId = null;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      setError("");
      setIsLoading(false);
    };
  }, []);

  const handleChange = useCallback((e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.name.trim()) {
      setError("Nama lengkap harus diisi");
      return;
    }

    if (!formData.email.trim()) {
      setError("Email harus diisi");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Format email tidak valid");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password harus minimal 6 karakter");
      return;
    }

    setIsLoading(true);

    try {
      // Default role 'patient'
      await register(formData.email, formData.password, {
        name: formData.name,
        role: "patient",
        deviceId: formData.deviceId
      });
      
      navigate("/login", { 
        state: { 
          message: "Pendaftaran berhasil! Silakan login dengan akun Anda." 
        } 
      });
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat pendaftaran");
    } finally {
      setIsLoading(false);
    }
  };

  const isMobile = windowSize.width < 768;
  const isDesktop = windowSize.width >= 1024;

  return (
    <div className={styles.container}>
      <div className={`${styles.main} ${isMobile ? styles.mainMobile : styles.mainDesktop}`}>

        <div className={` ${styles.formColumn} ${isMobile ? styles.formColumnMobile : ''} ${isDesktop ? styles.formColumnDesktop : ''}`}>
          <div className={styles.formContainer}>

            <div className={styles.header}>
              <h1 className={`${styles.title} ${isDesktop ? styles.titleDesktop : styles.titleMobile}`}>
                Daftar Akun Pasien
              </h1>
              <p className={`${styles.subtitle} ${isDesktop ? styles.subtitleDesktop : styles.subtitleMobile}`}>
                Buat akun TeleCare-Heart untuk memonitor kesehatan jantung Anda
              </p>
            </div>

            {error && (
              <div 
                className={styles.errorMessage}
                role="alert"
                aria-live="polite"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>
                  Nama Lengkap
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                  required
                  aria-required="true"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="contoh@domain.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                  required
                  aria-required="true"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="deviceId" className={styles.label}>
                  Device ID <span className={styles.optional}>(Opsional)</span>
                </label>
                <input
                  id="deviceId"
                  name="deviceId"
                  type="text"
                  placeholder="ESP32-A7F9B4"
                  value={formData.deviceId}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                  aria-describedby="deviceIdHelp"
                />
                <small id="deviceIdHelp" className={styles.helpText}>
                  Masukkan ID perangkat monitoring jantung Anda
                </small>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                  required
                  aria-required="true"
                  minLength="6"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Konfirmasi Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Ulangi password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                  required
                  aria-required="true"
                  minLength="6"
                />
              </div>

              <button 
                type="submit" 
                disabled={isLoading} 
                className={`${styles.button} ${isLoading ? styles.buttonDisabled : ''}`}
                aria-label={isLoading ? "Memproses pendaftaran" : "Daftar akun baru"}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Memproses...
                  </>
                ) : (
                  "Daftar"
                )}
              </button>
            </form>

            <p className={styles.loginLink}>
              Sudah punya akun?{" "}
              <Link to="/login" className={styles.link}>
                Masuk di sini
              </Link>
            </p>

            <div className={styles.info}>
              <div className={styles.infoTitle}>Informasi Penting</div>
              <p className={styles.infoText}>
                • Data Anda dilindungi dan dijaga kerahasiaannya
              </p>
              <p className={styles.infoText}>
                • Pastikan email yang Anda gunakan aktif
              </p>
              <p className={styles.infoText}>
                • Device ID dapat ditambahkan nanti di pengaturan akun
              </p>
            </div>

          </div>
        </div>

        {!isMobile && (
          <div className={`${styles.sidebar} ${isDesktop ? styles.sidebarDesktop : styles.sidebarTablet}`}>
            <div className={styles.sidebarContent}>
              <div className={styles.heartIcon}>
                <div className={styles.iconContainer}>
                  <svg 
                    className={styles.icon} 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </div>

              <h2 className={`${styles.sidebarTitle} ${isDesktop ? styles.sidebarTitleDesktop : styles.sidebarTitleTablet}`}>
                Bergabung dengan TeleCare-Heart
              </h2>
              <p className={`${styles.sidebarText} ${isDesktop ? styles.sidebarTextDesktop : styles.sidebarTextTablet}`}>
                Akses monitoring kesehatan jantung real-time dan konsultasi dokter profesional.
              </p>

              <div className={styles.features}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>❤️</span>
                  <span>Monitoring jantung 24/7</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>📊</span>
                  <span>Laporan kesehatan detail</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>👨‍⚕️</span>
                  <span>Konsultasi dokter online</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🔔</span>
                  <span>Notifikasi peringatan dini</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}