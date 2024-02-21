import axios from "axios";

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:3001";

/** API Class.
 *
 * Static class tying together methods used to get/send to to the API.
 *
 */

class ServerApi {
  // the token for interactive with the API will be stored here.
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
      console.error("API Error:", err.response);
      let message = err.response.data.error.message;
      throw Array.isArray(message) ? message : [message];
    }
  }

  // Individual API routes

  /** POST "/auth/register" - { user } => { token }
   * user must include { email , password, firstName, lastName}
   * Returns token
   */

  static async register({ email, password, firstName, lastName }) {
    const endpoint = "auth/register";
    const method = "post";
    const data = { email, password, firstName, lastName };

    try {
      const response = await this.request(endpoint, data, method);
      ServerApi.token = response.token;
      localStorage.setItem("socialCalToken", response.token);
      return response.token;
    } catch (err) {
      console.log(err);
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
      console.log("Event creation success:", response);
      return response.event;
    } catch (err) {
      console.error("Error creating event:", err);
      throw err;
    }
  }

  static async fetchEventsByCalendar(calendar_id) {
    const endpoint = `event/findAll/${calendar_id}`;
    try {
      const response = await this.request(endpoint);
      console.log("Find all events success:", response);
      return response.events;
    } catch (err) {
      console.error(err);
    }
  }
}

export default ServerApi;
