# Suggested Commands for Development

## Build & Development
```bash
# Development server
npm run dev

# Production build (TypeScript compilation + Vite build)
npm run build

# Preview production build
npm run preview

# Deploy to production
npm run deploy
```

## Windows Commands (Current Environment)
```cmd
# List files/directories
dir

# Change directory
cd path\to\directory

# Copy files
copy source destination

# Move files
move source destination

# Delete files
del filename

# View file contents
type filename
```

## Git Operations
```bash
git status
git add .
git commit -m "message"
git push
```

## Build Verification
- Always run `npm run build` after making code changes
- Build must exit with code 0 for successful deployment
- Check that dist/ folder is populated after build