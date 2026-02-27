# Testing Guide

This document describes how to run tests for the Smart Dispatch Rules API.

## 📁 Test Structure

```
test/
├── unit/                    # Unit tests
│   ├── auth/               # Authentication tests
│   ├── users/              # User management tests
│   ├── roles/              # Role management tests
│   ├── rules/              # Rule management tests
│   └── logs/               # Logging tests
├── e2e/                    # End-to-end tests
│   ├── auth.e2e-spec.ts
│   ├── users.e2e-spec.ts
│   ├── rules.e2e-spec.ts
│   └── app.e2e-spec.ts
└── utils/                  # Test utilities
    ├── test.module.ts
    ├── prisma.utils.ts
    └── mock.data.ts
```

## 🚀 Running Tests

### Run All Tests

```bash
npm test
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run E2E Tests Only

```bash
npm run test:e2e
```

### Run with Coverage

```bash
npm run test:cov
```

### Run in Watch Mode

```bash
npm run test:watch
```

### Using the Test Script

```bash
# Make script executable
chmod +x test/scripts/run-tests.sh

# Run all tests
./test/scripts/run-tests.sh

# Run specific test types
./test/scripts/run-tests.sh unit
./test/scripts/run-tests.sh e2e
./test/scripts/run-tests.sh coverage
./test/scripts/run-tests.sh watch
```

## 📝 Test Coverage

### Unit Tests Coverage

- ✅ **Auth Module**: Login, logout, token refresh, profile
- ✅ **Users Module**: CRUD, status management
- ✅ **Roles Module**: CRUD, permission assignment
- ✅ **Rules Module**: CRUD, versioning, publishing, simulation
- ✅ **Logs Module**: Operation logs, login logs

### E2E Tests Coverage

- ✅ **Authentication Flow**: Login → Access protected routes → Logout
- ✅ **User Management Flow**: Create → Read → Update → Delete
- ✅ **Rule Management Flow**: Create → Version → Publish → Simulate
- ✅ **Error Handling**: 404, 401, validation errors

## 🔧 Test Configuration

### Environment Variables

Create `.env.test` file:

```env
NODE_ENV=test
DATABASE_URL="your-test-database-url"
JWT_SECRET="test-secret-key"
PORT=3002
```

### Test Database

Tests use a separate database connection. The database is cleaned before each test.

⚠️ **Warning**: Use a dedicated test database, not production!

## 🛠️ Writing Tests

### Unit Test Example

```typescript
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should create user', async () => {
    const result = await service.create({
      username: 'test',
      email: 'test@test.com',
    });
    expect(result.username).toBe('test');
  });
});
```

### E2E Test Example

```typescript
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('/api/v1/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

## 📊 Test Utilities

### Mock Data

Use `MockData` from `test/utils/mock.data.ts`:

```typescript
import { MockData, generateRandomUser } from '../utils/mock.data';

// Use predefined data
MockData.users.admin
MockData.roles.superAdmin

// Generate random data
const user = generateRandomUser();
```

### Prisma Test Utils

Use `PrismaTestUtils` for database operations:

```typescript
import { PrismaTestUtils } from '../utils/prisma.utils';

const utils = new PrismaTestUtils();
await utils.cleanDatabase();
await utils.createTestUser({ ... });
```

## 🐛 Debugging Tests

### Verbose Output

```bash
npm test -- --verbose
```

### Specific Test File

```bash
npm test -- auth.service.spec.ts
```

### Debug Mode

Add `debugger` statement in test and run:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📈 Coverage Report

After running `npm run test:cov`, view the report:

```bash
open coverage/lcov-report/index.html
```

## ⚠️ Common Issues

### Database Connection Error

- Check `DATABASE_URL` in `.env.test`
- Ensure database is accessible
- Verify SSL mode settings

### Port Already in Use

- E2E tests use port 3002 by default
- Change `PORT` in `.env.test` if needed

### Timeout Errors

- Tests have 30s timeout
- Increase in `jest.config.js` if needed
- Check database connection speed

## 🔄 CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Release creation

See `.github/workflows/ci.yml` for configuration.
