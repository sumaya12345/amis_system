import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// Mock axios to prevent real HTTP calls during the test
jest.mock('axios');

/**
 * Helper to set a fake admin session in sessionStorage before rendering the app.
 */
function setAdminSession() {
  // Minimal session data required by the app logic
  sessionStorage.setItem('sessionId', 'test-session-id');
  sessionStorage.setItem('currentUser', 'admin');
  sessionStorage.setItem('user', JSON.stringify({ role: 'admin' }));
}

test('renders admin panel when admin is logged in', async () => {
  // Mock the verify‑session endpoint to resolve with an admin user
  (axios.post as jest.Mock).mockImplementation(url => {
    if (url.includes('/verify-session')) {
      return Promise.resolve({ data: { success: true, user: { role: 'admin' } } });
    }
    // For any other POST (e.g., logout) just resolve
    return Promise.resolve({});
  });

  setAdminSession();

  render(<App />);

  // The AdminSidebar renders the text "ADMIN PANEL"
  const adminHeader = await screen.findByText(/admin panel/i);
  expect(adminHeader).toBeInTheDocument();
});
