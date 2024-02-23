import axios from "axios";
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:3001";

/** API Class.
 *
 * Static class tying together methods used to get/send to to the API.
 *
 */

class ServerApi {
  // token for API stored here.
  static token;
  static async request(endpoint, data = {}, method = "get") {
    console.debug("API Call:", endpoint, data, method);

    // If no token is set, check localStorage and set token
    if (!ServerApi.token) {
      const token = localStorage.getItem("socialCalToken");
      if (token) {
        ServerApi.token = token;
      }
    }

    //passing authorization token in the header.
    const url = `${BASE_URL}/${endpoint}`;
    const headers = { Authorization: `Bearer ${ServerApi.token}` };
    const params = method === "get" ? data : {};
    try {
      return (await axios({ url, method, data, params, headers })).data;
    } catch (err) {
      console.error("API Error:", err.response || err);
      let message = err.response.data.error.message;
      throw Array.isArray(message) ? message : [message];
    }
  }

  //*************Authentication Routes */

  /** POST "/auth/register" - { user } => { token }
   * user must include { email , password, first_name, last_name, time_zone = ""}
   * Returns token
   */

  static async register({ email, password, first_name, last_name, time_zone }) {
    const endpoint = "auth/register";
    const method = "post";
    const data = { email, password, first_name, last_name, time_zone };

    try {
      const response = await this.request(endpoint, data, method);
      ServerApi.token = response.token;
      localStorage.setItem("socialCalToken", response.token);
      return response.token;
    } catch (err) {
      throw err;
    }
  }

  /** POST "/auth/token" - { email, password } => { token }
   * Authenticates email and password
   * Returns token
   **/
  static async login(email, password) {
    const endpoint = "auth/token";
    const method = "post";
    const data = { email, password };
    try {
      const response = await this.request(endpoint, data, method);
      //Save token to api class
      ServerApi.token = response.token;
      localStorage.setItem("socialCalToken", response.token);
      return response.token;
    } catch (err) {
      throw err;
    }
  }

  //*************User Routes */

  /** GET /user/:id => {user}
   *
   * Fetches user details by id.
   *
   * Requires token
   *
   */

  static async fetchUserDetails(userId) {
    const endpoint = `user/${userId}`;
    try {
      const response = await this.request(endpoint, {});
      return response;
    } catch (err) {
      console.error("fetchUserDetails Error", err);
    }
  }

  /** GET /user/:id/calendars => [{calendar1}]
   * Fetches users calendars
   *
   * Requires token
   */

  static async fetchUserCalendars(userId) {
    const endpoint = `user/${userId}/calendars`;
    try {
      const response = await this.request(endpoint, {});
      return response;
    } catch (err) {
      console.error("fetchUserCalendars Error", err);
      throw err;
    }
  }

  //*************Event Routes */

  /** POST /event/create => {new event}
   *
   * need: {calendar_id, title, start_time, end_time}
   * optional: {location, description, status, color_id, time_zone, google_id}
   *
   * Requires token
   */

  static async createEvent(data) {
    const endpoint = "event/create";
    const method = "post";
    try {
      const response = await this.request(endpoint, data, method);
      return response.event;
    } catch (err) {
      console.error("Error creating event:", err);
      throw err;
    }
  }

  /** GET /event/findAll/:calendar_id => [{evt1}, {evt2}, {evt3}]
   * Fetches events from a calendar
   * Requires token
   */
  static async fetchEventsByCalendar(calendar_id) {
    const endpoint = `event/findAll/${calendar_id}`;
    try {
      const response = await this.request(endpoint);
      return response.events;
    } catch (err) {
      console.error("Error fetching events", err);
    }
  }

  /** PATCH /event/update/:id => {updatedEvt}
   * Updates an existing event
   * Requires token
   */

  static async updateEvent(id, eventData) {
    const endpoint = `event/update/${id}`;
    const method = "patch";
    try {
      const response = await this.request(endpoint, eventData, method);
      return response.event;
    } catch (err) {
      console.error("Error updating event", err);
    }
  }

  /** DELETE /event/:id => {message}
   * Removes/deletes an event
   * Requires token
   */

  static async removeEvent(id) {
    const endpoint = `event/${id}`;
    const method = "delete";
    try {
      const response = await this.request(endpoint, {}, method);
      return response.event;
    } catch (err) {
      console.error("Error deleting event", err);
    }
  }

  //*************Google Event Routes */

  /** GET https://www.googleapis.com/calendar/v3/calendars/primary/events => [{evt1}, {evt2}, {evt3}]
   * Fetches events from users "primary" google calendar
   *
   */
  // ServerApi.js
  static async fetchGoogleEvents(accessToken) {
    const endpoint = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
    try {
      const response = await axios.get(endpoint, { headers });
      return response.data.items;
    } catch (err) {
      console.error("Error fetching Google events", err);
      throw err;
    }
  }
}

export default ServerApi;
