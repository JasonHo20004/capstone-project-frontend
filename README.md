# Capstone Project - E-Learning Platform Frontend

An online learning platform providing comprehensive course management, flashcards, and learning features with three main user roles: Students, Instructors, and Administrators.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)

## 🎯 Overview

This is the frontend application for a capstone project - an E-Learning Platform. The application provides a comprehensive learning experience with course management, interactive learning, flashcards, and integrated payment system.

## ✨ Key Features

### For Students (User)
- 🔍 Browse and search courses
- 🛒 Shopping cart and checkout
- 💳 Digital wallet management
- 📚 Learn with videos and materials
- 🎴 Flashcards for revision
- 💬 Comment and review courses
- 📊 Track learning progress
- 🔔 Notifications

### For Instructors (Seller)
- 📝 Create and manage courses
- 📹 Upload lessons and materials
- 👥 Manage learners
- 💰 Track revenue
- 💬 Interact with students via comments
- 📊 Statistics dashboard

### For Administrators (Admin)
- 👤 User management
- 📚 Review and manage courses
- 📝 Process instructor applications
- 💵 Transaction and revenue management
- 📊 System overview dashboard
- 🔔 Notification management

## 🛠️ Tech Stack

- **Framework**: React 18.3.1
- **Language**: TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19
- **Styling**:
  - Tailwind CSS 3.4.17
  - shadcn-ui components
  - Radix UI primitives
- **State Management & Data Fetching**: TanStack Query 5.83.0
- **Routing**: React Router DOM 6.30.2
- **Form Handling**: React Hook Form 7.61.1 + Zod 3.25.76
- **HTTP Client**: Axios 1.13.2
- **Charts**: Recharts 2.15.4
- **UI Libraries**:
  - Lucide React (icons)
  - date-fns (date utilities)
  - Sonner (toast notifications)
  - Embla Carousel

## 📦 Installation

### Prerequisites
- Node.js (version 16.x or higher)
- npm or yarn

### Installation Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd capstone-project-frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Then edit the `.env` file with appropriate values.

## ⚙️ Environment Configuration

Create a `.env` file in the root directory with the following content:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Optional Configuration
VITE_APP_NAME=SkillBoost
VITE_APP_VERSION=1.0.0
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_BASE_URL` | Backend API URL | ✅ |
| `VITE_APP_NAME` | Application name | ❌ |
| `VITE_APP_VERSION` | Application version | ❌ |

## 🚀 Running the Application

### Development mode
```bash
npm run dev
```
Application will run at `http://localhost:5173`

### Build for production
```bash
npm run build
```

### Build for development
```bash
npm run build:dev
```

### Preview production build
```bash
npm run preview
```

### Lint code
```bash
npm run lint
```

## 📁 Project Structure

```
capstone-project-frontend/
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/             # shadcn-ui components
│   │   ├── admin/          # Admin components
│   │   ├── seller/         # Seller components
│   │   ├── user/           # User components
│   │   └── auth/           # Protected routes
│   ├── pages/              # Main pages
│   │   ├── admin/          # Admin pages
│   │   ├── seller/         # Seller pages
│   │   ├── user/           # User pages
│   │   └── shared/         # Shared pages
│   ├── lib/                # Utilities and services
│   │   └── api/            # API services
│   │       └── services/   # Service layers
│   ├── hooks/              # Custom React hooks
│   │   └── api/            # API hooks
│   ├── context/            # React Context providers
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
└── tailwind.config.ts      # Tailwind CSS configuration
```

## 👥 User Roles

### 🎓 Student (User)
- **Routes**: `/`, `/courses`, `/my-courses`, `/flashcards`, `/cart`, `/wallet`
- **Access**: Public routes + Protected user routes

### 👨‍🏫 Instructor (Seller)
- **Routes**: `/seller/*`
- **Access**: Requires authentication and Seller role
- **Features**: Manage courses, track learners, manage revenue

### 👨‍💼 Administrator (Admin)
- **Routes**: `/admin/*`
- **Access**: Requires authentication and Admin role
- **Features**: Full system management

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview production build |
| `npm run lint` | Lint code with ESLint |

## 🔗 Useful Links

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [shadcn-ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [TanStack Query](https://tanstack.com/query)

## 📄 License

Copyright © 2025. All rights reserved.
