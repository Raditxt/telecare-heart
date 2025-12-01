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

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Format email tidak valid");
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
        const roleDisplay = result.user.role === 'doctor' ? 'Dokter' : 
                           result.user.role === 'family' ? 'Keluarga Pasien' : 'Pengguna';
        
        setSuccessMessage(`Login berhasil! Selamat datang ${roleDisplay} ${result.user.name}.`);
        
        // Redirect berdasarkan role
        setTimeout(() => {
          navigate("/dashboard", { 
            state: { 
              welcomeMessage: `Selamat datang ${roleDisplay} ${result.user.name}!` 
            } 
          });
        }, 1500);
      } else {
        setError(result.error || "Email atau password salah. Silakan coba lagi.");
      }
    } catch {
      setError("Terjadi kesalahan saat login. Silakan coba lagi.");
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
              <div className={styles.logo}>
                <div className={styles.heartLogo}>❤️</div>
                <h1 className={`${styles.title} ${isDesktop ? styles.titleDesktop : styles.titleMobile}`}>
                  TeleCare-Heart
                </h1>
              </div>
              <p className={`${styles.subtitle} ${isDesktop ? styles.subtitleDesktop : styles.subtitleMobile}`}>
                Sistem Monitoring Kesehatan Jantung Terintegrasi
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
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Alamat Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="masukkan.email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  Kata Sandi
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
                    Sedang Masuk...
                  </>
                ) : (
                  'Masuk ke Sistem'
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className={styles.registerLink}>
              <p>
                Belum memiliki akun?{' '}
                <Link to="/register" className={styles.link}>
                  Daftar di sini
                </Link>
              </p>
            </div>

            {/* Security Info */}
            <div className={styles.securityInfo}>
              <div className={styles.securityIcon}>🔒</div>
              <p className={styles.securityText}>
                Data Anda dilindungi dengan sistem keamanan terenkripsi
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar (Desktop Only) */}
        {!isMobile && (
          <div className={`${styles.sidebar} ${isDesktop ? styles.sidebarDesktop : styles.sidebarTablet}`}>
            <div className={styles.sidebarContent}>
              
              <div className={styles.medicalIllustration}>
                <div className={styles.heartMonitor}>
                  <div className={styles.monitorScreen}>
                    <div className={styles.heartLine}></div>
                  </div>
                  <div className={styles.monitorBase}></div>
                </div>
              </div>

              <h2 className={`${styles.sidebarTitle} ${isDesktop ? styles.sidebarTitleDesktop : styles.sidebarTitleTablet}`}>
                Monitoring Kesehatan Jantung Real-time
              </h2>
              
              <p className={`${styles.sidebarText} ${isDesktop ? styles.sidebarTextDesktop : styles.sidebarTextTablet}`}>
                Platform canggih untuk memantau kondisi jantung pasien dengan teknologi terkini dan akses multi-peran yang aman.
              </p>

              <div className={styles.benefits}>
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>📈</span>
                  <div className={styles.benefitContent}>
                    <h4>Data Real-time</h4>
                    <p>Pantau detak jantung, SpO2, dan suhu tubuh secara live</p>
                  </div>
                </div>
                
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>👨‍⚕️</span>
                  <div className={styles.benefitContent}>
                    <h4>Kolaborasi Tim Medis</h4>
                    <p>Dokter dan keluarga dapat memantau bersama</p>
                  </div>
                </div>
                
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>🚨</span>
                  <div className={styles.benefitContent}>
                    <h4>Peringatan Dini</h4>
                    <p>Sistem notifikasi otomatis untuk kondisi kritis</p>
                  </div>
                </div>
              </div>

              <div className={styles.trustBadges}>
                <div className={styles.trustItem}>
                  <span className={styles.trustIcon}>🏥</span>
                  <span>Standar Medis</span>
                </div>
                <div className={styles.trustItem}>
                  <span className={styles.trustIcon}>🔐</span>
                  <span>Data Terenkripsi</span>
                </div>
                <div className={styles.trustItem}>
                  <span className={styles.trustIcon}>📱</span>
                  <span>Akses 24/7</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}