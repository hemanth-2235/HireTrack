import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUserByUid } from './src/db/users.ts';
import {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} from './src/db/applications.ts';
import {
  getInterviews,
  getInterviewsByApplication,
  createInterview,
  updateInterview,
  deleteInterview,
} from './src/db/interviews.ts';
import { getAnalytics } from './src/db/analytics.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth: Sync / Get Current User
  app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || `${uid}@hiretrack.app`;
      const name = (req.user as any)?.name || req.body?.name || email.split('@')[0];

      if (!uid) {
        return res.status(400).json({ error: 'Missing user id' });
      }

      const user = await getOrCreateUser(uid, email, name);
      // No manual seed data - clean real database for user
      res.json({ user });
    } catch (error: any) {
      console.error('Error syncing user:', error);
      res.status(500).json({ error: error.message || 'Failed to sync user' });
    }
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const user = await getUserByUid(uid);
      res.json({ user: user || { uid, email: req.user?.email, name: (req.user as any)?.name } });
    } catch (error: any) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Guest / Demo Login endpoint (clean empty session, no manual mock data)
  app.post('/api/auth/demo', async (req, res) => {
    try {
      const demoUid = 'guest_user';
      const demoEmail = 'guest@hiretrack.app';
      const demoName = 'Guest User';

      const user = await getOrCreateUser(demoUid, demoEmail, demoName);

      const demoToken = `demo_user_token_${demoUid}`;
      res.json({
        token: demoToken,
        user: {
          uid: demoUid,
          email: demoEmail,
          name: demoName,
        },
      });
    } catch (error: any) {
      console.error('Error in demo login:', error);
      res.status(500).json({ error: 'Failed to initiate guest session' });
    }
  });

  // Clear all data endpoint (ensures user can keep database 100% clean of unwanted data)
  app.post('/api/clear-all', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const userApps = await getApplications(uid);
      for (const appItem of userApps) {
        await deleteApplication(appItem.id, uid);
      }
      res.json({ success: true, message: 'All data cleared successfully' });
    } catch (error: any) {
      console.error('Clear data error:', error);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  });

  // Applications CRUD Endpoints
  app.get('/api/applications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const allApps = await getApplications(uid);

      // Filtering and search logic
      const search = (req.query.search as string)?.toLowerCase().trim();
      const status = req.query.status as string;
      const jobType = req.query.jobType as string;
      const company = (req.query.company as string)?.toLowerCase().trim();

      let filtered = allApps;

      if (search) {
        filtered = filtered.filter(
          (app) =>
            app.companyName.toLowerCase().includes(search) ||
            app.jobTitle.toLowerCase().includes(search) ||
            (app.location && app.location.toLowerCase().includes(search)) ||
            (app.notes && app.notes.toLowerCase().includes(search))
        );
      }

      if (status && status !== 'All') {
        filtered = filtered.filter((app) => app.status === status);
      }

      if (jobType && jobType !== 'All') {
        filtered = filtered.filter((app) => app.jobType === jobType);
      }

      if (company) {
        filtered = filtered.filter((app) => app.companyName.toLowerCase().includes(company));
      }

      res.json(filtered);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch applications' });
    }
  });

  app.get('/api/applications/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const id = parseInt(req.params.id, 10);
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid application ID' });

      const appItem = await getApplicationById(id, uid);
      if (!appItem) return res.status(404).json({ error: 'Application not found' });

      // Fetch related interviews
      const appInterviews = await getInterviewsByApplication(id, uid);

      res.json({ ...appItem, interviews: appInterviews });
    } catch (error: any) {
      console.error('Error getting application:', error);
      res.status(500).json({ error: error.message || 'Failed to get application' });
    }
  });

  app.post('/api/applications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const {
        companyName,
        jobTitle,
        location,
        jobType,
        applicationDate,
        jobUrl,
        salary,
        status,
        recruiterName,
        recruiterEmail,
        notes,
      } = req.body;

      if (!companyName || !jobTitle) {
        return res.status(400).json({ error: 'Company Name and Job Title are required.' });
      }

      const newApp = await createApplication({
        userId: uid,
        companyName,
        jobTitle,
        location,
        jobType,
        applicationDate: applicationDate || new Date().toISOString().split('T')[0],
        jobUrl,
        salary,
        status: status || 'Applied',
        recruiterName,
        recruiterEmail,
        notes,
      });

      res.status(201).json(newApp);
    } catch (error: any) {
      console.error('Error creating application:', error);
      res.status(500).json({ error: error.message || 'Failed to create application' });
    }
  });

  app.put('/api/applications/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const id = parseInt(req.params.id, 10);
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid application ID' });

      const updated = await updateApplication(id, uid, req.body);
      if (!updated) return res.status(404).json({ error: 'Application not found' });

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating application:', error);
      res.status(500).json({ error: error.message || 'Failed to update application' });
    }
  });

  app.delete('/api/applications/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const id = parseInt(req.params.id, 10);
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid application ID' });

      const success = await deleteApplication(id, uid);
      if (!success) return res.status(404).json({ error: 'Application not found' });

      res.json({ success: true, message: 'Application deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting application:', error);
      res.status(500).json({ error: error.message || 'Failed to delete application' });
    }
  });

  // Interviews CRUD Endpoints
  app.get('/api/interviews', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const appId = req.query.applicationId ? parseInt(req.query.applicationId as string, 10) : undefined;
      let interviewsList;

      if (appId && !isNaN(appId)) {
        interviewsList = await getInterviewsByApplication(appId, uid);
      } else {
        interviewsList = await getInterviews(uid);
      }

      res.json(interviewsList);
    } catch (error: any) {
      console.error('Error fetching interviews:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch interviews' });
    }
  });

  app.post('/api/interviews', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const {
        applicationId,
        companyName,
        jobRole,
        interviewDate,
        interviewTime,
        interviewType,
        round,
        interviewer,
        meetingLink,
        notes,
        status,
      } = req.body;

      if (!applicationId || !companyName || !jobRole || !interviewDate || !interviewTime) {
        return res.status(400).json({
          error: 'Application ID, Company Name, Job Role, Date, and Time are required.',
        });
      }

      const newInterview = await createInterview({
        applicationId: parseInt(applicationId, 10),
        userId: uid,
        companyName,
        jobRole,
        interviewDate,
        interviewTime,
        interviewType,
        round,
        interviewer,
        meetingLink,
        notes,
        status: status || 'Scheduled',
      });

      // Optionally auto-update application status to 'Interview' if it's currently 'Applied' or 'Shortlisted'
      const parentApp = await getApplicationById(parseInt(applicationId, 10), uid);
      if (parentApp && (parentApp.status === 'Applied' || parentApp.status === 'Shortlisted')) {
        await updateApplication(parentApp.id, uid, { status: 'Interview' });
      }

      res.status(201).json(newInterview);
    } catch (error: any) {
      console.error('Error creating interview:', error);
      res.status(500).json({ error: error.message || 'Failed to create interview' });
    }
  });

  app.put('/api/interviews/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const id = parseInt(req.params.id, 10);
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid interview ID' });

      const updated = await updateInterview(id, uid, req.body);
      if (!updated) return res.status(404).json({ error: 'Interview not found' });

      res.json(updated);
    } catch (error: any) {
      console.error('Error updating interview:', error);
      res.status(500).json({ error: error.message || 'Failed to update interview' });
    }
  });

  app.delete('/api/interviews/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const id = parseInt(req.params.id, 10);
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid interview ID' });

      const success = await deleteInterview(id, uid);
      if (!success) return res.status(404).json({ error: 'Interview not found' });

      res.json({ success: true, message: 'Interview deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting interview:', error);
      res.status(500).json({ error: error.message || 'Failed to delete interview' });
    }
  });

  // Analytics Endpoints
  app.get('/api/analytics/overview', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const analytics = await getAnalytics(uid);
      res.json(analytics);
    } catch (error: any) {
      console.error('Error fetching analytics overview:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
    }
  });

  app.get('/api/analytics/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const analytics = await getAnalytics(uid);
      res.json(analytics.statusDistribution);
    } catch (error: any) {
      console.error('Error fetching analytics status:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch status analytics' });
    }
  });

  app.get('/api/analytics/monthly', requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) return res.status(401).json({ error: 'Unauthorized' });

      const analytics = await getAnalytics(uid);
      res.json(analytics.monthlyDistribution);
    } catch (error: any) {
      console.error('Error fetching monthly analytics:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch monthly analytics' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HireTrack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
