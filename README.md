# AI Resume Analyser (Resumind)

A modern frontend application for analyzing resumes using AI to provide smart feedback for your dream job. Built with React Router 7 and integrates with third-party APIs for AI analysis and cloud storage.

## Features

### Core Functionality
- 📄 **PDF Resume Upload** - Drag & drop PDF resume upload with file validation
- 🤖 **AI-Powered Analysis** - Intelligent resume analysis via third-party AI APIs
- 📊 **ATS Compatibility Scoring** - Check how well your resume works with Applicant Tracking Systems
- 💼 **Job Matching** - Analyze resume against specific job descriptions
- 📈 **Detailed Feedback** - Get comprehensive insights and improvement suggestions

### Technical Features
- 🚀 **Server-side rendering** with React Router 7
- ⚡️ **Hot Module Replacement (HMR)** for fast development
- 🔒 **TypeScript** for type safety
- 🎨 **TailwindCSS** for responsive styling
- 🌐 **Internationalization (i18n)** - Multi-language support (English/Vietnamese)
- 🔐 **Authentication** via Puter.js cloud platform
- ☁️ **Third-party Integration** - Uses Puter.js for storage and external AI APIs
- 🧪 **Comprehensive Testing** - Unit, integration, and E2E tests

### Architecture
- 🏗️ **Redux Toolkit** for state management
- 🔄 **RTK Query** for API data fetching
- 📱 **Responsive Design** supporting mobile, tablet, and desktop
- 🎯 **Client-side Application** with third-party service integration

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Third-Party Services

This application integrates with the following external services:

### Puter.js Cloud Platform
- **Authentication**: User login and session management
- **File Storage**: Resume PDF storage and retrieval
- **Key-Value Store**: Analysis results and user data storage

### AI Analysis APIs
- Resume content analysis and feedback generation
- ATS compatibility scoring
- Job description matching algorithms

## Deployment

This project uses automated CI/CD deployment:

1. **Push to dev branch** - All development code goes here
2. **GitHub Actions Pipeline** - Runs tests automatically on push to dev
3. **Auto-merge to main** - If all tests pass, code is automatically merged to main
4. **Vercel Auto-deploy** - Main branch automatically deploys to production

### Workflow
```bash
git checkout dev
git add .
git commit -m "your changes"
git push origin dev
# GitHub Actions handles the rest!
```

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed development workflow and CI/CD process.

## Testing

See [TESTING.md](./TESTING.md) for comprehensive testing information including unit, integration, and E2E tests.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:all` - Run all tests

---

Built with ❤️ using React Router 7, TypeScript, and TailwindCSS.
