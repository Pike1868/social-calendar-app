import axios from "axios";

const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:3001";

/** API Class.
 *
 * Static class tying together methods used to get/send to to the API.
 * There shouldn't be any frontend-specific stuff here, and there shouldn't
 * be any API-aware stuff elsewhere in the frontend.
 *
 */

class ServerApi {
  // the token for interactive with the API will be stored here.
  static token;

  static async request(endpoint, data = {}, method = "get") {
    console.debug("API Call:", endpoint, data, method);
    

    //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
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
   * Returns JWT token
   */

  static async register({ email, password, firstName, lastName }) {
    const endpoint = "auth/register";
    const method = "post";
    const data = { email, password, firstName, lastName };

    try {
      const response = await this.request(endpoint, data, method);
      console.log(response);
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
   * Returns JWT token
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
      console.log(response.token);
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
    const method = "get";
    try {
      const response = await this.request(endpoint, {}, method);
      console.log(response.body);
      return response;
    } catch (err) {
      console.error("fetchUserDetails Error", err);
    }
  }
}

export default ServerApi;
