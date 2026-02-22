🌤️ Modern Weather Dashboard

A modern and responsive Weather Dashboard Web App built using HTML, CSS, and JavaScript, integrated with a Weather API to fetch real-time weather data dynamically.

🚀 Features

🌍 Search weather by city name

🌡️ Real-time temperature data

💧 Humidity information

🌬️ Wind speed details

🌥️ Dynamic weather icons

📡 Live API data fetching

❌ Error handling for invalid city names

📱 Fully responsive design

🛠️ Tech Stack

HTML5 – Structure

CSS3 – Styling & Responsive UI

JavaScript (ES6) – Logic & API Handling

Weather API (e.g., OpenWeatherMap API) – Real-time weather data

🔗 API Integration

This project uses a Weather API to fetch live weather data using fetch().

Example API Call:
const apiKey = "YOUR_API_KEY" ;

fetch(url)
  .then(response => response.json())
  .then(data => {
      console.log(data);
  });
📂 Project Structure
Modern_Weather_Dashboard/
│
├── index.html
├── style.css
├── script.js
└── README.md
⚙️ How to Run the Project

Clone the repository

Open the project folder

Add your API key inside script.js

Open index.html in your browser

📌 Learning Outcomes

This project helped in understanding:

🌐 REST API integration

📡 Fetch API & Promises

🔄 Asynchronous JavaScript

🎯 DOM Manipulation

📱 Responsive Web Design

🚧 Future Improvements

5-Day Weather Forecast

Auto location detection (Geolocation API)

Dark / Light mode

Weather animations

Deploy on Netlify / Vercel

👨‍💻 Author

Saurabh
Frontend Developer | MERN Stack Learner
