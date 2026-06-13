---
name: api-guidelines
description: Use when designing, implementing, or reviewing HTTP APIs to keep contracts simple, explicit, testable, and backward-compatible.
license: MIT
---

# API Guidelines

Use these guidelines when designing, implementing, or reviewing HTTP APIs.

## 1. Start With the Contract

Define the API shape before implementation:
- Method and path
- Request body, query parameters, and headers
- Response body and status codes
- Authentication and authorization requirements
- Error responses

If any of these are unclear, ask before coding.

## 2. Keep Endpoints Simple

Prefer the smallest API that solves the current need:
- Do not add optional fields, filters, or modes that were not requested
- Do not introduce custom abstractions when standard HTTP semantics are enough
- Prefer predictable resource names over clever routing
- Keep one endpoint focused on one job

## 3. Make Errors Explicit

Return errors that clients can act on:
- Use appropriate HTTP status codes
- Include a stable machine-readable error code when useful
- Include a short human-readable message
- Do not leak secrets, stack traces, or internal implementation details

## 4. Preserve Compatibility

Avoid breaking existing clients:
- Add fields instead of renaming or removing fields
- Keep response types stable
- Version the API when a breaking change is unavoidable
- Document deprecations before removing behavior

## 5. Verify the Contract

Tests should prove the API contract works:
- Happy-path request and response
- Invalid input behavior
- Authentication or authorization behavior when relevant
- Backward-compatibility expectations for existing endpoints

Before finishing, check that documentation, examples, and tests match the implemented behavior.
