# Cross-Project Integration Patterns

## Configuration Templates

### Standard Project Structure
```
├── .kiro/
│   ├── hooks/
│   │   ├── test-generation.yaml
│   │   ├── code-review.yaml
│   │   └── security-audit.yaml
│   ├── steering/
│   │   ├── code-quality.yaml
│   │   ├── security.yaml
│   │   └── architecture.yaml
│   └── specs/
│       ├── project-requirements.md
│       └── technical-specifications.md
```

## Customization Guidelines

### Adapting for Specific Projects
1. Copy universal configuration as baseline
2. Customize language-specific rules and conventions
3. Add project-specific business logic constraints
4. Configure environment-specific parameters
5. Set up project-specific integrations and tools
6. Define custom metrics and quality gates

This universal configuration provides a solid foundation that can be customized for any project type while maintaining consistency across your development workflow.