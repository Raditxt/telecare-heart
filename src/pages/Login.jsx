import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link, useLocation } from "react-router-dom";
import styles from "./Login.module.css";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle success message from register
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const isMobile = windowSize.width < 768;
  const isDesktop = windowSize.width >= 1024;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    // Validation
    if (!email.trim()) {
      setError("Email harus diisi");
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password harus diisi");
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(email, password);
      
      if (result.success) {
        setSuccessMessage(`Login berhasil! Selamat datang ${result.user.role === 'doctor' ? 'Dokter' : ''} ${result.user.name}.`);
        
        // Redirect berdasarkan role
        setTimeout(() => {
          navigate("/dashboard", { 
            state: { 
              welcomeMessage: `Selamat datang ${result.user.role === 'doctor' ? 'Dokter' : ''} ${result.user.name}!` 
            } 
          });
        }, 1000);
      } else {
        setError(result.error || "Gagal login. Periksa email dan password Anda.");
      }
    } catch {
      setError("Terjadi kesalahan saat login. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    let demoEmail, demoPassword, demoRole;
    
    switch (role) {
      case 'doctor':
        demoEmail = "dr.tony@hospital.com";
        demoPassword = "password123";
        demoRole = "Dokter";
        break;
      case 'family':
        demoEmail = "peter.parker@gmail.com";
        demoPassword = "password123";
        demoRole = "Keluarga Pasien";
        break;
      default:
        demoEmail = "test@example.com";
        demoPassword = "password123";
        demoRole = "Pengguna";
    }

    setEmail(demoEmail);
    setPassword(demoPassword);

    try {
      const result = await login(demoEmail, demoPassword);
      
      if (result.success) {
        setSuccessMessage(`Demo login berhasil! Selamat datang ${demoRole}.`);
        
        setTimeout(() => {
          navigate("/dashboard", { 
            state: { 
              welcomeMessage: `Demo login berhasil! Selamat datang ${demoRole}.` 
            } 
          });
        }, 1000);
      } else {
        setError(`Demo login gagal. ${result.error}`);
      }
    } catch {
      setError("Demo login gagal. Pastikan backend server berjalan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.main} ${isMobile ? styles.mainMobile : styles.mainDesktop}`}>
        
        {/* Form Column */}
        <div className={`${styles.formColumn} ${isMobile ? styles.formColumnMobile : ''} ${isDesktop ? styles.formColumnDesktop : ''}`}>
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

            {/* Success Message */}
            {successMessage && (
              <div className={styles.successMessage}>
                <span className={styles.successIcon}>✅</span>
                {successMessage}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email *
                </label>
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
                <label htmlFor="password" className={styles.label}>
                  Password *
                </label>
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
                type="submit"
                disabled={isLoading}
                className={`${styles.button} ${isLoading ? styles.buttonDisabled : ''}`}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Memproses...
                  </>
                ) : (
                  'Masuk ke Akun'
                )}
              </button>
            </form>

            {/* Demo Login Buttons */}
            <div className={styles.demoSection}>
              <div className={styles.demoDivider}>
                <span>Atau coba demo</span>
              </div>
              
              <div className={styles.demoButtons}>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('doctor')}
                  disabled={isLoading}
                  className={`${styles.demoButton} ${styles.demoDoctor}`}
                >
                  <span className={styles.demoIcon}>👨‍⚕️</span>
                  Login sebagai Dokter
                </button>
                
                <button
                  type="button"
                  onClick={() => handleDemoLogin('family')}
                  disabled={isLoading}
                  className={`${styles.demoButton} ${styles.demoFamily}`}
                >
                  <span className={styles.demoIcon}>👪</span>
                  Login sebagai Keluarga
                </button>
              </div>
            </div>

            {/* Register Link */}
            <div className={styles.registerLink}>
              <p>
                Belum punya akun?{' '}
                <Link to="/register" className={styles.link}>
                  Daftar akun baru
                </Link>
              </p>
            </div>

            {/* Info */}
            <div className={styles.info}>
              <div className={styles.infoTitle}>Akses Berdasarkan Peran:</div>
              <div className={styles.infoItems}>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>👨‍⚕️</span>
                  <span>
                    <strong>Dokter:</strong> Pantau pasien, analisis data, berikan rekomendasi
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoIcon}>👪</span>
                  <span>
                    <strong>Keluarga:</strong> Pantau kesehatan anggota keluarga, terima notifikasi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar (Desktop Only) */}
        {!isMobile && (
          <div className={`${styles.sidebar} ${isDesktop ? styles.sidebarDesktop : styles.sidebarTablet}`}>
            <div className={styles.sidebarContent}>
              
              <div className={styles.heartIcon}>
                <div className={styles.iconContainer}>
                  <svg className={styles.icon} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </div>

              <h2 className={`${styles.sidebarTitle} ${isDesktop ? styles.sidebarTitleDesktop : styles.sidebarTitleTablet}`}>
                Sistem Monitoring Jantung Digital
              </h2>
              
              <p className={`${styles.sidebarText} ${isDesktop ? styles.sidebarTextDesktop : styles.sidebarTextTablet}`}>
                Platform terintegrasi untuk memantau kesehatan jantung pasien secara real-time dengan dukungan multi-role access.
              </p>

              <div className={styles.features}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🔒</span>
                  <span>Akses aman berdasarkan peran</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>📊</span>
                  <span>Data real-time 24/7</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>👨‍⚕️</span>
                  <span>Kolaborasi dokter & keluarga</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🚨</span>
                  <span>Sistem peringatan dini</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}