# 23I-3074_SCDProject
# NodeVault - Vault Management System

A comprehensive Node.js application with CRUD operations, search, sorting, export, and MongoDB integration.

## 🚀 Features Implemented

### Part 3 Requirements:
- ✅ Search Records functionality
- ✅ Sort Records by name/date  
- ✅ Export Data to text file
- ✅ Automatic Backup System
- ✅ Data Statistics display
- ✅ MongoDB Integration
- ✅ Environment Variables (.env)

## 🛠️ Technologies Used
- Node.js
- Express.js
- MongoDB with Mongoose
- File System operations
- Event-driven architecture

## 📁 Project Structure

SCDProject25/
├── main.js # Main application
├── db/ # Database operations
├── events/ # Event logging
├── data/ # File storage
├── backups/ # Automatic backups
├── logs/ # Application logs
└── .env # Environment configuration

## 🚀 Getting Started
1. Clone repository
2. Run `npm install`
3. Start MongoDB: `docker run -d -p 27017:27017 mongo`
4. Run `node main.js`
