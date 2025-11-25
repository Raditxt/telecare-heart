import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Register.module.css";

export default function Register() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "", // 'doctor' or 'family'
    phone: "",
    specialization: "", // for doctor
    relationship: "", // for family
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
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError("");
  }, [error]);

  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role,
      specialization: "", // Reset specialization when role changes
      relationship: "" // Reset relationship when role changes
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return "Nama lengkap harus diisi";
    }

    if (!formData.email.trim()) {
      return "Email harus diisi";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return "Format email tidak valid";
    }

    if (!formData.role) {
      return "Pilih peran Anda (Dokter atau Keluarga Pasien)";
    }

    if (formData.role === 'doctor' && !formData.specialization.trim()) {
      return "Spesialisasi dokter harus diisi";
    }

    if (formData.role === 'family' && !formData.relationship.trim()) {
      return "Hubungan dengan pasien harus diisi";
    }

    if (formData.password.length < 6) {
      return "Password harus minimal 6 karakter";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Password dan konfirmasi password tidak cocok";
    }

    if (!formData.phone.trim()) {
      return "Nomor telepon harus diisi";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        specialization: formData.specialization,
        relationship: formData.relationship
      });

      if (result.success) {
        navigate("/dashboard", { 
          state: { 
            message: `Pendaftaran berhasil! Selamat datang ${formData.role === 'doctor' ? 'Dokter' : ''} ${formData.name}.` 
          } 
        });
      } else {
        setError(result.error || "Terjadi kesalahan saat pendaftaran");
      }
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

        <div className={`${styles.formColumn} ${isMobile ? styles.formColumnMobile : ''} ${isDesktop ? styles.formColumnDesktop : ''}`}>
          <div className={styles.formContainer}>

            <div className={styles.header}>
              <h1 className={`${styles.title} ${isDesktop ? styles.titleDesktop : styles.titleMobile}`}>
                Daftar Akun TeleCare-Heart
              </h1>
              <p className={`${styles.subtitle} ${isDesktop ? styles.subtitleDesktop : styles.subtitleMobile}`}>
                Pilih peran Anda dan buat akun untuk mulai memonitor kesehatan jantung
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

            {/* Role Selection */}
            <div className={styles.roleSelection}>
              <h3 className={styles.roleTitle}>Saya adalah:</h3>
              <div className={styles.roleButtons}>
                <button
                  type="button"
                  className={`${styles.roleButton} ${formData.role === 'doctor' ? styles.roleButtonActive : ''}`}
                  onClick={() => handleRoleSelect('doctor')}
                >
                  <span className={styles.roleIcon}>👨‍⚕️</span>
                  <span className={styles.roleText}>Dokter</span>
                  <span className={styles.roleDescription}>
                    Memantau pasien dan menganalisis data kesehatan
                  </span>
                </button>
                
                <button
                  type="button"
                  className={`${styles.roleButton} ${formData.role === 'family' ? styles.roleButtonActive : ''}`}
                  onClick={() => handleRoleSelect('family')}
                >
                  <span className={styles.roleIcon}>👪</span>
                  <span className={styles.roleText}>Keluarga Pasien</span>
                  <span className={styles.roleDescription}>
                    Memantau kesehatan anggota keluarga
                  </span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Basic Information */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Informasi Dasar</h3>
                
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    Nama Lengkap *
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
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email" className={styles.label}>
                    Email *
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
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone" className={styles.label}>
                    Nomor Telepon *
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+62 812-3456-7890"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                    required
                  />
                </div>
              </div>

              {/* Role Specific Information */}
              {formData.role === 'doctor' && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Informasi Profesional</h3>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="specialization" className={styles.label}>
                      Spesialisasi *
                    </label>
                    <select
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                      required
                    >
                      <option value="">Pilih spesialisasi</option>
                      <option value="Cardiologist">Kardiologis</option>
                      <option value="General Practitioner">Dokter Umum</option>
                      <option value="Internist">Penyakit Dalam</option>
                      <option value="Emergency Medicine">Dokter Emergency</option>
                      <option value="Other">Lainnya</option>
                    </select>
                  </div>

                  {formData.specialization === 'Other' && (
                    <div className={styles.formGroup}>
                      <label htmlFor="customSpecialization" className={styles.label}>
                        Spesialisasi Lainnya *
                      </label>
                      <input
                        id="customSpecialization"
                        name="specialization"
                        type="text"
                        placeholder="Masukkan spesialisasi Anda"
                        value={formData.specialization}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {formData.role === 'family' && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>Informasi Keluarga</h3>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="relationship" className={styles.label}>
                      Hubungan dengan Pasien *
                    </label>
                    <select
                      id="relationship"
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                      required
                    >
                      <option value="">Pilih hubungan</option>
                      <option value="spouse">Suami/Istri</option>
                      <option value="child">Anak</option>
                      <option value="parent">Orang Tua</option>
                      <option value="sibling">Saudara Kandung</option>
                      <option value="grandchild">Cucu</option>
                      <option value="other">Lainnya</option>
                    </select>
                  </div>

                  {formData.relationship === 'other' && (
                    <div className={styles.formGroup}>
                      <label htmlFor="customRelationship" className={styles.label}>
                        Hubungan Lainnya *
                      </label>
                      <input
                        id="customRelationship"
                        name="relationship"
                        type="text"
                        placeholder="Masukkan hubungan Anda dengan pasien"
                        value={formData.relationship}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={`${styles.input} ${isLoading ? styles.inputDisabled : ''}`}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Password Section */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Keamanan Akun</h3>
                
                <div className={styles.formGroup}>
                  <label htmlFor="password" className={styles.label}>
                    Password *
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
                    minLength="6"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    Konfirmasi Password *
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
                    minLength="6"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !formData.role} 
                className={`${styles.button} ${isLoading ? styles.buttonDisabled : ''} ${!formData.role ? styles.buttonInactive : ''}`}
                aria-label={isLoading ? "Memproses pendaftaran" : "Daftar akun baru"}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Memproses Pendaftaran...
                  </>
                ) : (
                  `Daftar sebagai ${formData.role === 'doctor' ? 'Dokter' : formData.role === 'family' ? 'Keluarga Pasien' : 'Pengguna'}`
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
                • Pastikan informasi yang Anda berikan akurat
              </p>
              <p className={styles.infoText}>
                • {formData.role === 'doctor' 
                    ? 'Dokter akan diverifikasi oleh admin sebelum dapat mengakses fitur lengkap' 
                    : 'Keluarga pasien dapat memantau setelah dihubungkan dengan pasien oleh dokter'
                  }
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
              
              {formData.role === 'doctor' ? (
                <div className={styles.roleSpecificInfo}>
                  <p className={`${styles.sidebarText} ${isDesktop ? styles.sidebarTextDesktop : styles.sidebarTextTablet}`}>
                    Sebagai <strong>Dokter</strong>, Anda dapat:
                  </p>
                  <div className={styles.features}>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>👨‍⚕️</span>
                      <span>Memantau pasien secara real-time</span>
                    </div>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>📊</span>
                      <span>Menganalisis data ECG dan vital signs</span>
                    </div>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>💊</span>
                      <span>Memberikan rekomendasi pengobatan</span>
                    </div>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>🔔</span>
                      <span>Menerima alert kondisi kritis pasien</span>
                    </div>
                  </div>
                </div>
              ) : formData.role === 'family' ? (
                <div className={styles.roleSpecificInfo}>
                  <p className={`${styles.sidebarText} ${isDesktop ? styles.sidebarTextDesktop : styles.sidebarTextTablet}`}>
                    Sebagai <strong>Keluarga Pasien</strong>, Anda dapat:
                  </p>
                  <div className={styles.features}>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>👪</span>
                      <span>Memantau kesehatan anggota keluarga</span>
                    </div>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>❤️</span>
                      <span>Melihat data vital signs real-time</span>
                    </div>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>📱</span>
                      <span>Menerima notifikasi kondisi darurat</span>
                    </div>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>💬</span>
                      <span>Berkomunikasi dengan dokter</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.roleSpecificInfo}>
                  <p className={`${styles.sidebarText} ${isDesktop ? styles.sidebarTextDesktop : styles.sidebarTextTablet}`}>
                    Pilih peran Anda untuk melihat fitur yang tersedia
                  </p>
                  <div className={styles.features}>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>🔒</span>
                      <span>Data pasien terlindungi dan aman</span>
                    </div>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>📈</span>
                      <span>Monitoring kesehatan 24/7</span>
                    </div>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>🚨</span>
                      <span>Sistem peringatan dini</span>
                    </div>
                    <div className={styles.feature}>
                      <span className={styles.featureIcon}>🏥</span>
                      <span>Integrasi dengan profesional kesehatan</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}