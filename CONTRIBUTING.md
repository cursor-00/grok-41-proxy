# Contributing to Puter.js Proxy Server

Thank you for your interest in contributing to Puter.js Proxy Server! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Ways to Contribute](#-ways-to-contribute)
- [Development Process](#-development-process)
- [Submitting Changes](#-submitting-changes)
- [Style Guides](#-style-guides)
- [Community](#-community)

---

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct.html). By participating, you are expected to uphold this code.

### Our Standards

- **Be Respectful**: Treat everyone with respect and kindness
- **Be Collaborative**: Work together constructively
- **Be Inclusive**: Welcome newcomers and diverse perspectives
- **Be Professional**: Maintain professional communication

### Unacceptable Behavior

- Harassment or discrimination
- Personal attacks or insults
- Unwelcome sexual attention
- Publishing private information

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Git
- npm or yarn
- Puter.js account (for testing)

### Quick Start

```bash
# 1. Fork the repository
# Click the "Fork" button on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR-USERNAME/jsputer-proxy.git
cd jsputer-proxy

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Install dependencies
npm install

# 5. Make your changes

# 6. Test your changes
npm test

# 7. Commit and push
git commit -m "Add amazing feature"
git push origin feature/amazing-feature

# 8. Open a Pull Request
```

---

## 🤝 Ways to Contribute

### 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear title** describing the issue
2. **Detailed description** of what happened
3. **Steps to reproduce** the bug
4. **Expected behavior** vs actual behavior
5. **Screenshots or logs** (if applicable)
6. **Environment details** (OS, Node.js version, etc.)

```markdown
## Bug Report Template

### Description
[Clear description of the bug]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [...]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happened]

### Environment
- OS: [e.g., Ubuntu 22.04]
- Node.js: [e.g., v22.17.0]
- npm: [e.g., 10.9.0]
```

### 💡 Feature Requests

When requesting features:

1. **Problem statement** - What problem are you solving?
2. **Proposed solution** - How do you think it should work?
3. **Use cases** - When would this be useful?
4. **Alternatives** - Have you considered other approaches?

### 📝 Documentation

Help improve documentation:
- Fix typos and grammar
- Add examples and tutorials
- Translate to other languages
- Improve clarity and structure

### 🔧 Code Contributions

Areas where we need help:
- New model integrations
- Performance optimizations
- Security improvements
- Test coverage
- Feature enhancements

---

## 🔨 Development Process

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/mulkymalikuldhrs/jsputer-proxy.git
cd jsputer-proxy

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- --grep "model"

# Test specific endpoint
npm run test:api

# Check code coverage
npm run coverage
```

### Code Style

This project uses:
- **JavaScript**: Standard JS conventions
- **ES Modules**: Import/export syntax
- **No semicolons**: Prettier formatting
- **4 spaces**: Indentation

```javascript
// ✅ Correct
import express from 'express'
import { init } from '@heyputer/puter.js/src/init.cjs'

// ❌ Incorrect
const express = require('express'); // No require in ES modules
```

### Git Workflow

1. Create a feature branch from `main`
2. Make small, focused commits
3. Write descriptive commit messages
4. Keep your branch updated with main
5. Test before submitting PR

```bash
# Create feature branch
git checkout -b feature/new-model

# Make changes
# ...

# Commit with descriptive message
git commit -m "Add support for new-model-2025"

# Push to your fork
git push origin feature/new-model
```

---

## 📤 Submitting Changes

### Pull Request Process

1. **Ensure CI passes** - All tests must pass
2. **Update documentation** - Add comments and update README
3. **Add tests** - Cover new functionality
4. **Describe changes** - Explain what you changed and why
5. **Request review** - Tag maintainers for review

### PR Template

```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## Testing
[Describe how you tested the changes]

## Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented my code
- [ ] I have made corresponding changes
- [ ] My changes generate no new warnings
- [ ] I have added tests
- [ ] New and existing tests pass
```

### Review Process

1. Maintainers will review within 48-72 hours
2. You may receive feedback or requested changes
3. Once approved, your PR will be merged
4. You'll be credited in the next release

---

## 📏 Style Guides

### JavaScript Style

```javascript
// Use const for constants
const PORT = 3333

// Use let for variables that change
let serverRunning = false

// Use descriptive variable names
const authenticationToken = process.env.PUTER_AUTH_TOKEN

// Use async/await over callbacks
async function getResponse() {
  try {
    const result = await puter.ai.chat(messages, options)
    return result
  } catch (error) {
    console.error('Error:', error.message)
    throw error
  }
}
```

### Git Commit Messages

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Restructuring
- `test`: Testing
- `chore`: Maintenance

Examples:
```
feat(models): Add support for gemini-2.5-pro

Implement auto-detection for gemini-2.5-pro model

Closes #123
```

---

## 💬 Community

### Questions?

- Check existing [Issues](https://github.com/mulkymalikuldhrs/jsputer-proxy/issues)
- Check [Discussions](https://github.com/mulkymalikuldhrs/jsputer-proxy/discussions)
- Open a new question if needed

### Join the Community

- ⭐ Star the repo
- 🐦 Follow on Twitter
- 💼 Connect on LinkedIn
- 💬 Join Discord (coming soon)

---

## 🙏 Recognition

Contributors will be recognized in:
- README.md "Contributors" section
- Release notes
- Project documentation

Thank you for contributing! 🎉
