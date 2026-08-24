# 🎨 AV Overseas — Frontend Dashboard

This directory contains the single-page web application for **AV Overseas**, built with **React 19**, **Vite**, and customized Glassmorphism CSS.

## 🚀 Running the Frontend Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build
```

## ⚙️ Environment Configuration

- **Development Port**: `http://localhost:5173`
- **Backend API Base**: Default connects to `http://localhost:8080/api/v1`
- **Custom Backend URL**: Set `VITE_API_BASE` in a `.env` file if deploying to a remote host:
  ```env
  VITE_API_BASE=https://your-backend-url/api/v1
  ```
