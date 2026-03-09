import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  Card,
  CardMedia,
  CardContent,
  Skeleton,
} from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarBorderIcon from "@mui/icons-material/StarBorder";

import RestaurantIcon from "@mui/icons-material/Restaurant";
import ParkIcon from "@mui/icons-material/Park";
import TheaterComedyIcon from "@mui/icons-material/TheaterComedy";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import PlaceIcon from "@mui/icons-material/Place";
import { useSelector } from "react-redux";
import { selectUserDetails } from "../redux/userSlice";
import { tokens } from "../theme";
import serverAPI from "../api/serverAPI";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "restaurants", label: "Restaurants" },
  { key: "entertainment", label: "Entertainment" },
  { key: "parks", label: "Parks" },
  { key: "bars", label: "Bars" },
];

const PRICE_LABELS = ["", "$", "$$", "$$$", "$$$$"];

/**
 * Return an appropriate MUI icon for a place category.
 */
function getCategoryIcon(category) {
  if (!category) return PlaceIcon;
  const lower = category.toLowerCase();
  if (lower.includes("restaurant") || lower.includes("food")) return RestaurantIcon;
  if (lower.includes("bar") || lower.includes("nightlife") || lower.includes("pub")) return LocalBarIcon;
  if (lower.includes("park") || lower.includes("garden") || lower.includes("outdoor")) return ParkIcon;
  if (
    lower.includes("cinema") ||
    lower.includes("theatre") ||
    lower.includes("theater") ||
    lower.includes("museum") ||
    lower.includes("entertainment")
  )
    return TheaterComedyIcon;
  return PlaceIcon;
}

const CATEGORY_COLORS = {
  RestaurantIcon: "#E65100",
  LocalBarIcon: "#6A1B9A",
  ParkIcon: "#2E7D32",
  TheaterComedyIcon: "#1565C0",
  PlaceIcon: "#546E7A",
};

function RatingStars({ rating }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
      {Array.from({ length: full }).map((_, i) => (
        <StarIcon key={`f${i}`} sx={{ fontSize: 14, color: tokens.colors.accent }} />
      ))}
      {half && <StarHalfIcon sx={{ fontSize: 14, color: tokens.colors.accent }} />}
      {Array.from({ length: empty }).map((_, i) => (
        <StarBorderIcon key={`e${i}`} sx={{ fontSize: 14, color: tokens.colors.accent }} />
      ))}
      <Typography
        variant="caption"
        sx={{ ml: 0.5, color: "text.secondary", fontSize: "0.7rem" }}
      >
        {rating.toFixed(1)}
      </Typography>
    </Box>
  );
}

function PlaceCard({ place }) {

  return (
    <Card
      component="a"
      href={place.url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        minWidth: 220,
        maxWidth: 240,
        flex: "0 0 auto",
        textDecoration: "none",
        color: "inherit",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: tokens.shadows.subtle,
        transition: "box-shadow 0.2s, transform 0.2s",
        overflow: "hidden",
        "&:hover": {
          boxShadow: tokens.shadows.medium,
          transform: "translateY(-2px)",
        },
      }}
    >
      {place.image_url ? (
        <CardMedia
          component="img"
          height="120"
          image={place.image_url}
          alt={place.name}
          sx={{ objectFit: "cover" }}
        />
      ) : (() => {
        const IconComponent = getCategoryIcon(place.category);
        const iconColor = CATEGORY_COLORS[IconComponent.displayName || IconComponent.name] || CATEGORY_COLORS.PlaceIcon;
        return (
          <Box
            sx={{
              height: 120,
              bgcolor: `${iconColor}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconComponent sx={{ fontSize: 40, color: iconColor }} />
          </Box>
        );
      })()}
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            mb: 0.5,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {place.name}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          <RatingStars rating={place.rating} />
          {place.price_level != null && place.price_level > 0 && (
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 500 }}
            >
              {PRICE_LABELS[place.price_level] || ""}
            </Typography>
          )}
        </Box>

        {place.category && (
          <Chip
            label={place.category}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.65rem",
              bgcolor: "action.hover",
              color: "text.secondary",
              fontWeight: 500,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Box sx={{ display: "flex", gap: 2, overflow: "hidden" }}>
      {[1, 2, 3, 4].map((i) => (
        <Card
          key={i}
          sx={{
            minWidth: 220,
            maxWidth: 240,
            flex: "0 0 auto",
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Skeleton variant="rectangular" height={120} />
          <CardContent sx={{ p: 2 }}>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rounded" width={60} height={20} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

/**
 * ThingsToDoWidget — shows nearby places as a horizontal scrolling card list.
 *
 * Props:
 *  - city: string (optional override; defaults to user's home_city from Redux)
 *  - compact: boolean (if true, hides the header)
 */
export default function ThingsToDoWidget({ city: cityProp, compact = false }) {
  const userDetails = useSelector(selectUserDetails);
  const city = cityProp || userDetails?.home_city || "";

  const [activeCategory, setActiveCategory] = useState("all");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    if (!city) return;
    setLoading(true);
    setError("");

    try {
      const result = await serverAPI.fetchThingsToDo(city);
      setData(result);
    } catch (err) {
      console.error("Error fetching things to do:", err);
      setError("Could not load nearby places. Try again later.");
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!city) return null;

  // Merge all categories or filter to active
  const getPlaces = () => {
    if (!data) return [];
    if (activeCategory === "all") {
      // Interleave from all categories
      const all = [
        ...(data.restaurants || []),
        ...(data.entertainment || []),
        ...(data.parks || []),
        ...(data.bars || []),
      ];
      // Deduplicate by id
      const seen = new Set();
      return all.filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
    }
    return data[activeCategory] || [];
  };

  const places = getPlaces();

  return (
    <Box sx={{ mb: 4 }}>
      {!compact && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            Things To Do
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Discover places near {city}
          </Typography>
        </Box>
      )}

      {/* Category filter chips */}
      <Box
        sx={{
          display: "flex",
          gap: 1,
          mb: 2,
          overflowX: "auto",
          pb: 0.5,
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.key}
            label={cat.label}
            size="small"
            clickable
            onClick={() => setActiveCategory(cat.key)}
            sx={{
              fontWeight: 500,
              fontSize: "0.75rem",
              bgcolor:
                activeCategory === cat.key
                  ? "primary.main"
                  : "action.hover",
              color:
                activeCategory === cat.key
                  ? "primary.contrastText"
                  : "text.secondary",
              "&:hover": {
                bgcolor:
                  activeCategory === cat.key
                    ? "primary.light"
                    : "action.selected",
              },
            }}
          />
        ))}
      </Box>

      {/* Content */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <Typography variant="body2" sx={{ color: "error.main", py: 2 }}>
          {error}
        </Typography>
      ) : places.length === 0 ? (
        <Typography variant="body2" sx={{ color: "text.secondary", py: 2 }}>
          No places found. Make sure your city is set in your profile.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            pb: 1,
            scrollSnapType: "x mandatory",
            "&::-webkit-scrollbar": {
              height: 4,
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "divider",
              borderRadius: 2,
            },
          }}
        >
          {places.map((place) => (
            <PlaceCard key={`${place.source}-${place.id}`} place={place} />
          ))}
        </Box>
      )}
    </Box>
  );
}
