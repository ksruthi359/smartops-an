
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system settings.html',
  styleUrl: './system settings.css'
})
export class SystemSettings {

  activeTab = 'platform';

  // PLATFORM SETTINGS
  platformName = 'SmartOps Hub';
  tagline = 'AI-Powered Internal Ticketing';
  maintenanceMode = false;

  // FEATURE FLAGS
  featureFlags = {
    aiEnabled: true,
    knowledgeBase: true,
    notifications: true
  };

  // SECURITY SETTINGS
  security = {
  maxLoginAttempts: 5,
  sessionTimeout: 60,
  minPasswordLength: 8,
  enforceSSO: false,
  mfaRequired: false
};

  // EMAIL SETTINGS
  email = {
    senderName: 'SmartOps Hub',
    senderEmail: 'noreply@example.com'
  };

  message = '';

  // SWITCH BETWEEN TABS
  setTab(tab: string): void {
    this.activeTab = tab;
    this.message = '';
  }

  // SAVE SETTINGS
  saveSettings(): void {

    const settingsData = {
      platformName: this.platformName,
      tagline: this.tagline,
      maintenanceMode: this.maintenanceMode,
      featureFlags: this.featureFlags,
      security: this.security,
      email: this.email
    };

    console.log('System Settings:', settingsData);

    // Backend API integration will be added here.
    this.message = 'Settings updated on this page (not saved to server).';
  }
}
