/**
 * API Service Client
 * AI-Powered Construction Site Vehicle & License Plate Monitoring System
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Attach prototype token if stored
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('site_anpr_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Authentication
  auth: {
    login: async (username, password) => {
      const res = await client.post('/api/auth/login', { username, password });
      if (res.data.token) {
        localStorage.setItem('site_anpr_token', res.data.token);
        localStorage.setItem('site_anpr_user', JSON.stringify(res.data.user));
      }
      return res.data;
    },
    logout: () => {
      localStorage.removeItem('site_anpr_token');
      localStorage.removeItem('site_anpr_user');
    },
    getUser: () => {
      const u = localStorage.getItem('site_anpr_user');
      return u ? JSON.parse(u) : { username: 'admin', role: 'admin', name: 'Site Security Administrator' };
    }
  },

  // Video Streaming & Processing
  video: {
    upload: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await client.post('/api/video/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    listSamples: async () => {
      const res = await client.get('/api/video/samples');
      return res.data;
    },
    control: async (action, videoSource = 'sample', cameraId = 'Gate-01') => {
      const res = await client.post('/api/video/control', {
        action,
        video_source: videoSource,
        camera_id: cameraId,
      });
      return res.data;
    },
    getStatus: async () => {
      const res = await client.get('/api/video/status');
      return res.data;
    },
    getStreamUrl: (sessionId = 'live-01', cameraId = 'Gate-01') => {
      return `${API_BASE_URL}/api/video/stream/${sessionId}?camera_id=${cameraId}`;
    }
  },

  // Vehicles Database
  vehicles: {
    list: async (params = {}) => {
      const res = await client.get('/api/vehicles', { params });
      return res.data;
    },
    get: async (id) => {
      const res = await client.get(`/api/vehicles/${id}`);
      return res.data;
    },
    create: async (data) => {
      const res = await client.post('/api/vehicles', data);
      return res.data;
    },
    update: async (id, data) => {
      const res = await client.put(`/api/vehicles/${id}`, data);
      return res.data;
    },
    delete: async (id) => {
      const res = await client.delete(`/api/vehicles/${id}`);
      return res.data;
    }
  },

  // Detections & OCR Fusion
  detections: {
    list: async (params = {}) => {
      const res = await client.get('/api/detections', { params });
      return res.data;
    },
    getLive: async () => {
      const res = await client.get('/api/detections/live');
      return res.data;
    },
    getFusionBreakdown: async (trackingId) => {
      const res = await client.get(`/api/detections/fusion/${trackingId}`);
      return res.data;
    }
  },

  // Vehicle History & Visit Logs
  history: {
    list: async (params = {}) => {
      const res = await client.get('/api/history', { params });
      return res.data;
    },
    getDetail: async (id) => {
      const res = await client.get(`/api/history/${id}`);
      return res.data;
    }
  },

  // Alerts
  alerts: {
    list: async (params = {}) => {
      const res = await client.get('/api/alerts', { params });
      return res.data;
    },
    updateStatus: async (id, status, reviewedBy = 'admin') => {
      const res = await client.put(`/api/alerts/${id}`, { status, reviewed_by: reviewedBy });
      return res.data;
    },
    quickAuthorize: async (id, data) => {
      const res = await client.post(`/api/alerts/${id}/authorize`, data);
      return res.data;
    }
  },

  // Analytics
  analytics: {
    get: async () => {
      const res = await client.get('/api/analytics');
      return res.data;
    }
  },

  // Global Search
  search: {
    query: async (query) => {
      const res = await client.get('/api/search', { params: { query } });
      return res.data;
    }
  },

  // System & Settings
  system: {
    getHealth: async () => {
      const res = await client.get('/api/system/health');
      return res.data;
    },
    getSettings: async () => {
      const res = await client.get('/api/system/settings');
      return res.data;
    },
    updateSettings: async (data) => {
      const res = await client.put('/api/system/settings', data);
      return res.data;
    },
    resetDemo: async () => {
      const res = await client.post('/api/system/reset-demo');
      return res.data;
    }
  }
};
