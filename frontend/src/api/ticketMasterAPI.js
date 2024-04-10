import axios from "axios";

class TicketmasterAPI {
  static apiKey = process.env.REACT_APP_TICKETMASTER_API_KEY;

  static async request(endpoint, params = {}) {
    console.debug("Ticketmaster API Call:", endpoint, params);

    const url = `https://app.ticketmaster.com/discovery/v2/${endpoint}`;
    try {
      const response = await axios.get(url, {
        params: { ...params, apikey: this.apiKey },
      });
      return response.data;
    } catch (err) {
      console.error(`Error with Ticketmaster API request to ${endpoint}:`, err);
      throw err;
    }
  }

  // Method to get events in the United States
  static async fetchEventsInUS() {
    const endpoint = "events.json";
    const params = { countryCode: "US" };
    try {
      let result = await this.request(endpoint, params);
      console.log(result);
      return result;
    } catch (err) {
      console.error("Error fetching events in the US", err);
      throw err;
    }
  }

  // Method to search for events by keyword or location
  static async searchEvents(params = {}) {
    const endpoint = "events.json";
    const queryParams = { ...params, sort: "date,asc" };
    try {
      return await this.request(endpoint, queryParams);
    } catch (err) {
      console.error("Error searching for events", err);
      throw err;
    }
  }
}

export default TicketmasterAPI;
