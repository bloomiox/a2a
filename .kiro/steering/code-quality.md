# Code Quality Steering

## Coding Standards

### General Principles
- Follow language-specific best practices and conventions
- Maintain consistent naming conventions (camelCase, snake_case, PascalCase as appropriate)
- Write self-documenting code with descriptive variable and function names
- Keep functions small and focused on single responsibilities
- Avoid deep nesting (max 3-4 levels)
- Use meaningful comments for complex business logic only

## Error Handling

### Error Management Rules
- Always implement proper error handling and recovery
- Use specific error types rather than generic exceptions
- Log errors with appropriate context and severity levels
- Provide user-friendly error messages
- Implement graceful degradation for non-critical failures
- Never expose sensitive information in error messages

## Performance Optimization

### Performance Guidelines
- Optimize for readability first, then performance
- Use appropriate data structures for the use case
- Implement lazy loading where applicable
- Cache expensive operations and API calls
- Minimize network requests and payload sizes
- Profile and benchmark performance-critical code