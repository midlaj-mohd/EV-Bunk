# Electric Vehicle Recharge Bunk


![image](https://github.com/user-attachments/assets/faed2e74-8dcd-492f-97c5-9e70cc19b0cf)



## Overview
Electric Vehicle Recharge Bunk is a web-based application designed to streamline the process of finding and booking EV charging stations (referred to as "bunks") in various locations. It provides a user-friendly interface for both EV owners and administrators, supporting station management, booking functionality, and real-time map integration.

### Features

#### User Functionality:
Find and book charging slots at available stations.
View recent bookings and booking history.
Access station location and contact details via map integration.
#### Admin Functionality:
Create, edit, and delete EV charging bunks.
Manage charging slots and user access.
Mark and update bunk locations on a map.
Access analytics for usage statistics and station management.

## Technology Stack

#### Frontend: HTML, CSS, JavaScript
#### Backend Services: Firebase Firestore (database), Firebase Authentication (user management)
#### Map Integration: Leaflet.js for mapping, OpenCage API for location search

## Pages

### 1. Login
Allows both users and admins to log in securely.
Based on role, redirects to the appropriate dashboard (admindashboard.html for admins and userpage.html for users).
### 2. User Pages
Home Page: Displays available charging stations with a map view.
Booking Page: Enables users to select a bunk, choose a slot, and book for a specified time.
My Bookings: Shows a popup with recent booking information, including station name, slot number, location, and contact details.
### 3. Admin Dashboard
Create Bunk: Allows admins to create new charging stations with details like name, number of slots, charging type, location, and contact.
Manage Bunk: View, edit, and delete charging stations. Includes a modal popup for editing station details.
Manage Users: View and manage registered users.
Remove Slot: Allows removal of individual slots within stations.
Analytics: Presents usage statistics and insights.
Mark Bunk on Map: Lets admins set bunk latitude and longitude directly by selecting a location on the map.

## Setup and Installation
1.Clone this repository.

2.Install dependencies and link required scripts and stylesheets in the HTML files:
> link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css"/>
> <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
3.Obtain and configure a Firebase project:
Set up Firestore and Authentication services.
Add Firebase configuration to script.js to initialize Firebase in your project.

4.Obtain an OpenCage API key for location search and add it to your project.

5.Launch the application by opening index.html in a browser.

## How to Use

**Users:** Register or log in, then explore available stations on the map. Use the search bar to find nearby stations, and book slots by selecting a station and time.

**Admins:** Log in to access the admin dashboard. Manage bunks, users, and slots, or view analytics and map locations.

## Project Structure
### HTML Files:
index.html - Login/Register.
booking.html - Page for slot booking.
admindashboard.html - Admin interface.
Userpage.html - User Page
### JavaScript Files:
script.js - Contains Firebase initialization, API calls, and event handlers.
### CSS Files:
styles.css - Project-wide styling, including custom styles for the user and admin dashboards.

## Dependencies
Firebase Firestore & Authentication

Leaflet.js for interactive maps

OpenCage API for location-based search

## Screenshots
### 1. Login Page
![image](https://github.com/user-attachments/assets/ddb470eb-559f-4cb2-8322-0c4cd714e47c)
### 2. User Page
![User Page](https://github.com/user-attachments/assets/07cefd3c-e6d0-4bcf-adf7-6402c7fcd1b7)
### 3. Admin Dashboard
![Admin Dashboard](https://github.com/user-attachments/assets/b0de6736-fed5-4b37-a393-63bac44ca3be)
### 4. Booking Page
![Slot Booking](https://github.com/user-attachments/assets/41881fb6-03c2-46b6-9580-f813f3571aa2)




