# Starting the Application

## Initial Setup

### Environment Variables

Before running the application, you need to set up environment variables for both the backend and frontend.

#### Backend `.env` Configuration

Navigate to the `/backend` directory and create a `.env` file with the following variables:

```plaintext
SECRET_KEY='your_secret_key'  # A 32-bit secret key needed for backend encryption
PORT=3001
DB_URI_DEV="postgresql:///social_cal_dev"
DB_URI_TEST="postgresql:///social_cal_test"
DB_URI_PROD="postgresql:///social_cal_prod"
NODE_ENV="dev"  # Change the NODE_ENV to change databases
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
ALGORITHM="aes-256-ctr"  # Algorithm used to encrypt Google token
REACT_APP_BASE_URL="http://localhost:3000"  # Frontend URL
SERVER_BASE_URL="http://localhost:3001"  # Backend URL
```

- **!Security Note!**: Make sure include your .env file in your .gitignore file. Also replace placeholder values (e.g., `your_secret_key`, `your_google_client_id`, `your_google_client_secret`) with actual credentials when setting environmental variables.


#### Frontend `.env` Configuration

Navigate to the `/frontend` directory and create a `.env` file with:

```plaintext
REACT_APP_SERVER_URL="http://localhost:3001"  # URL to the backend server
```

### Database Setup

Ensure PostgreSQL is installed and running on your system. Then, use the provided `db-schema.sql` file to set up your database schema. You can do this by navigating to the backend folder then opening a terminal and running the following command:

```bash
psql -d your_database_name -a -f db-schema.sql
```

##### Database Setup Command Explained:
```plaintext
psql: This is the PostgreSQL command line interface, allowing you to interact with your PostgreSQL database.
-d your_database_name: Specifies the database to which you want to connect.
-a: Aborts the transaction on errors. This ensures that if any part of your SQL script fails, the command stops running further commands.
-f db-schema.sql: Executes SQL commands from the file specified; in this case, it's db-schema.sql. This file contains your database schema and any initial data setup.
```

Replace `your_database_name` with the actual name of your database (e.g., `social_cal_dev`).

## Running the Application

### Backend

1. Navigate to the `/backend` directory.
2. Install the necessary packages with `npm install`.
3. Start the server using `npm run server.js` or `nodemon server.js`.

### Frontend

1. Navigate to the `/frontend` directory.
2. Install the necessary packages with `npm install`.
3. Start the application with `npm start`.

Access the application in your browser at `http://localhost:3000`.

# Project Overview: Social Calendar App

## Purpose and Motivation
The Social Calendar App was inspired by the challenge of staying connected with friends and family after significant life changes, such as graduating from college or relocating. The primary goal is to simplify the scheduling process among a user's social circle, making it easier to plan get-togethers, stay connected, and manage social engagements through a unified platform.

## Tech Stack
- **Frontend**: React for building the user interface
- **Backend**: Node.js with Express for the server-side logic
- **Database**: PostgreSQL for storing user data, events, and calendar information.
- **Authentication**: JWT (JSON Web Tokens) for secure user authentication.
- **APIs**: Google Calendar API for Gmail calendar integration, Public Holidays API for important dates.
- **Deployment**: Render: https://react-social-calendar-app.onrender.com

## Target Audience
The app targets individuals and groups seeking a streamlined approach to social planning, including friends, family, and small organizational teams.

## Data Management
- **User-Generated Data**: Profiles, event details, calendar entries
- **API Data**: Gmail calendar events.

## Current Features:

### Database Design for Event and User Data
- Backend database setup for storing user profiles and event information.

### User Account Creation and Management:
-  Registration, login, and profile management functionalities.

### Calendar Viewing
- Users can view their personal local calendar and their google main calendar.

### Event Creation and Management:
-  Allows users to manage events on their calendars.

### Security and Authentication
- Implementation of JWT for secure access.


## Partially Completed or Deferred:

### Google Calendar API Integration
- **Description**: Partial integration for synchronizing events with Google Calendar.

### Responsive Frontend Design
- **Description**: Using MUI for a responsive frontend. Needs some work on smaller screen sizes.

## Future Development and Todos:
 
### Testing 
 - Better testing coverage for existing features

### Complete Google Calendar API Integration:
 - Ensure seamless synchronization between the app and users' Google Calendars.

### Implement Calendar Sharing: 
- Allow users to share their calendars with others, enhancing collaboration and scheduling efficiency.

### Develop Public/Private Event Settings:
- Enable users to designate events as public or private, providing control over event visibility.

### Introduce Invitations and Notifications: 
- Implement a system for sending event invitations and receiving notifications, improving engagement and user experience.