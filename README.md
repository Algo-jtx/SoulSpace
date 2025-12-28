# SoulSpace

## Description
SoulSpace is a personal wellbeing web app designed to help users reflect, journal, and practice mindfulness. This project was built entirely by me, demonstrating full-stack skills in React and frontend-backend integration.

## Main Features
- Private journal (“Letters Unsent”)  
- Time capsules with future unlock  
- Loop breaker random mindfulness prompts  
- Breath & ground exercises  

## Screenshots

![Landing page](<screenshots/Screenshot 2025-12-28 223821.png>)

![Signup](<screenshots/Screenshot 2025-12-28 224015.png>)

![Features](<screenshots/Screenshot 2025-12-28 224139.png>)

![Features](<screenshots/Screenshot 2025-12-28 224206.png>)


## Tech Stack
- **Frontend:** React (functional components & hooks)  
- **Routing:** React Router v5 for client-side navigation  
- **State Management:** React state + localStorage  
- **Backend:** Flask API with SQLite database (handles journaling and prompts)  
- **UI:** HTML, CSS, responsive design  
- **API Calls:** fetch / Axios (for frontend-backend integration)  

> Optional deeper details available in `/docs/TECH_DETAILS.md` (e.g., folder structure, component hierarchy, routing logic, API endpoints)

## My Role
I built the **entire project** from scratch:
- Developed all React components and frontend views  
- Implemented routing using React Router v5  
- Integrated frontend with Flask API  
- Managed state and localStorage logic for journaling and prompts  
- Designed responsive layout and user interface  

## Challenges & Learnings
- Learned to integrate frontend React with a backend API  
- Worked with React Router v5 for navigation  
- Managed state and asynchronous calls efficiently  

## Setup

If you want to run this project locally or contribute, follow these steps:

1. *Prerequisites:*

   * Ensure you have Python 3 installed.

   * Ensure you have Node.js and npm (or yarn) installed.

   * Using WSL (Windows Subsystem for Linux) or a Linux-based system is recommended for consistent environment.
```bash
# 1. Clone the repository
git clone <your-repository-url-here>
cd SoulSpace

# 2. Backend Setup (Flask)
cd server
pipenv install
pipenv shell
python app.py & # Starts server on [http://127.0.0.1:5555](http://127.0.0.1:5555)

# 3. Frontend Setup (React)
# Open a new terminal or run:
cd ../client
npm install
npm start # Opens app on http://localhost:3000
```
 * Ensure both the Flask backend (python app.py) and the React frontend (npm start) are running in separate terminals.
