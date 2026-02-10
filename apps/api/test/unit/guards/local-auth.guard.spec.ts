import { Test, TestingModule } from '@nestjs/testing';
import { LocalAuthGuard } from '../../../src/modules/auth/guards/local-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocalAuthGuard],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  describe('canActivate', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should extend AuthGuard with local strategy', () => {
      expect(guard).toBeInstanceOf(AuthGuard('local'));
    });

    it('should allow access with valid credentials', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            body: {
              username: 'validuser',
              password: 'validpassword',
            },
            user: { userId: 'test-id', username: 'validuser' },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(AuthGuard('local').prototype, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny access with invalid credentials', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            body: {
              username: 'invaliduser',
              password: 'wrongpassword',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('local').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should deny access when username is missing', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            body: {
              password: 'somepassword',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('local').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException('Missing credentials'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow('Missing credentials');
    });

    it('should deny access when password is missing', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            body: {
              username: 'someuser',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('local').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException('Missing credentials'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should deny access for disabled user', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            body: {
              username: 'disableduser',
              password: 'correctpassword',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('local').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException('User is disabled'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow('User is disabled');
    });

    it('should handle exception during authentication', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            body: {
              username: 'user',
              password: 'pass',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('local').prototype, 'canActivate')
        .mockRejectedValue(new Error('Database connection error'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow('Database connection error');
    });
  });

  describe('handleRequest', () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ body: {} }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    it('should return user when authentication succeeds', () => {
      const mockUser = {
        userId: 'test-id',
        username: 'testuser',
        role: { code: 'admin' },
      };

      const result = guard.handleRequest(null, mockUser, null, mockContext);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => guard.handleRequest(null, null, null, mockContext)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with message when info is provided', () => {
      const info = { message: 'Invalid username or password' };

      expect(() => guard.handleRequest(null, null, info, mockContext)).toThrow(UnauthorizedException);
    });

    it('should throw original error when error is provided', () => {
      const error = new Error('Custom authentication error');

      expect(() => guard.handleRequest(error, null, null, mockContext)).toThrow('Custom authentication error');
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => guard.handleRequest(null, undefined, null, mockContext)).toThrow(UnauthorizedException);
    });

    it('should throw error with info message when both error and info exist', () => {
      const error = new Error('Base error');
      const info = { message: 'Additional info' };

      expect(() => guard.handleRequest(error, null, info, mockContext)).toThrow();
    });
  });
});
