# Development Workflow

## Git Workflow

This project uses a CI/CD workflow with two main branches:

- **`dev`** - Development branch where all new code is pushed
- **`main`** - Production branch that automatically deploys to Vercel

## Development Process

1. **Push to dev branch:**
   ```bash
   git checkout dev
   git add .
   git commit -m "your changes"
   git push origin dev
   ```

2. **Automated Testing:**
   When you push to `dev`, GitHub Actions will automatically:
   - Run type checking (`npm run typecheck`)
   - Run unit tests (`npm run test:unit`) - must pass 100%
   - Run integration tests (`npm run test:integration`) - must pass 100%
   - Run e2e tests (`npm run test:e2e`) - must pass ≥90%

3. **Automatic Merge:**
   If all tests pass, the code is automatically merged to `main` and deployed to Vercel.

## Test Requirements

- **Unit & Integration Tests:** Must pass 100%
- **E2E Tests:** Must pass at least 90% (allows for some flaky tests)

## Available Test Scripts

```bash
npm run test:unit          # Run unit tests
npm run test:integration   # Run integration tests  
npm run test:e2e          # Run e2e tests
npm run test:all          # Run all tests
npm run typecheck         # Type checking
```

## Branch Protection

The `main` branch is protected and can only receive code through the automated CI/CD pipeline from the `dev` branch.