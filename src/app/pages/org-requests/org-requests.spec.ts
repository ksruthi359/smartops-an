import { Component } from '@angular/core';

@Component({
  selector: 'app-org-requests',
  standalone: true,
  templateUrl: './org-requests.html',
  styleUrl: './org-requests.css'
})
export class OrgRequests {

  activeTab: 'all' | 'pending' | 'approved' | 'rejected' = 'all';

  organizationRequests = [
    {
      id: 1,
      organizationName: 'Gamma Solutions',
      requesterName: 'Alice Johnson',
      email: 'alice@gamma.io',
      phone: '+1 555-100-2000',
      industry: 'Technology',
      employees: '51-200',
      useCase: 'Internal IT Support',
      message: 'We need a modern ticketing system for our growing engineering team.',
      submittedDate: 'Feb 24, 2026 3:30 PM',
      status: 'Pending'
    },
    {
      id: 2,
      organizationName: 'Delta Healthcare',
      requesterName: 'Bob Williams',
      email: 'bob@deltahc.com',
      phone: '+1 555-200-3000',
      industry: 'Healthcare',
      employees: '201-500',
      useCase: 'Customer Support',
      message: 'We need a centralized support system for our healthcare teams.',
      submittedDate: 'Feb 23, 2026 2:15 PM',
      status: 'Pending'
    }
  ];

  getCount(status: string): number {
    return this.organizationRequests.filter(
      request => request.status === status
    ).length;
  }

  get filteredRequests() {
    if (this.activeTab === 'all') {
      return this.organizationRequests;
    }

    const status =
      this.activeTab.charAt(0).toUpperCase() +
      this.activeTab.slice(1);

    return this.organizationRequests.filter(
      request => request.status === status
    );
  }

  setTab(tab: 'all' | 'pending' | 'approved' | 'rejected') {
    this.activeTab = tab;
  }

  approve(request: any) {
    request.status = 'Approved';
  }

  reject(request: any) {
    request.status = 'Rejected';
  }
}