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

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError("");
  }, [error]);

  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role,
      specialization: "",
      relationship: ""
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
              <div className={styles.logo}>
                <div className={styles.heartIcon}>❤️</div>
                <h1 className={styles.logoText}>TeleCare-Heart</h1>
              </div>
              <h2 className={`${styles.title} ${isDesktop ? styles.titleDesktop : styles.titleMobile}`}>
                Daftar Akun Baru
              </h2>
              <p className={`${styles.subtitle} ${isDesktop ? styles.subtitleDesktop : styles.subtitleMobile}`}>
                Bergabung dengan sistem monitoring jantung terintegrasi
              </p>
            </div>

            {error && (
              <div className={styles.errorMessage} role="alert">
                <span className={styles.errorIcon}>⚠️</span>
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div className={styles.roleSelection}>
              <h3 className={styles.roleTitle}>Pilih Peran Anda</h3>
              <div className={styles.roleButtons}>
                <button
                  type="button"
                  className={`${styles.roleButton} ${formData.role === 'doctor' ? styles.roleButtonActive : ''}`}
                  onClick={() => handleRoleSelect('doctor')}
                >
                  <span className={styles.roleIcon}>👨‍⚕️</span>
                  <div className={styles.roleContent}>
                    <span className={styles.roleText}>Dokter</span>
                    <span className={styles.roleDescription}>
                      Akses penuh monitoring pasien dan analisis data
                    </span>
                  </div>
                </button>
                
                <button
                  type="button"
                  className={`${styles.roleButton} ${formData.role === 'family' ? styles.roleButtonActive : ''}`}
                  onClick={() => handleRoleSelect('family')}
                >
                  <span className={styles.roleIcon}>👪</span>
                  <div className={styles.roleContent}>
                    <span className={styles.roleText}>Keluarga Pasien</span>
                    <span className={styles.roleDescription}>
                      Pantau kesehatan anggota keluarga
                    </span>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              {/* Basic Information */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>👤</span>
                  Informasi Pribadi
                </h3>
                
                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    Nama Lengkap
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Masukkan nama lengkap Anda"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={styles.input}
                    required
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="email@contoh.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={styles.input}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>
                      No. Telepon
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="08xxxxxxxxxx"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={styles.input}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role Specific Information */}
              {formData.role === 'doctor' && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>🏥</span>
                    Informasi Profesional
                  </h3>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="specialization" className={styles.label}>
                      Spesialisasi
                    </label>
                    <select
                      id="specialization"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={styles.input}
                      required
                    >
                      <option value="">Pilih spesialisasi</option>
                      <option value="Kardiolog">Kardiolog</option>
                      <option value="Dokter Umum">Dokter Umum</option>
                      <option value="Spesialis Penyakit Dalam">Spesialis Penyakit Dalam</option>
                      <option value="Dokter Emergency">Dokter Emergency</option>
                      <option value="Spesialis Jantung">Spesialis Jantung</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {formData.specialization === 'Lainnya' && (
                    <div className={styles.formGroup}>
                      <label htmlFor="customSpecialization" className={styles.label}>
                        Spesialisasi Lainnya
                      </label>
                      <input
                        id="customSpecialization"
                        name="specialization"
                        type="text"
                        placeholder="Masukkan spesialisasi Anda"
                        value={formData.specialization}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={styles.input}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {formData.role === 'family' && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>
                    <span className={styles.sectionIcon}>👨‍👩‍👧‍👦</span>
                    Informasi Keluarga
                  </h3>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="relationship" className={styles.label}>
                      Hubungan dengan Pasien
                    </label>
                    <select
                      id="relationship"
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleChange}
                      disabled={isLoading}
                      className={styles.input}
                      required
                    >
                      <option value="">Pilih hubungan</option>
                      <option value="Suami/Istri">Suami/Istri</option>
                      <option value="Anak">Anak</option>
                      <option value="Orang Tua">Orang Tua</option>
                      <option value="Saudara Kandung">Saudara Kandung</option>
                      <option value="Cucu">Cucu</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {formData.relationship === 'Lainnya' && (
                    <div className={styles.formGroup}>
                      <label htmlFor="customRelationship" className={styles.label}>
                        Hubungan Lainnya
                      </label>
                      <input
                        id="customRelationship"
                        name="relationship"
                        type="text"
                        placeholder="Masukkan hubungan Anda"
                        value={formData.relationship}
                        onChange={handleChange}
                        disabled={isLoading}
                        className={styles.input}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Password Section */}
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🔒</span>
                  Keamanan Akun
                </h3>
                
                <div className={styles.formRow}>
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
                      className={styles.input}
                      required
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
                      className={styles.input}
                      required
                      minLength="6"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !formData.role} 
                className={styles.submitButton}
              >
                {isLoading ? (
                  <>
                    <span className={styles.spinner}></span>
                    Membuat Akun...
                  </>
                ) : (
                  `Daftar sebagai ${formData.role === 'doctor' ? 'Dokter' : 'Keluarga Pasien'}`
                )}
              </button>
            </form>

            <div className={styles.footer}>
              <p className={styles.loginPrompt}>
                Sudah memiliki akun?{" "}
                <Link to="/login" className={styles.loginLink}>
                  Masuk di sini
                </Link>
              </p>
              
              <div className={styles.securityInfo}>
                <div className={styles.securityIcon}>🛡️</div>
                <div className={styles.securityText}>
                  <strong>Data Anda Aman</strong>
                  <span>Informasi pasien dilindungi dengan enkripsi</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {!isMobile && (
          <div className={`${styles.sidebar} ${isDesktop ? styles.sidebarDesktop : styles.sidebarTablet}`}>
            <div className={styles.sidebarContent}>
              <div className={styles.sidebarHeader}>
                <div className={styles.sidebarHeart}>💙</div>
                <h3>Sistem Monitoring Jantung</h3>
              </div>

              <div className={styles.benefits}>
                <h4>Keuntungan Bergabung</h4>
                <div className={styles.benefitList}>
                  <div className={styles.benefitItem}>
                    <span className={styles.benefitIcon}>📊</span>
                    <div className={styles.benefitText}>
                      <strong>Data Real-time</strong>
                      <span>Pantau kondisi jantung 24/7</span>
                    </div>
                  </div>
                  <div className={styles.benefitItem}>
                    <span className={styles.benefitIcon}>🚨</span>
                    <div className={styles.benefitText}>
                      <strong>Peringatan Dini</strong>
                      <span>Notifikasi kondisi darurat</span>
                    </div>
                  </div>
                  <div className={styles.benefitItem}>
                    <span className={styles.benefitIcon}>👨‍⚕️</span>
                    <div className={styles.benefitText}>
                      <strong>Dukungan Medis</strong>
                      <span>Tim dokter profesional</span>
                    </div>
                  </div>
                  <div className={styles.benefitItem}>
                    <span className={styles.benefitIcon}>📱</span>
                    <div className={styles.benefitText}>
                      <strong>Akses Mudah</strong>
                      <span>Dari perangkat mana saja</span>
                    </div>
                  </div>
                </div>
              </div>

              {formData.role && (
                <div className={styles.roleBenefits}>
                  <div className={styles.roleHeader}>
                    {formData.role === 'doctor' ? '👨‍⚕️' : '👪'}
                    <h5>Sebagai {formData.role === 'doctor' ? 'Dokter' : 'Keluarga'}</h5>
                  </div>
                  <ul className={styles.roleFeatures}>
                    {formData.role === 'doctor' ? (
                      <>
                        <li>Pantau multiple pasien</li>
                        <li>Analisis data ECG mendalam</li>
                        <li>Berikan rekomendasi medis</li>
                        <li>Akses riwayat kesehatan</li>
                      </>
                    ) : (
                      <>
                        <li>Pantau 1 pasien terkait</li>
                        <li>Notifikasi kondisi penting</li>
                        <li>Komunikasi dengan dokter</li>
                        <li>Lihat data vital sederhana</li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              <div className={styles.sidebarFooter}>
                <p>© 2024 TeleCare-Heart</p>
                <span>Sistem Monitoring Jantung Terintegrasi</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}