# CGPA Fetcher Web App

A modern web application to fetch and display student CGPA and semester results.

## Features

- 🎓 Fetch CGPA for any semester
- 📱 Responsive, modern UI
- 📸 Screenshot capture of results
- 🚀 Real-time progress tracking
- 🔒 Secure credential handling

## Tech Stack

### Frontend

- React
- Material-UI
- Tailwind CSS
- Vite

### Backend

- Node.js
- Express
- Puppeteer

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm

### Backend Setup

```bash
cd backend
npm install
npm start
```

Server runs on http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs on http://localhost:3000

## Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000
```

### Backend (.env)

```
PORT=5000
NODE_ENV=development
```

## Deployment

### Backend (Render)

- Runtime: Node
- Build Command: `npm install`
- Start Command: `node index.js`

### Frontend (Vercel)

- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
