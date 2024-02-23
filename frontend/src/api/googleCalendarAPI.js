import axios from "axios";

/** Google Calendar API Class.
 *
 * Focused mostly on the event endpoints
 *
 */

class googleCalendarAPI {
  // token for API stored here
  static accessToken;

  // method for setting token
  static setAccessToken(token) {
    googleCalendarAPI.accessToken = token;
  }

  // Request builder function
  static async request(endpoint, method = "get", data = {}) {
    console.debug("Google API Call:", endpoint, data, method, this.accessToken);

    const url = `https://www.googleapis.com/calendar/v3/calendars/${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
    try {
      const response = await axios({ url, method, data, headers });
      return response.data;
    } catch (err) {
      console.error(
        `Error with Google Calendar API request to ${method}-${endpoint}:`,
        err
      );
      throw err;
    }
  }

  /** GET "https://www.googleapis.com/calendar/v3/calendars/calendarId/events"
   *
   * Requests list of events from by calendar id
   * (A google users default calendar is the primary calendar in google calendar, so the id for the route here will always be "primary")
   *
   *
   * Params: accessToken, was fetched from backend and stored in state store
   * Returns:  array of event objects => [{evt1}, {evt2}, {evt3}, {evt4}]
   */
  static async fetchGoogleEvents(token = this.token) {
    const endpoint = `primary/events`;

    //sets user's access token when events are requested
    this.setAccessToken(token);
    try {
      const response = await this.request(endpoint);
      return response;
    } catch (err) {
      console.error("Error fetching Google events", err);
      throw err;
    }
  }

  /** POST "https://www.googleapis.com/calendar/v3/calendars/calendarId/events"
   *
   * Creates an event in users primary google calendar
   *
   */
  static async createGoogleEvent(data) {
    const endpoint = `primary/events`;
    const method = "post";
    try {
      return await this.request(endpoint, method, data);
    } catch (err) {
      console.error("Error creating google event", err);
      throw err;
    }
  }
}

export default googleCalendarAPI;
