# Task Completion Checklist

## Required Steps After Any Code Changes

### 1. Build Verification (CRITICAL)
- [ ] Run `npm run build`
- [ ] Verify exit code is 0
- [ ] Check that dist/ folder is populated
- [ ] No TypeScript compilation errors

### 2. Code Quality
- [ ] TypeScript strict mode compliance
- [ ] No console errors or warnings
- [ ] Follow existing code patterns
- [ ] Maintain offline functionality

### 3. Security Review
- [ ] No sensitive information in frontend code
- [ ] Verify secure coding practices
- [ ] Check for potential vulnerabilities

### 4. Documentation
- [ ] Update tasks/todo.md with progress
- [ ] Mark completed items
- [ ] Document any important changes

## Build Command
```bash
npm run build
```

## Critical Note
NEVER mark a task as complete if `npm run build` fails. The build must pass for successful deployment.