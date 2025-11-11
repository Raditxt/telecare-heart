import React, { useState } from "react";
import { register } from "../services/auth";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Register.module.css";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient",
    deviceId: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
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
      await register(formData.email, formData.password, {
        name: formData.name,
        role: formData.role,
        deviceId: formData.deviceId
      });
      
      // Redirect to login with success message
      navigate("/login", { 
        state: { 
          message: "Pendaftaran berhasil! Silakan login dengan akun Anda." 
        } 
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const isMobile = window.innerWidth < 768;
  const isDesktop = window.innerWidth >= 1024;

  return (
    <div className={styles.container}>
      <div className={`${styles.main} ${isMobile ? styles.mainMobile : styles.mainDesktop}`}>
        
        {/* Form Column */}
        <div className={`
          ${styles.formColumn} 
          ${isMobile ? styles.formColumnMobile : ''}
          ${isDesktop ? styles.formColumnDesktop : ''}
        `}>
          <div className={styles.formContainer}>
            
            {/* Header */}
            <div className={styles.header}>
              <h1 className={`${styles.title} ${isDesktop ? styles.titleDesktop : styles.titleMobile}`}>
                Daftar Akun Baru
              </h1>
              <p className={`${styles.subtitle} ${isDesktop ? styles.subtitleDesktop : styles.subtitleMobile}`}>
                Buat akun TeleCare-Heart Anda
              </p>
            </div>

            {/* Error Message */}
            {error && <div className={styles.errorMessage}>{error}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Name Input */}
              <div className={styles.formGroup}>
                <label htmlFor="name" className={styles.label}>Nama Lengkap</label>
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
                />
              </div>

              {/* Email Input */}
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>Email</label>
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
                />
              </div>

              {/* Role Selection */}
              <div className={styles.formGroup}>
                <label htmlFor="role" className={styles.label}>Peran</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                >
                  <option value="patient">Pasien</option>
                  <option value="doctor">Dokter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Device ID (Optional) */}
              <div className={styles.formGroup}>
                <label htmlFor="deviceId" className={styles.label}>
                  Device ID (Opsional)
                  <span className={styles.optional}>- untuk pasien</span>
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
                />
              </div>

              {/* Password Input */}
              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>Password</label>
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
                />
              </div>

              {/* Confirm Password Input */}
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>Konfirmasi Password</label>
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
                    <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" style={{ opacity: 0.25 }} />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" style={{ opacity: 0.75 }} />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  'Daftar'
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className={styles.loginLink}>
              Sudah punya akun?{' '}
              <Link to="/login" className={styles.link}>
                Masuk di sini
              </Link>
            </p>

            {/* Info */}
            <div className={styles.info}>
              <p className={styles.infoTitle}>Informasi:</p>
              <p className={styles.infoText}>• <strong>Pasien:</strong> Dapat melihat data kesehatan sendiri</p>
              <p className={styles.infoText}>• <strong>Dokter:</strong> Dapat melihat data semua pasien</p>
              <p className={styles.infoText}>• <strong>Admin:</strong> Akses penuh ke sistem</p>
            </div>
          </div>
        </div>

        {/* Sidebar (Desktop Only) */}
        {!isMobile && (
          <div className={`
            ${styles.sidebar} 
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
                Bergabung dengan TeleCare-Heart
              </h2>
              
              <p className={`${styles.sidebarText} ${isDesktop ? styles.sidebarTextDesktop : styles.sidebarTextTablet}`}>
                Dapatkan akses ke monitoring kesehatan jantung real-time dan konsultasi dengan dokter profesional.
              </p>

              <div className={styles.features}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>📊</span>
                  <span>Monitoring Real-time</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>👨‍⚕️</span>
                  <span>Konsultasi Dokter</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>📱</span>
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