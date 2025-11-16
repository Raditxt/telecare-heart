// services/alertService.js

class AlertService {
  constructor() {
    this.subscribers = [];
    this.alertHistory = [];
    this.isMuted = false;
  }

  // Subscribe to alerts
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Check vital signs and trigger alerts
  checkVitals(vitals, patient = null) {
    const alerts = [];
    const { heartRate, spO2, temperature, deviceConnected } = vitals;

    // Heart Rate Alerts
    if (heartRate > 120) {
      alerts.push(this.createAlert(
        'critical',
        'heart_rate_high',
        `Heart Rate High: ${heartRate} BPM`,
        `Patient's heart rate is critically high (${heartRate} BPM)`,
        patient
      ));
    } else if (heartRate > 100) {
      alerts.push(this.createAlert(
        'warning',
        'heart_rate_elevated',
        `Heart Rate Elevated: ${heartRate} BPM`,
        `Patient's heart rate is elevated (${heartRate} BPM)`,
        patient
      ));
    } else if (heartRate < 50) {
      alerts.push(this.createAlert(
        'critical',
        'heart_rate_low',
        `Heart Rate Low: ${heartRate} BPM`,
        `Patient's heart rate is critically low (${heartRate} BPM)`,
        patient
      ));
    } else if (heartRate < 60) {
      alerts.push(this.createAlert(
        'warning',
        'heart_rate_low',
        `Heart Rate Low: ${heartRate} BPM`,
        `Patient's heart rate is low (${heartRate} BPM)`,
        patient
      ));
    }

    // SpO2 Alerts
    if (spO2 < 90) {
      alerts.push(this.createAlert(
        'critical',
        'spo2_low',
        `Low Oxygen: ${spO2}%`,
        `Patient's oxygen saturation is critically low (${spO2}%)`,
        patient
      ));
    } else if (spO2 < 95) {
      alerts.push(this.createAlert(
        'warning',
        'spo2_low',
        `Oxygen Low: ${spO2}%`,
        `Patient's oxygen saturation is low (${spO2}%)`,
        patient
      ));
    }

    // Temperature Alerts
    if (temperature > 38.5) {
      alerts.push(this.createAlert(
        'critical',
        'temperature_high',
        `High Temperature: ${temperature}°C`,
        `Patient's temperature is critically high (${temperature}°C)`,
        patient
      ));
    } else if (temperature > 37.5) {
      alerts.push(this.createAlert(
        'warning',
        'temperature_elevated',
        `Elevated Temperature: ${temperature}°C`,
        `Patient's temperature is elevated (${temperature}°C)`,
        patient
      ));
    }

    // Device Connection Alert
    if (!deviceConnected) {
      alerts.push(this.createAlert(
        'warning',
        'device_disconnected',
        'Device Disconnected',
        'Patient monitoring device is not connected',
        patient
      ));
    }

    // Trigger alerts
    alerts.forEach(alert => this.triggerAlert(alert));

    return alerts;
  }

  createAlert(level, type, title, message, patient = null) {
    return {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level, // 'critical', 'warning', 'info'
      type, // alert type for grouping
      title,
      message,
      patient: patient ? {
        id: patient.id,
        name: patient.name,
        deviceId: patient.deviceId
      } : null,
      timestamp: new Date(),
      isRead: false,
      isDismissed: false
    };
  }

  triggerAlert(alert) {
    // Add to history (keep last 100 alerts)
    this.alertHistory.unshift(alert);
    this.alertHistory = this.alertHistory.slice(0, 100);

    // Notify subscribers if not muted
    if (!this.isMuted) {
      this.subscribers.forEach(callback => callback(alert));
      
      // Show browser notification if permitted
      this.showBrowserNotification(alert);
    }

    // Log for debugging
    console.log(`🔔 Alert: ${alert.level.toUpperCase()} - ${alert.title}`, alert);
  }

  async showBrowserNotification(alert) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(alert.title, {
        body: alert.message,
        icon: '/favicon.ico',
        tag: alert.id,
        requireInteraction: alert.level === 'critical'
      });
    } else if (Notification.permission !== 'denied') {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.showBrowserNotification(alert);
      }
    }
  }

  // Mark alert as read
  markAsRead(alertId) {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
  }

  // Dismiss alert
  dismissAlert(alertId) {
    const alert = this.alertHistory.find(a => a.id === alertId);
    if (alert) {
      alert.isDismissed = true;
    }
  }

  // Dismiss all alerts of a type
  dismissAlertsByType(type) {
    this.alertHistory.forEach(alert => {
      if (alert.type === type && !alert.isDismissed) {
        alert.isDismissed = true;
      }
    });
  }

  // Get active alerts (not dismissed)
  getActiveAlerts() {
    return this.alertHistory.filter(alert => !alert.isDismissed);
  }

  // Get unread alerts
  getUnreadAlerts() {
    return this.alertHistory.filter(alert => !alert.isRead && !alert.isDismissed);
  }

  // Clear all alerts
  clearAllAlerts() {
    this.alertHistory.forEach(alert => {
      alert.isDismissed = true;
    });
  }

  // Mute/unmute alerts
  setMuted(muted) {
    this.isMuted = muted;
  }

  // Get alert statistics
  getAlertStats() {
    const activeAlerts = this.getActiveAlerts();
    return {
      total: activeAlerts.length,
      critical: activeAlerts.filter(a => a.level === 'critical').length,
      warning: activeAlerts.filter(a => a.level === 'warning').length,
      unread: this.getUnreadAlerts().length
    };
  }
}

// Export singleton instance
export const alertService = new AlertService();