import axios from "axios";
const BASE_URL = process.env.REACT_APP_SERVER_URL;

/** API Class.
 *
 * Static class tying together methods used to get/send to the server endpoints.
 *
 **Error handling centralized to request method
 */

// Keys for localStorage
const ACCESS_TOKEN_KEY = "socialCalToken";
const REFRESH_TOKEN_KEY = "socialCalRefreshToken";

// Create axios instance for API calls
const apiClient = axios.create({ baseURL: `${BASE_URL}/` });

// Track in-flight refresh to avoid duplicate refresh calls
let refreshPromise = null;

/** Attempt to refresh the access token using stored refresh token. */
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
  const { accessToken } = response.data;

  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  return accessToken;
}

// Request interceptor: attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only retry once, and don't retry the refresh endpoint itself
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        // Deduplicate concurrent refresh calls
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const newToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        // Refresh failed — clear tokens and force re-login
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        window.dispatchEvent(new Event("auth:logout"));
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

class serverAPI {
  // Keep static token for backward compat with googleCalendarAPI flow
  static token;

  static async request(endpoint, data = {}, method = "get") {
    console.debug("API Call:", endpoint, data, method);

    const params = method === "get" ? data : {};
    try {
      return (await apiClient({ url: endpoint, method, data, params })).data;
    } catch (err) {
      console.error("API Error:", err.response || err);
      let message = err.response?.data?.error?.message || "An error occurred";
      throw Array.isArray(message) ? message : [message];
    }
  }

  //*************Authentication Routes */

  /** POST "/auth/register" - { user } => { accessToken, refreshToken } */
  static async register({ email, password, first_name, last_name, time_zone }) {
    const endpoint = "auth/register";
    const method = "post";
    const data = { email, password, first_name, last_name, time_zone };

    const response = await this.request(endpoint, data, method);
    serverAPI.token = response.accessToken;
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    return response.accessToken;
  }

  /** POST "/auth/token" - { email, password } => { accessToken, refreshToken } */
  static async login(email, password) {
    const endpoint = "auth/token";
    const method = "post";
    const data = { email, password };

    const response = await this.request(endpoint, data, method);
    serverAPI.token = response.accessToken;
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    return response.accessToken;
  }

  //*************User Routes */

  /** GET /user/:id => {user} */
  static async fetchUserDetails(userId) {
    const endpoint = `user/${userId}`;
    const response = await this.request(endpoint, {});
    return response;
  }

  /** GET /user/:id/calendars => [{calendar1}] */
  static async fetchUserCalendars(userId) {
    const endpoint = `user/${userId}/calendars`;
    const response = await this.request(endpoint, {});
    return response;
  }

  /** PATCH /user/:id => {user} */
  static async updateUser(userId, updateData) {
    const endpoint = `user/${userId}`;
    const method = "patch";
    const response = await this.request(endpoint, updateData, method);
    return response.user;
  }

  //*************Event Routes */

  /** POST /event/create => {new event} */
  static async createEvent(data) {
    const endpoint = "event/create";
    const method = "post";
    const response = await this.request(endpoint, data, method);
    return response.event;
  }

  /** GET /event/findAll/:calendar_id => [{evt1}, {evt2}, {evt3}] */
  static async fetchEventsByCalendar(calendar_id) {
    const endpoint = `event/findAll/${calendar_id}`;
    const response = await this.request(endpoint);
    return response.events;
  }

  /** PATCH /event/update/:id => {updatedEvt} */
  static async updateEvent(id, eventData) {
    const endpoint = `event/update/${id}`;
    const method = "patch";
    const response = await this.request(endpoint, eventData, method);
    return response.event;
  }

  /** DELETE /event/:id => {message} */
  static async removeEvent(id) {
    const endpoint = `event/${id}`;
    const method = "delete";
    const response = await this.request(endpoint, {}, method);
    return response.event;
  }

  /** GET /event/by-google-id/:googleId => { event } */
  static async fetchLocalEventIdByGoogleId(google_id) {
    const endpoint = `event/by-google-id/${google_id}`;
    const response = await this.request(endpoint);
    return response;
  }

  /** POST /auth/refresh-google => { access_token }
   * Refreshes the Google OAuth access token using stored refresh_token.
   */
  static async refreshGoogleToken() {
    const endpoint = "auth/refresh-google";
    const method = "post";
    const response = await this.request(endpoint, {}, method);
    return response.access_token;
  }

  //*************Friend Routes */

  /** POST /friends/invite-batch => { results } */
  static async inviteFriendsBatch(emails) {
    const response = await this.request("friends/invite-batch", { emails }, "post");
    return response.results;
  }

  /** POST /friends/request => { friendship } */
  static async sendFriendRequest(email) {
    const response = await this.request("friends/request", { email }, "post");
    return response.friendship;
  }

  /** GET /friends => { friends: [...] } */
  static async fetchFriends() {
    const response = await this.request("friends");
    return response.friends;
  }

  /** GET /friends/requests => { requests: [...] } */
  static async fetchFriendRequests() {
    const response = await this.request("friends/requests");
    return response.requests;
  }

  /** PATCH /friends/:id/accept => { friendship } */
  static async acceptFriendRequest(friendshipId) {
    const response = await this.request(`friends/${friendshipId}/accept`, {}, "patch");
    return response.friendship;
  }

  /** PATCH /friends/:id/decline => { message } */
  static async declineFriendRequest(friendshipId) {
    const response = await this.request(`friends/${friendshipId}/decline`, {}, "patch");
    return response;
  }

  /** DELETE /friends/:id => { message } */
  static async removeFriend(friendshipId) {
    const response = await this.request(`friends/${friendshipId}`, {}, "delete");
    return response;
  }

  //*************Circle Routes */

  /** POST /circles => { circle } */
  static async createCircle(name) {
    const response = await this.request("circles", { name }, "post");
    return response.circle;
  }

  /** GET /circles => { circles: [...] } */
  static async fetchCircles() {
    const response = await this.request("circles");
    return response.circles;
  }

  /** POST /circles/:id/members => { member } */
  static async addCircleMember(circleId, userId) {
    const response = await this.request(`circles/${circleId}/members`, { user_id: userId }, "post");
    return response.member;
  }

  /** DELETE /circles/:id/members/:userId => { message } */
  static async removeCircleMember(circleId, userId) {
    const response = await this.request(`circles/${circleId}/members/${userId}`, {}, "delete");
    return response;
  }

  /** DELETE /circles/:id => { message } */
  static async deleteCircle(circleId) {
    const response = await this.request(`circles/${circleId}`, {}, "delete");
    return response;
  }

  //*************Privacy Routes */

  /** GET /privacy/preferences => { sharing_enabled, preferences: [...] } */
  static async fetchPrivacyPreferences() {
    const response = await this.request("privacy/preferences");
    return response;
  }

  /** PUT /privacy/preferences/:friendId => { preference } */
  static async setFriendSharingPreference(friendId, shareAvailability) {
    const response = await this.request(
      `privacy/preferences/${friendId}`,
      { share_availability: shareAvailability },
      "put"
    );
    return response.preference;
  }

  //*************FreeBusy Routes */

  /** POST /freebusy => { availability: { [friendId]: { busy, displayName } } } */
  static async fetchFreeBusy({ friendIds, timeMin, timeMax }) {
    const response = await this.request(
      "freebusy",
      { friendIds, timeMin, timeMax },
      "post"
    );
    return response.availability;
  }
}

export default serverAPI;
