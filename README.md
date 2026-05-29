# ✍️ BlogSpace - Full Stack Blog Platform

A full-stack blog platform built with HTML, CSS, JavaScript, Node.js and MongoDB.

## 🚀 Features
- User Authentication (Register/Login)
- Create, Read, Update, Delete Posts
- Rich Text Editor
- Comments & Likes
- User Profiles & Follow System
- Search & Filter Posts
- Responsive Design

## 🛠️ Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs

## ⚙️ Setup Instructions

### 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/blog-platform.git

### 2. Install dependencies
cd backend
npm install

### 3. Create .env file
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key

### 4. Run the server
npm run dev

## � Deployment

### Backend on Render
1. Create a Render Web Service from the repo.
2. Set the root directory to `backend`.
3. Use build command `npm install` and start command `node server.js`.
4. Add the environment variables from `backend/.env.example`.
5. Set `ALLOWED_ORIGINS` to your deployed frontend URL(s).

### Frontend on Netlify or similar static host
1. Host the `frontend/` folder as static files.
2. Open `frontend/js/config.js` and replace `window.BLOGSPACE_API_BASE` with your deployed backend URL.

## �📅 Built in 30 Days
Following a day-by-day build schedule.