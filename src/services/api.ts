import { JobApplication, Interview, AnalyticsOverview, ApplicationStatus } from '../types.ts';

export class ApiService {
  private static token: string | null = null;

  public static setToken(token: string | null) {
    this.token = token;
  }

  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Auth sync
  public static async syncUser(name?: string) {
    const res = await fetch('/api/auth/sync', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to sync user');
    return res.json();
  }

  // Demo Login
  public static async demoLogin() {
    const res = await fetch('/api/auth/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed demo login');
    return res.json();
  }

  // Applications
  public static async getApplications(params?: {
    search?: string;
    status?: string;
    jobType?: string;
    company?: string;
  }): Promise<JobApplication[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.jobType) query.append('jobType', params.jobType);
    if (params?.company) query.append('company', params.company);

    const res = await fetch(`/api/applications?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch applications');
    return res.json();
  }

  public static async getApplicationById(id: number): Promise<JobApplication & { interviews?: Interview[] }> {
    const res = await fetch(`/api/applications/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch application details');
    return res.json();
  }

  public static async createApplication(data: Partial<JobApplication>): Promise<JobApplication> {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create application');
    }
    return res.json();
  }

  public static async updateApplication(id: number, data: Partial<JobApplication>): Promise<JobApplication> {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update application');
    }
    return res.json();
  }

  public static async updateApplicationStatus(id: number, status: ApplicationStatus): Promise<JobApplication> {
    return this.updateApplication(id, { status });
  }

  public static async deleteApplication(id: number): Promise<boolean> {
    const res = await fetch(`/api/applications/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete application');
    return true;
  }

  // Interviews
  public static async getInterviews(applicationId?: number): Promise<Interview[]> {
    const url = applicationId ? `/api/interviews?applicationId=${applicationId}` : '/api/interviews';
    const res = await fetch(url, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch interviews');
    return res.json();
  }

  public static async createInterview(data: Partial<Interview>): Promise<Interview> {
    const res = await fetch('/api/interviews', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create interview');
    }
    return res.json();
  }

  public static async updateInterview(id: number, data: Partial<Interview>): Promise<Interview> {
    const res = await fetch(`/api/interviews/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update interview');
    }
    return res.json();
  }

  public static async deleteInterview(id: number): Promise<boolean> {
    const res = await fetch(`/api/interviews/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete interview');
    return true;
  }

  // Analytics
  public static async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const res = await fetch('/api/analytics/overview', {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch analytics overview');
    return res.json();
  }

  // Clear all data (keep database clean for real user entries)
  public static async clearAllData(): Promise<void> {
    const res = await fetch('/api/clear-all', {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to clear database records');
  }
}
