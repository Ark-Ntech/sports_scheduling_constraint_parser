# Contributing to Sports Scheduling Constraint Parser

Thank you for your interest in contributing to the Sports Scheduling Constraint Parser! This project transforms natural language scheduling constraints into structured data using advanced ML techniques. We welcome contributions from developers of all skill levels.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contribution Workflow](#contribution-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [ML/NLP Contributions](#mlnlp-contributions)
- [UI/UX Contributions](#uiux-contributions)
- [Database Contributions](#database-contributions)
- [Documentation](#documentation)
- [Issue Guidelines](#issue-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## 🤝 Code of Conduct

We are committed to fostering a welcoming and inclusive community. Please read and follow our Code of Conduct:

- **Be respectful**: Treat all contributors with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Remember that everyone has different experience levels
- **Be collaborative**: Work together to improve the project

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** and **pnpm** installed
- **Git** for version control
- **Supabase account** for database access
- **Hugging Face account** for ML API access
- Basic understanding of **TypeScript**, **React**, and **Next.js**

### Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/Ark-Ntech/sports-scheduling-constraint-parser.git
   cd sports-scheduling-constraint-parser
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Set up environment variables** (copy `.env.example` to `.env.local`)
5. **Start development server**:
   ```bash
   pnpm dev
   ```

## 🛠 Development Setup

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Hugging Face API
HUGGINGFACE_API_KEY=hf_your_token_here

# Authentication
AUTH_SECRET=your_auth_secret

# Optional: Development flags
NODE_ENV=development
```

### Database Setup

1. Create a Supabase project
2. Run the database setup script:
   ```sql
   -- Copy and execute database-setup.sql in Supabase SQL editor
   ```
3. Verify tables are created correctly

### Development Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run linter
pnpm lint

# Run formatter
pnpm format

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type checking
pnpm type-check
```

## 📁 Project Structure

Understanding the project structure will help you contribute effectively:

```
sports-scheduling-constraint-parser/
├── app/                          # Next.js App Router
│   ├── (chat)/                   # Main application pages
│   │   ├── api/                  # API routes
│   │   │   ├── parse/            # ML parsing endpoints
│   │   │   ├── constraints/      # Constraint CRUD
│   │   │   ├── constraint-sets/  # Set management
│   │   │   └── [hierarchy]/      # Sports hierarchy APIs
│   │   └── page.tsx             # Main dashboard
│   └── login/                   # Authentication pages
├── components/                   # React components
│   ├── constraint-parser.tsx    # ML-powered parsing UI
│   ├── enhanced-constraint-set-manager.tsx  # Hierarchy management
│   ├── schedule-calendar.tsx    # Calendar with validation
│   └── ui/                      # Reusable UI components
├── lib/                         # Utility libraries
│   ├── nlp/                     # NLP and ML processing
│   ├── supabase/               # Database client
│   ├── types.ts                # TypeScript definitions
│   └── utils.ts                # Helper functions
├── tests/                       # Test files
└── docs/                       # Documentation
```

## 🔄 Contribution Workflow

### 1. Choose an Issue

- Browse [open issues](https://github.com/Ark-Ntech/sports_scheduling_constraint_parser/issues)
- Look for issues labeled `good first issue` for beginners
- Comment on the issue to indicate you're working on it

### 2. Create a Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 3. Make Changes

- Write clean, well-documented code
- Follow the coding standards outlined below
- Add tests for new functionality
- Update documentation as needed

### 4. Test Your Changes

```bash
# Run all tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Check types
pnpm type-check

# Lint and format
pnpm lint
pnpm format
```

### 5. Commit Changes

Use conventional commit messages:

```bash
git commit -m "feat: add new constraint type validation"
git commit -m "fix: resolve calendar rendering issue"
git commit -m "docs: update API documentation"
```

### 6. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## 📝 Coding Standards

### TypeScript Guidelines

- **Use strict TypeScript**: Enable all strict mode options
- **Define interfaces**: Create clear type definitions for all data structures
- **Avoid `any`**: Use specific types or `unknown` when necessary
- **Use utility types**: Leverage TypeScript's utility types (Pick, Omit, etc.)

```typescript
// Good
interface ConstraintData {
  id: string;
  type: "temporal" | "capacity" | "location" | "rest" | "preference";
  confidence: number;
  entities: EntityData[];
}

// Avoid
const data: any = {};
```

### React Component Guidelines

- **Use functional components** with hooks
- **Implement proper error boundaries** for robust UX
- **Use TypeScript for props** with clear interfaces
- **Follow naming conventions**: PascalCase for components, camelCase for functions

```typescript
// Good
interface ConstraintParserProps {
  constraintSets: ConstraintSet[];
  onConstraintsParsed: (constraints: ParsedConstraint[]) => void;
}

export const ConstraintParser: React.FC<ConstraintParserProps> = ({
  constraintSets,
  onConstraintsParsed,
}) => {
  // Component logic
};
```

### API Route Guidelines

- **Use proper HTTP methods**: GET, POST, PUT, DELETE
- **Implement error handling**: Return appropriate status codes
- **Validate input data**: Use schema validation
- **Add proper TypeScript types** for request/response

```typescript
// Good
export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Validate input
    // Process request
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Styling Guidelines

- **Use Tailwind CSS** for styling
- **Follow responsive design principles**
- **Use consistent color scheme**: Primary blue, secondary colors as defined
- **Implement proper accessibility**: ARIA labels, keyboard navigation

```tsx
// Good
<button
  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
  aria-label="Parse constraint"
>
  Parse
</button>
```

## 🧪 Testing Guidelines

### Unit Tests

- **Test individual functions** and components
- **Use descriptive test names**
- **Cover edge cases** and error conditions
- **Mock external dependencies**

```typescript
describe("parseConstraint", () => {
  it("should parse temporal constraints with high confidence", () => {
    const result = parseConstraint("Team A cannot play on Mondays");
    expect(result.type).toBe("temporal");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it("should handle empty input gracefully", () => {
    const result = parseConstraint("");
    expect(result.error).toBeDefined();
  });
});
```

### Integration Tests

- **Test API endpoints** with real database operations
- **Test component interactions**
- **Verify data flow** between components

### E2E Tests

- **Test critical user journeys**
- **Use Playwright** for browser automation
- **Test across different devices** and browsers

```typescript
test("user can parse and save constraints", async ({ page }) => {
  await page.goto("/");
  await page.fill(
    '[data-testid="constraint-input"]',
    "Team A cannot play on Mondays"
  );
  await page.click('[data-testid="parse-button"]');
  await expect(page.locator('[data-testid="confidence-score"]')).toBeVisible();
});
```

## 🤖 ML/NLP Contributions

### Adding New Constraint Types

1. **Update type definitions** in `lib/types.ts`
2. **Add parsing logic** in `lib/nlp/huggingface-parser.ts`
3. **Update confidence scoring** methodology
4. **Add test cases** with example constraints
5. **Update documentation**

### Improving ML Models

- **Experiment with different models** on Hugging Face
- **Implement A/B testing** for model comparison
- **Add performance metrics** and monitoring
- **Document model changes** and performance impacts

### Adding New Entity Types

```typescript
// 1. Update EntityType enum
export type EntityType =
  | "team"
  | "venue"
  | "time"
  | "date"
  | "day_of_week"
  | "number"
  | "capacity_indicator"
  | "time_period"
  | "condition"
  | "new_entity_type"; // Add your new type

// 2. Add extraction logic
const extractNewEntityType = (text: string): EntityData[] => {
  // Implementation
};

// 3. Add to main extraction function
```

## 🎨 UI/UX Contributions

### Design System

- **Follow established patterns** in existing components
- **Use consistent spacing** (Tailwind spacing scale)
- **Maintain accessibility standards** (WCAG 2.1 AA)
- **Test on multiple devices** and screen sizes

### Adding New Components

1. **Create component** in appropriate directory
2. **Add TypeScript interfaces** for props
3. **Implement accessibility features**
4. **Add to Storybook** (if applicable)
5. **Write tests** for component behavior

### Improving Existing Components

- **Maintain backward compatibility**
- **Add new props** with default values
- **Update tests** to cover new functionality
- **Update documentation**

## 🗄 Database Contributions

### Schema Changes

1. **Create migration script** in SQL format
2. **Update TypeScript types** to match schema
3. **Add database tests** for new functionality
4. **Document breaking changes**

### Adding New Tables

```sql
-- Example migration
CREATE TABLE new_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
```

### API Endpoint Changes

- **Update API routes** to handle new data
- **Add proper validation** and error handling
- **Update TypeScript types**
- **Add API tests**

## 📚 Documentation

### Code Documentation

- **Add JSDoc comments** for complex functions
- **Document API endpoints** with examples
- **Keep README updated** with new features
- **Update CHANGELOG** for releases

```typescript
/**
 * Parses natural language constraint text using ML models
 * @param text - The constraint text to parse
 * @param options - Parsing options and configuration
 * @returns Promise resolving to parsed constraint data
 * @throws {ParseError} When parsing fails
 */
export async function parseConstraint(
  text: string,
  options: ParseOptions = {}
): Promise<ParsedConstraint> {
  // Implementation
}
```

### User Documentation

- **Update user guides** for new features
- **Add screenshots** for UI changes
- **Create video tutorials** for complex features
- **Maintain FAQ** section

## 🐛 Issue Guidelines

### Reporting Bugs

Use the bug report template and include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected vs actual behavior**
- **Environment details** (OS, browser, Node version)
- **Screenshots or videos** if applicable

### Feature Requests

Use the feature request template and include:

- **Clear description** of the proposed feature
- **Use case** and motivation
- **Proposed implementation** (if you have ideas)
- **Alternatives considered**

### Labels

We use these labels to categorize issues:

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `documentation` - Improvements or additions to docs
- `ml/nlp` - Related to machine learning or NLP
- `ui/ux` - User interface or experience
- `database` - Database related
- `api` - API related

## 🔄 Pull Request Process

### Before Submitting

- [ ] **Tests pass** locally
- [ ] **Code is formatted** and linted
- [ ] **Documentation updated** if needed
- [ ] **Commit messages** follow conventional format
- [ ] **PR description** explains changes clearly

### PR Template

Use this template for your PR description:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)

Add screenshots for UI changes

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### Review Process

1. **Automated checks** must pass (CI/CD)
2. **Code review** by maintainers
3. **Testing** in staging environment
4. **Approval** from at least one maintainer
5. **Merge** to main branch

## 🚀 Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Update version** in `package.json`
2. **Update CHANGELOG** with release notes
3. **Create release tag** on GitHub
4. **Deploy to production**
5. **Announce release** in community channels

## 🆘 Getting Help

### Community Support

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Discord/Slack**: Real-time community chat (if available)

### Maintainer Contact

For urgent issues or security concerns, contact maintainers directly:

- GitHub: @Ark-Ntech

## 🙏 Recognition

We value all contributions! Contributors will be:

- **Listed in CONTRIBUTORS.md**
- **Mentioned in release notes**
- **Invited to maintainer team** (for significant contributions)

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

**Thank you for contributing to the Sports Scheduling Constraint Parser!** 🎉

Your contributions help make sports scheduling more efficient and accessible for organizations worldwide.
