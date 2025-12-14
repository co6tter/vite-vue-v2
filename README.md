# vite-vue-v2

## Overview

A modern web application built with Vue 3, Vite, TypeScript, and Tailwind CSS v4. This project demonstrates a simple item list and detail view implementation with Vue Router.

## Tech Stack

- **Vue 3** (v3.5.18) - Progressive JavaScript framework
- **Vite** (v7.1.2) - Next generation frontend tooling
- **TypeScript** (v5.8.3) - Typed JavaScript
- **Vue Router** (v4.5.1) - Official router for Vue.js
- **Tailwind CSS** (v4.1.12) - Utility-first CSS framework

## Setup

### Prerequisites

- Node.js (recommended: latest LTS version)
- npm or yarn

### Installation

```bash
# Install dependencies
npm install
```

## Usage

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build

Build for production:

```bash
npm run build
```

The built files will be output to the `dist` directory.

### Preview

Preview the production build locally:

```bash
npm run preview
```

## Directory Structure

```
vite-vue-v2/
├── public/              # Static assets
├── src/
│   ├── assets/         # Asset files (images, styles)
│   ├── components/     # Reusable Vue components
│   ├── router/         # Vue Router configuration
│   ├── services/       # API services (mock data)
│   ├── views/          # Page components
│   │   ├── ItemList.vue    # Item list view
│   │   └── ItemDetail.vue  # Item detail view
│   ├── App.vue         # Root component
│   ├── main.ts         # Application entry point
│   └── style.css       # Global styles
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies
```

## License

This repository is for personal/private use only.
