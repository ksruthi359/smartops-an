
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings {
  activeTab = 'profile';
  notificationPreferences = {
  ticketAssigned: false,
  ticketStatusChanges: false,
  newComments: false,
  slaWarnings: false,
  aiSuggestions: false,
  emailTicketUpdates: false,
  weeklyDigest: false,
  emailMentions: false,
  slackUrgentAlerts: false,
  slackSlaAlerts: false,
  slackTeamMentions: false
};

  username = 'super_admin';
  email = 'superadmin@smartops.io';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  emailNotifications = true;
  requestNotifications = true;
  ticketNotifications = true;

  savedMessage = '';
  securityMessage = '';
  notificationMessage = '';

  setTab(tab: string): void {
    this.activeTab = tab;
    this.savedMessage = '';
    this.securityMessage = '';
    this.notificationMessage = '';
  }

  saveProfile(): void {
    this.savedMessage = 'Profile changes saved successfully.';
  }

  changePassword(): void {
    this.securityMessage = '';

    if (
      !this.currentPassword ||
      !this.newPassword ||
      !this.confirmPassword
    ) {
      this.securityMessage = 'Please fill in all password fields.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.securityMessage = 'New passwords do not match.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.securityMessage =
        'New password must contain at least 8 characters.';
      return;
    }

    this.securityMessage =
      'Validation successful. Connect the backend to update your password.';
  }

  saveNotifications(): void {
    this.notificationMessage =
      'Notification preferences saved successfully.';
  }
}
