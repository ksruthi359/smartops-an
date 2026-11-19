import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Organization,
  OrganizationService
} from '../../services/organization';

@Component({
  selector: 'app-all-organizations',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './all-organizations.html',
  styleUrl: './all-organizations.css'
})
export class AllOrganizations implements OnInit {

  organizations: Organization[] = [];

  searchText = '';

  loading = false;
  error = '';

  // =========================
  // VIEW POPUP
  // =========================

  selectedOrganization: Organization | null = null;

  showViewModal = false;


  // =========================
  // EDIT POPUP
  // =========================

  selectedEditOrganization: Organization | null = null;

  showEditModal = false;

  editOrganizationName = '';

  editLoading = false;

  editError = '';


  constructor(
    private organizationService: OrganizationService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
    this.loadOrganizations();
  }


  // =========================
  // LOAD ORGANIZATIONS
  // =========================

  loadOrganizations(): void {

    this.loading = true;
    this.error = '';

    this.organizationService.getOrganizations().subscribe({

      next: (data) => {

        console.log('Organizations received:', data);

        this.organizations = data;

        this.loading = false;

        console.log(
          'Loading:',
          this.loading
        );

        console.log(
          'Organizations:',
          this.organizations
        );

        this.changeDetectorRef.detectChanges();
      },

      error: (err) => {

        console.error(
          'Organization API error:',
          err
        );

        this.error = 'Unable to load organizations.';

        this.loading = false;

        this.changeDetectorRef.detectChanges();
      }

    });
  }


  // =========================
  // SEARCH
  // =========================

  get filteredOrganizations(): Organization[] {

    const search = this.searchText
      .trim()
      .toLowerCase();

    if (!search) {
      return this.organizations;
    }

    return this.organizations.filter(
      organization =>
        organization.name
          .toLowerCase()
          .includes(search)
    );
  }


  // =========================
  // VIEW ORGANIZATION
  // =========================

  viewOrganization(
    organization: Organization
  ): void {

    this.selectedOrganization = organization;

    this.showViewModal = true;
  }


  closeViewModal(): void {

    this.showViewModal = false;

    this.selectedOrganization = null;
  }


  // =========================
  // OPEN EDIT POPUP
  // =========================

  editOrganization(
    organization: Organization
  ): void {

    this.selectedEditOrganization = organization;

    this.editOrganizationName = organization.name;

    this.editError = '';

    this.showEditModal = true;
  }


  // =========================
  // CLOSE EDIT POPUP
  // =========================

  closeEditModal(): void {

    this.showEditModal = false;

    this.selectedEditOrganization = null;

    this.editOrganizationName = '';

    this.editError = '';
  }


  // =========================
  // SAVE ORGANIZATION
  // =========================

  saveOrganization(): void {

    if (!this.selectedEditOrganization) {
      return;
    }

    const name = this.editOrganizationName.trim();

    // Empty name validation
    if (!name) {

      this.editError = 'Organization name is required.';

      return;
    }


    this.editLoading = true;

    this.editError = '';


    this.organizationService
      .updateOrganization(
        this.selectedEditOrganization.id,
        {
          name: name
        }
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Organization updated:',
            response
          );


          // Update organization in frontend
          this.selectedEditOrganization!.name = name;


          // Close popup
          this.closeEditModal();


          // Reload latest organizations from backend
          this.loadOrganizations();

        },


        error: (err) => {

          console.error(
            'Organization update error:',
            err
          );

          this.editError =
            'Unable to update organization.';

          this.editLoading = false;

        },


        complete: () => {

          this.editLoading = false;

        }

      });
  }
  // =========================
  // DELETE ORGANIZATION
  // =========================
deleteOrganization(organization: Organization): void {

    const confirmed = window.confirm(
      `Are you sure you want to delete "${organization.name}"?`
    );

    if (!confirmed) {
      return;
    }

    this.organizationService
      .deleteOrganization(organization.id)
      .subscribe({

        next: () => {
          // Remove the organization from the displayed list
          this.organizations = this.organizations.filter(
            item => item.id !== organization.id
          );

          // Close the view popup if it shows this organization
          if (this.selectedOrganization?.id === organization.id) {
            this.closeViewModal();
          }

          console.log(
            'Organization deleted:',
            organization.id
          );
        },

        error: (err:any) => {
          console.error('Organization delete error:', err);

          window.alert(
            err?.error?.detail ||
            err?.error?.message ||
            'Unable to delete organization. Please check the backend API.'
          );
        }

      });
  }
}