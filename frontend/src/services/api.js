import { authService } from './firebase';

const FUNCTIONS_URL = 'https://us-central1-bestiesapp.cloudfunctions.net';

class APIService {
  // Helper to make authenticated requests
  async request(endpoint, method = 'GET', body = null) {
    try {
      const token = await authService.getToken();
      
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const options = {
        method,
        headers,
      };

      if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${FUNCTIONS_URL}/${endpoint}`, options);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return { success: true, data };
    } catch (error) {
      console.error('API request error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check-in functions
  async completeCheckIn(checkinId, saveAsTemplate = false, templateName = null) {
    return this.request('completeCheckIn', 'POST', {
      checkinId,
      saveAsTemplate,
      templateName
    });
  }

  async extendCheckIn(checkinId, additionalMinutes) {
    return this.request('extendCheckIn', 'POST', {
      checkinId,
      additionalMinutes
    });
  }

  // Bestie functions
  async sendBestieRequest(recipientPhone, recipientName, personalMessage = null) {
    return this.request('sendBestieRequest', 'POST', {
      recipientPhone,
      recipientName,
      personalMessage
    });
  }

  async acceptBestieRequest(bestieId) {
    return this.request('acceptBestieRequest', 'POST', {
      bestieId
    });
  }

  // Payment functions
  async createCheckoutSession(amount, type) {
    return this.request('createCheckoutSession', 'POST', {
      amount,
      type
    });
  }
}

export default new APIService();
