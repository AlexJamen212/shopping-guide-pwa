# Shopping Guide PWA Project Overview

## Purpose
A Progressive Web App (PWA) for managing shopping lists and receipts with offline functionality. Includes features like receipt scanning, store-specific layouts, and shopping templates.

## Tech Stack
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 4
- **Styling**: Tailwind CSS + PostCSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa + Workbox
- **Package Manager**: npm

## Key Features
- Offline-first shopping lists
- Receipt scanning (manual entry mode for offline)
- Store-specific layouts and preferences
- Shopping templates and patterns
- IndexedDB for local storage
- Service Worker for offline functionality

## Project Structure
```
src/
├── components/          # React components
├── stores/             # Zustand state management
├── services/           # Data services (localDataService)
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
└── main.tsx            # Entry point
```