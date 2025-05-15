export default {
  init: async () => true,
  login: () => {},
  isLoggedIn: () => true,
  getAccessToken: () => 'MOCK_ACCESS_TOKEN',
  getIDToken: () => 'MOCK_ID_TOKEN',
  getProfile: async () => ({
    userId: 'test_user_001',
    displayName: 'Demo User',
    pictureUrl:
      'https://cdn.jsdelivr.net/gh/charlene-yeh/assets/demo-user.png',
  }),
  isInClient: () => false,
}; 