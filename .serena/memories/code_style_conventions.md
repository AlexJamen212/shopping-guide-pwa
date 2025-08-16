# Code Style & Conventions

## TypeScript
- Strict TypeScript configuration enabled
- All components use TypeScript with proper typing
- Interface definitions in src/types/index.ts
- Use type imports: `import type { TypeName } from './types'`

## React Patterns
- Functional components with hooks
- Custom hooks pattern (e.g., useToast)
- Component file naming: PascalCase.tsx
- State management via Zustand

## Code Style
- No comments added unless requested
- Minimal, direct responses
- Prefer editing existing files over creating new ones
- Follow existing patterns and conventions in codebase

## Error Handling
- Always add null checks for optional references
- Handle async operations with try/catch
- Use proper TypeScript strict mode compliance

## File Organization
- Components in src/components/
- Types centralized in src/types/
- Services in src/services/
- State management in src/stores/