import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient ,HttpHeaders} from '@angular/common/http'
import { FormsModule } from '@angular/forms';

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  editable: boolean;
}

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system settings.html',
  styleUrl: './system settings.css'
})
export class SystemSettings {
  activeTab = 'platform';
  message = '';

  // Platform settings
  platformName = 'SmartOps Hub';
  tagline = 'AI-Powered Internal Ticketing';
  maintenanceMode = false;

  // Feature flags
  private readonly featureFlagsUrl =
    'http://127.0.0.1:8000/api/v1/super_admin_dashboard/feature-flags/';

  private savedFlagValues = new Map<string, boolean>();

  featureFlags: FeatureFlag[] = [];
  loadingFlags = false;
  savingFlags = false;
  flagError = '';
  flagMessage = '';

  // Security settings
  security = {
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    minPasswordLength: 8,
    enforceSSO: false,
    mfaRequired: false
  };

  // Email settings
  email = {
    senderName: 'SmartOps Hub',
    senderEmail: 'noreply@example.com'
  };

  constructor(
    private readonly http: HttpClient,
    private readonly changeDetector: ChangeDetectorRef
  ) {}

  setTab(tab: string): void {
    this.activeTab = tab;
    this.message = '';

    if (tab === 'features' && !this.hasFlagChanges) {
      this.loadFeatureFlags();
    }
  }

  get hasFlagChanges(): boolean {
    return this.featureFlags.some(
      flag => flag.editable && this.savedFlagValues.get(flag.key) !== flag.enabled
    );
  }
private getHeaders(): HttpHeaders | null {
  const token = localStorage.getItem('access_token');

  if (!token) {
    return null;
  }

  return new HttpHeaders({
    Authorization: `Bearer ${token}`
  });
}
  loadFeatureFlags(): void {
    if (this.loadingFlags || this.savingFlags) return;
    const headers = this.getHeaders();
if (!headers) {
  this.flagError = 'Please log in again to load feature flags.';
  return;
}

    this.loadingFlags = true;
    this.flagError = '';
    this.flagMessage = '';

    this.http.get<FeatureFlag[]>(this.featureFlagsUrl, { headers }).subscribe({
      next: flags => {
        this.applySavedFlags(flags);
        this.loadingFlags = false;
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.loadingFlags = false;
        this.flagError = 'Unable to load feature flags.';
        this.changeDetector.markForCheck();
      }
    });
  }

  toggleFlag(flag: FeatureFlag): void {
    if (!flag.editable || this.loadingFlags || this.savingFlags) return;

    flag.enabled = !flag.enabled;
    this.flagMessage = '';
  }

  saveFeatureFlags(): void {
    if (this.loadingFlags || this.savingFlags) return;

    this.flagError = '';
    this.flagMessage = '';

    if (!this.hasFlagChanges) {
      this.flagMessage = 'No changes to save.';
      return;
    }

    const changes: Record<string, boolean> = {};

    for (const flag of this.featureFlags) {
      if (flag.editable && this.savedFlagValues.get(flag.key) !== flag.enabled) {
        changes[flag.key] = flag.enabled;
      }
    }

    const headers = this.getHeaders();
if (!headers) {
  this.flagError = 'Please log in again to save feature flags.';
  return;
}

this.savingFlags = true;

this.http.patch<FeatureFlag[]>(this.featureFlagsUrl, changes, { headers }).subscribe({
      next: flags => {
        this.applySavedFlags(flags);
        this.savingFlags = false;
        this.flagMessage = 'Feature flags saved.';
        this.changeDetector.markForCheck();
      },
      error: () => {
        this.savingFlags = false;
        this.flagError = 'Unable to save feature flags. Please try again.';
        this.changeDetector.markForCheck();
      }
    });
  }

  saveSettings(): void {
    if (this.activeTab === 'features') {
      this.saveFeatureFlags();
      return;
    }

    this.message = 'Settings updated on this page (not saved to server).';
  }

  private applySavedFlags(flags: FeatureFlag[]): void {
    this.featureFlags = flags;
    this.savedFlagValues = new Map(
      flags.map(flag => [flag.key, flag.enabled])
    );
  }
}