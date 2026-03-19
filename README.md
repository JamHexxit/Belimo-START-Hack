# Belimo START Hack 2026 — Sensor Monitor

![Belimo Logo](public/logo-1x.png)

**Sensor Monitor** is a real-time monitoring dashboard for Belimo sensors, built for the START Hack 2026. It provides a seamless user experience with a modern, responsive interface, instant notifications, and intuitive device management.

## 🚀 Features

- **Real-time Dashboard** — Live sensor data with dynamic charts and status indicators
- **Device Management** — Add, edit, and remove sensors with instant updates
- **Room Organization** — Assign sensors to rooms for better spatial awareness
- **Smart Notifications** — Instant alerts for sensor events and system updates
- **Dark/Light Mode** — Automatic theme switching with smooth transitions
- **Responsive Design** — Beautiful UI across desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS v4, CSS Custom Properties
- **Backend**: Node.js, Express, SQLite3
- **Architecture**: Clean Architecture with Domain-Driven Design principles

## 📂 Project Structure

```
Belimo-START-Hack/
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── domain/           # Business logic & entities
│   │   ├── application/      # Use cases & application layer
│   │   ├── infrastructure/   # Database & external integrations
│   │   └── presentation/     # Controllers & API endpoints
│   ├── package.json
│   └── ...
└── frontend/                 # Next.js web application
    ├── app/
    │   ├── components/       # Reusable UI components
    │   ├── context/          # Global state management
    │   ├── lib/              # API clients & utilities
    │   ├── views/            # Page components
    │   └── ...
    ├── public/
    ├── package.json
    └── ...
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

The backend will start on `http://localhost:3000`.

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## 🎨 Design System

The application uses a modern design system with:

- **Primary Color**: Belimo Orange (`#E8470A`)
- **Typography**: Inter font family
- **Layout**: Sidebar navigation with main content area
- **Themes**: Light and dark mode with smooth transitions
- **Components**: Reusable cards, buttons, modals, and charts

## 🤝 Contributing

Contributions are welcome! This project follows clean architecture principles with:

1. **Domain Layer** — Core business logic and entities
2. **Application Layer** — Use cases and application-specific logic
3. **Infrastructure Layer** — Database, APIs, and external integrations
4. **Presentation Layer** — Controllers and API endpoints

## 📝 License

This project is built for the START Hack 2026 and is intended for educational and demonstration purposes.

## 👥 Team

- Array of Idiots
