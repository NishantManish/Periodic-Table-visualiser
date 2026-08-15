# Periodic Table Explorer 🧪

The world's most interactive Periodic Table designed for students and professionals. This application provides a futuristic, accessible, and high-performance educational interface.

## Features ✨

- **Interactive Periodic Grid:** Beautiful UI with categorization, dynamic coloring, and quick filters.
- **3D Atom & Molecule Viewer:** Visualize atomic structures and molecular bonds using React Three Fiber.
- **Reaction Simulator:** Predict products from various combinations of elements.
- **AI Tutor:** Context-aware AI explanations tailored to different grade levels.
- **Gamified Quiz Mode:** Multiple choice, flashcards, timed blitz, guess the element, and more.
- **Progress Tracking:** XP, levels, streak tracking, and achievement badges.
- **PWA Ready:** Installable with offline support via Service Workers.
- **Accessibility:** Screen-reader friendly, High Contrast mode, Keyboard Navigation.

## Architecture & Tech Stack 🏗️

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Motion (Framer Motion).
- **3D Rendering:** Three.js, React Three Fiber.
- **State Management:** Zustand (with local storage persistence).
- **Routing/Views:** Custom fast view management with React Suspense for code-splitting.
- **Backend/API:** Express.js + Google GenAI SDK (Server-side AI Proxy).

## Setup & Deployment 🚀

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file with your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_key_here
   ```

3. **Development Server:**
   ```bash
   npm run dev
   ```

4. **Production Build:**
   ```bash
   npm run build
   npm start
   ```

## Optimization Strategies Implemented

- **Performance:** Lazy loading of all major views to ensure an ultra-small initial bundle size. Tree-shaking enabled.
- **SEO & PWA:** Custom meta tags, apple-touch-icon, and `vite-plugin-pwa` for robust offline caching.
- **Error Handling:** Global `ErrorBoundary` wrapped around dynamic components to catch rendering errors gracefully.
- **Animations:** Hardware-accelerated CSS animations and `motion/react` layout transitions.
