# Contributing to SvelteKit Authentication & Authorization Boilerplate

Thank you for your interest in contributing to this project! We welcome contributions from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

## Code of Conduct

This project and everyone participating in it is governed by a code of conduct. By participating, you are expected to uphold this code. Please be respectful and constructive in your interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/svelte-boilerplate.git`
3. Add upstream remote: `git remote add upstream https://github.com/Twijn/svelte-boilerplate.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## How to Contribute

### Types of Contributions

- **Bug fixes**: Fix existing issues
- **Features**: Add new functionality
- **Documentation**: Improve or add documentation
- **Tests**: Add or improve test coverage
- **Refactoring**: Improve code quality without changing functionality
- **Performance**: Optimize existing code

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm
- Docker and Docker Compose

### Setup Steps

1. **Install dependencies:**

   ```sh
   pnpm install
   ```

2. **Set up environment variables:**

   ```sh
   cp .env.example .env
   # Edit .env with your local configuration
   ```

3. **Start the database:**

   ```sh
   pnpm db:start
   ```

4. **Push database schema:**

   ```sh
   pnpm db:push
   ```

5. **Seed the database:**

   ```sh
   pnpm db:seed
   ```

6. **Start the development server:**
   ```sh
   pnpm dev
   ```

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm check` - Run type checking
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm db:push` - Push schema to database
- `pnpm db:studio` - Open Drizzle Studio

## Coding Guidelines

### General Principles

- Write clean, readable, and maintainable code
- Follow the existing code style and patterns
- Keep functions small and focused on a single responsibility
- Use meaningful variable and function names
- Comment complex logic, but prefer self-documenting code

### TypeScript

- Use TypeScript for all new code
- Avoid using `any` type; use proper typing
- Define interfaces and types in appropriate locations
- Use type inference where appropriate

### Svelte Components

- Use Svelte 5 runes syntax (`$state`, `$derived`, `$effect`)
- Keep components small and reusable
- Place reusable components in `src/lib/components/ui/`
- Use meaningful component names in PascalCase

### File Organization

- Server-side code goes in `src/lib/server/`
- Shared utilities go in `src/lib/`
- Components go in `src/lib/components/`
- Routes follow SvelteKit conventions in `src/routes/`

### Styling

- Use the existing CSS variables for consistency
- Follow the existing styling patterns
- Ensure responsive design for mobile devices
- Test your changes in different browsers

### Database

- Use Drizzle ORM for all database operations
- Create migrations for schema changes: `pnpm db:generate`
- Test migrations thoroughly before committing
- Document any new database schemas

## Commit Messages

We follow conventional commits for clear git history:

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Examples

```
feat(auth): add OAuth 2.0 Google provider

Added Google OAuth authentication provider with proper error handling
and user profile sync.

Closes #123
```

```
fix(profile): resolve avatar upload validation issue

Fixed bug where large images weren't being properly validated
before upload, causing server errors.

Fixes #456
```

```
docs(readme): update installation instructions

Added more detailed steps for Windows users and troubleshooting
section for common issues.
```

## Pull Request Process

### Before Submitting

1. **Update your branch:**

   ```sh
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run linting and type checking:**

   ```sh
   pnpm lint
   pnpm check
   ```

3. **Test your changes:**
   - Test all affected functionality
   - Test in different browsers if UI changes
   - Ensure no console errors or warnings

4. **Update documentation:**
   - Update README.md if needed
   - Add/update relevant docs in `docs/` folder
   - Add comments for complex logic

### Submitting a Pull Request

1. Push your branch to your fork
2. Open a pull request against the `main` branch
3. Fill out the pull request template completely
4. Link any related issues

### PR Title Format

Use the same format as commit messages:

```
feat(auth): add OAuth 2.0 Google provider
```

### PR Description Should Include

- **What**: Brief description of changes
- **Why**: Reason for the changes
- **How**: Technical details if complex
- **Testing**: How you tested the changes
- **Screenshots**: For UI changes
- **Breaking Changes**: If any, with migration guide

### Review Process

- Maintainers will review your PR
- Address any requested changes
- Keep discussions respectful and professional
- PRs require at least one approval before merging

## Reporting Bugs

### Before Reporting

1. Check if the bug has already been reported
2. Test with the latest version
3. Try to reproduce consistently

### Bug Report Should Include

- **Description**: Clear description of the bug
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**:
  - OS and version
  - Node.js version
  - Browser and version (if applicable)
- **Screenshots/Logs**: If applicable
- **Possible Fix**: If you have suggestions

## Suggesting Enhancements

### Before Suggesting

1. Check if it's already been suggested
2. Ensure it aligns with the project goals
3. Consider if it would benefit most users

### Enhancement Request Should Include

- **Problem**: What problem does it solve?
- **Solution**: Describe your proposed solution
- **Alternatives**: Any alternative solutions considered
- **Use Case**: Real-world scenarios where this helps
- **Implementation**: Any technical considerations

## Questions?

If you have questions about contributing:

1. Check the documentation in the `docs/` folder
2. Review existing issues and PRs
3. Open a new issue with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to make this boilerplate better! 🎉
