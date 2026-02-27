import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  describe('canActivate', () => {
    it('should be defined', () => {
      expect(guard).toBeDefined();
    });

    it('should extend AuthGuard with jwt strategy', () => {
      expect(guard).toBeInstanceOf(AuthGuard('jwt'));
    });

    it('should allow access with valid JWT token', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer valid-token',
            },
            user: { userId: 'test-id', username: 'testuser' },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      // Mock the parent canActivate method
      jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockResolvedValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny access without authorization header', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {},
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException());

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should deny access with invalid token', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer invalid-token',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException('Invalid token'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should deny access with expired token', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer expired-token',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException('Token expired'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow('Token expired');
    });

    it('should handle malformed authorization header', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'InvalidFormat token',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new UnauthorizedException('Invalid authorization format'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should handle exception during validation', async () => {
      const mockContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer token',
            },
          }),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest
        .spyOn(AuthGuard('jwt').prototype, 'canActivate')
        .mockRejectedValue(new Error('Validation error'));

      await expect(guard.canActivate(mockContext)).rejects.toThrow('Validation error');
    });
  });

  describe('handleRequest', () => {
    const mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ headers: {} }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;

    it('should return user when validation succeeds', () => {
      const mockUser = { userId: 'test-id', username: 'testuser' };

      // Access the handleRequest method from parent class
      const result = guard.handleRequest(null, mockUser, null, mockContext);

      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => guard.handleRequest(null, null, null, mockContext)).toThrow(UnauthorizedException);
    });

    it('should throw error when info is provided', () => {
      const info = new Error('Token validation failed');

      expect(() => guard.handleRequest(null, null, info, mockContext)).toThrow();
    });

    it('should throw original error when error is provided', () => {
      const error = new UnauthorizedException('Custom auth error');

      expect(() => guard.handleRequest(error, null, null, mockContext)).toThrow('Custom auth error');
    });
  });
});
