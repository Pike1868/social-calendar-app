import React, { useState } from "react";
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Paper,
  IconButton,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import serverAPI from "../api/serverAPI";
import { useSelector, useDispatch } from "react-redux";
import { selectUserDetails, setUserDetails } from "../redux/userSlice";
import { format, parseISO } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";

export default function UserProfile() {
  const userDetails = useSelector(selectUserDetails);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userTimezone =
    userDetails.time_zone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Convert and format birthday for display
  const displayBirthday = userDetails.birthday
    ? format(
        utcToZonedTime(parseISO(userDetails.birthday), userTimezone),
        "yyyy-MM-dd"
      )
    : "";
  const [formData, setFormData] = useState({
    first_name: userDetails.first_name || "",
    last_name: userDetails.last_name || "",
    birthday: displayBirthday || "",
  });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedUser = await serverAPI.updateUser(userDetails.id, formData);
      dispatch(setUserDetails(updatedUser));
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("Error updating user data");
    }

    closeProfile();
  };
  const closeProfile = () => {
    console.log("closing profile page");
    navigate("/");
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 8 }}>
      <Paper elevation={24} sx={{ margin: "auto", maxWidth: "40%" }}>
        <IconButton
          onClick={closeProfile}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
        <Typography
          component="h3"
          variant="h2"
          align="center"
          color="text.primary"
          gutterBottom
        >
          User Profile
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        <Container maxWidth="sm">
          <TextField
            margin="normal"
            required
            fullWidth
            name="first_name"
            label="First Name"
            type="text"
            id="firstName"
            value={formData.first_name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="last_name"
            label="Last Name"
            type="text"
            id="firstName"
            value={formData.last_name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            name="birthday"
            label="Birthday"
            type="date"
            id="birthday"
            value={formData.birthday}
            onChange={handleChange}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Save Changes
          </Button>
        </Container>
      </Paper>
    </Box>
  );
}
