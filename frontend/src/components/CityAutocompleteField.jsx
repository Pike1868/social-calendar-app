import React from "react";
import {
  Autocomplete,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import useCityAutocomplete from "../hooks/useCityAutocomplete";

/**
 * Reusable city autocomplete field with "Use My Location" button.
 *
 * Props:
 *  - value: string — current city value
 *  - onChange: (newValue: string) => void
 *  - label: string (default "Home City")
 *  - placeholder: string
 *  - size: "small" | "medium"
 *  - sx: additional sx props for the outer Box
 *  - showLocationButton: boolean (default true)
 */
export default function CityAutocompleteField({
  value,
  onChange,
  label = "Home City",
  placeholder = "Start typing your city...",
  size = "small",
  sx = {},
  showLocationButton = true,
}) {
  const {
    options,
    loading,
    handleInputChange,
    detectCity,
    geoLoading,
    geoError,
    setGeoError,
  } = useCityAutocomplete();

  const handleDetectCity = async () => {
    try {
      const city = await detectCity();
      onChange(city);
    } catch {
      // Error is set in the hook's geoError state
    }
  };

  return (
    <Box sx={sx}>
      <Autocomplete
        freeSolo
        options={options}
        value={value}
        loading={loading}
        onInputChange={(_, newValue) => {
          onChange(newValue);
          handleInputChange(newValue);
        }}
        filterOptions={(x) => x} // disable built-in filtering, we do it server-side
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            size={size}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <LocationOnOutlinedIcon
                  sx={{ mr: 1, color: "text.secondary", fontSize: 20 }}
                />
              ),
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />

      {showLocationButton && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="text"
            size="small"
            startIcon={
              geoLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <MyLocationIcon sx={{ fontSize: 18 }} />
              )
            }
            onClick={handleDetectCity}
            disabled={geoLoading}
            sx={{
              textTransform: "none",
              color: "text.secondary",
              fontSize: "0.8rem",
              "&:hover": { color: "primary.main" },
            }}
          >
            {geoLoading ? "Detecting..." : "Use My Location"}
          </Button>

          {geoError && (
            <Typography
              variant="caption"
              sx={{ display: "block", color: "error.main", mt: 1 }}
              onClick={() => setGeoError("")}
            >
              {geoError}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
