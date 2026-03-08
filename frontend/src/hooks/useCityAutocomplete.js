import { useState, useEffect, useRef, useCallback } from "react";
import serverAPI from "../api/serverAPI";

// Hardcoded fallback list for offline/error states
const CITY_FALLBACK = [
  "New York, NY",
  "Los Angeles, CA",
  "Chicago, IL",
  "Houston, TX",
  "Phoenix, AZ",
  "Philadelphia, PA",
  "San Antonio, TX",
  "San Diego, CA",
  "Dallas, TX",
  "San Jose, CA",
  "Austin, TX",
  "Jacksonville, FL",
  "Fort Worth, TX",
  "Columbus, OH",
  "Charlotte, NC",
  "San Francisco, CA",
  "Indianapolis, IN",
  "Seattle, WA",
  "Denver, CO",
  "Washington, DC",
  "Nashville, TN",
  "Oklahoma City, OK",
  "El Paso, TX",
  "Boston, MA",
  "Portland, OR",
  "Las Vegas, NV",
  "Memphis, TN",
  "Louisville, KY",
  "Baltimore, MD",
  "Milwaukee, WI",
  "Albuquerque, NM",
  "Tucson, AZ",
  "Fresno, CA",
  "Mesa, AZ",
  "Sacramento, CA",
  "Atlanta, GA",
  "Kansas City, MO",
  "Omaha, NE",
  "Colorado Springs, CO",
  "Raleigh, NC",
  "Miami, FL",
  "Minneapolis, MN",
  "Tampa, FL",
  "St. Petersburg, FL",
  "New Orleans, LA",
  "Cleveland, OH",
  "Orlando, FL",
  "Pittsburgh, PA",
  "Cincinnati, OH",
  "St. Louis, MO",
  "Detroit, MI",
  "Honolulu, HI",
  "Anchorage, AK",
  "Salt Lake City, UT",
  "Richmond, VA",
  "Boise, ID",
  "Des Moines, IA",
  "Birmingham, AL",
  "Buffalo, NY",
  "Rochester, NY",
  "Hartford, CT",
  "Providence, RI",
  "Charleston, SC",
  "Savannah, GA",
  "Knoxville, TN",
  "Chattanooga, TN",
  "Lexington, KY",
  "Madison, WI",
  "Grand Rapids, MI",
  "Spokane, WA",
];

/**
 * Custom hook for city autocomplete with progressive enhancement:
 * 1. Backend-proxied Nominatim search (avoids CORS, no API key)
 * 2. Hardcoded fallback list
 *
 * Also provides browser geolocation reverse geocoding via backend proxy.
 */
export default function useCityAutocomplete() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState("");
  const debounceRef = useRef(null);

  const searchCities = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Use our backend proxy to search cities via Nominatim
      const resp = await serverAPI.request(
        `/places/city-search?q=${encodeURIComponent(query)}&limit=10`
      );
      const cities = resp.cities || [];

      if (cities.length > 0) {
        setOptions(cities);
      } else {
        // Fallback to local filter
        const lower = query.toLowerCase();
        setOptions(
          CITY_FALLBACK.filter((c) => c.toLowerCase().includes(lower))
        );
      }
    } catch {
      // On any error, use fallback
      const lower = query.toLowerCase();
      setOptions(
        CITY_FALLBACK.filter((c) => c.toLowerCase().includes(lower))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = useCallback(
    (query) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (!query || query.length < 2) {
        setOptions([]);
        return;
      }
      debounceRef.current = setTimeout(() => {
        searchCities(query);
      }, 400);
    },
    [searchCities]
  );

  /**
   * Use browser geolocation to detect user's city.
   * Reverse geocodes via our backend proxy (Nominatim) — no CORS issues.
   * Returns the city name string, or throws on failure.
   */
  const detectCity = useCallback(async () => {
    setGeoLoading(true);
    setGeoError("");

    try {
      // Get coordinates
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation is not supported by your browser"));
          return;
        }
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode via our backend proxy
      const resp = await serverAPI.request(
        `/places/reverse-geocode?lat=${latitude}&lon=${longitude}`
      );

      if (!resp.city) {
        throw new Error("Could not determine your city from location");
      }

      setGeoLoading(false);
      return resp.city;
    } catch (err) {
      const msg =
        err.code === 1
          ? "Location access denied. Please allow location access and try again."
          : err.message || "Could not detect your location";
      setGeoError(msg);
      setGeoLoading(false);
      throw new Error(msg);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    options,
    loading,
    handleInputChange,
    detectCity,
    geoLoading,
    geoError,
    setGeoError,
  };
}
