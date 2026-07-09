# Contributing to tauqeet-js

Thank you for contributing to tauqeet-js. This guide summarises the local workflow, coding conventions, and quality checks used by the project.

## Development Setup

```bash
git clone https://github.com/h-ghulam-hasnain/tauqeet-js.git
cd tauqeet-js
npm install
npm run dev
```

## Project Structure

```text
tauqeet-js/
├── src/
│   ├── index.ts
│   ├── prayers/
│   ├── qibla/
│   ├── moon/
│   ├── hijri/
│   ├── solar-alignment/
│   ├── astronomy/
│   └── internal/
├── tests/
├── manual_testing/
├── dist/
├── package.json
└── tsup.config.ts
```

## Build and Test

```bash
npm run build
npm test
npm run lint
```

## Coding Guidelines

- Keep public APIs stable and documented.
- Prefer named exports and explicit types.
- Use `readonly` for immutable config and result shapes.
- Add or update tests when changing behaviour.
- Keep astronomy and internal helpers private to the package surface.

## Adding a New Prayer Method

Prayer methods are registered in the prayer method registry. To add a new preset:

1. Update the method registry in [src/prayers/config/methodRegistry.ts](src/prayers/config/methodRegistry.ts).
2. Add a test in the prayer test suite.
3. Document the new preset in the relevant docs.

## Submitting Changes

1. Create a feature branch.
2. Make the change and verify it with the build and tests.
3. Open a pull request with a concise summary of the change.

## License

Contributions are licensed under the MIT License.
