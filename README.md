# Arena Master - Esports Tournament Management System

Arena Master is a web application for managing esports tournaments such as BGMI and Free Fire. It helps tournament organizers manage teams, players, matches, and standings from a single dashboard.

The project was built using Node.js, Express.js, MySQL, and Tailwind CSS as a learning project to understand full-stack web development and database management.

---

## Features

### Dashboard

* View tournament statistics
* Track total teams and players
* View live and completed matches
* Quick overview of tournament activity

### Tournament Management

* Create tournaments
* Update tournament details
* Delete tournaments
* Track tournament status

### Team Management

* Register teams
* Approve or reject registrations
* Assign teams to tournaments
* View team information

### Player Management

* Add players to teams
* Update player information
* Assign player roles
* Manage team rosters

### Match Management

* Schedule matches
* Update match status
* Record winners and scores
* View match history

### Leaderboard

* Display team rankings
* Track wins, losses, kills, and points
* Automatically update standings after matches

### Data Export

* Export team information
* Export match records
* Download reports in CSV format

---

## Tech Stack

### Frontend

* HTML
* Tailwind CSS
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MySQL

### Authentication

* JWT
* bcryptjs

---

## Project Structure

project/

├── config/

├── controllers/

├── middleware/

├── routes/

├── public/

├── schema.sql

├── server.js

├── package.json

└── README.md

---

## Installation

### Clone the Repository

git clone <repository-url>

cd project

### Install Dependencies

npm install

### Configure Environment Variables

Create a `.env` file in the root directory.

PORT=3000

DB_HOST=localhost

DB_USER=root

DB_PASSWORD=

DB_NAME=esports_db

JWT_SECRET=your_secret_key

### Create Database

CREATE DATABASE esports_db;

### Import Schema

mysql -u root esports_db < schema.sql

### Run the Application

npm start

### Open in Browser

http://localhost:3000

---

## Default Admin Login

Username: admin

Password: admin123

---

## Database Tables

* admins
* tournaments
* teams
* players
* matches
* registrations
* leaderboard

---

## Future Improvements

* Double elimination brackets
* Real-time match updates
* Team logo uploads
* Email notifications
* Advanced tournament analytics
* Public tournament pages

---

## Learning Outcomes

This project helped in understanding:

* REST API development
* Database design and SQL queries
* Authentication using JWT
* CRUD operations
* Express.js routing
* Frontend and backend integration
* Full-stack application development

---

## Author

Amit Kumar 
