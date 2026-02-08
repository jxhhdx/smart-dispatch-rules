import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../src/modules/auth/auth.controller';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { LoginDto } from '../../../src/modules/auth/dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    validateUser: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginDto: LoginDto = {
        username: 'admin',
        password: 'admin123',
      };

      const mockUser = {
        id: 'test-id',
        username: 'admin',
        email: 'admin@test.com',
      };

      const mockLoginResult = {
        access_token: 'mock-token',
        user: mockUser,
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);
      mockAuthService.login.mockResolvedValue(mockLoginResult);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockLoginResult);
      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.username,
        loginDto.password,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith(mockUser);
    });

    it('should throw error for invalid credentials', async () => {
      const loginDto: LoginDto = {
        username: 'admin',
        password: 'wrong',
      };

      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto)).rejects.toThrow();
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const mockReq = { user: { userId: 'test-id' } };
      mockAuthService.logout.mockResolvedValue({ success: true });

      const result = await controller.logout(mockReq as any);

      expect(result).toBeDefined();
      expect(mockAuthService.logout).toHaveBeenCalledWith('test-id');
    });
  });

  describe('GET /profile', () => {
    it('should return user profile', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'admin',
        email: 'admin@test.com',
      };

      const mockReq = { user: { userId: 'test-id' } };
      mockAuthService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockReq as any);

      expect(result).toEqual(mockUser);
      expect(mockAuthService.getProfile).toHaveBeenCalledWith('test-id');
    });
  });

  describe('POST /refresh', () => {
    it('should refresh token', async () => {
      const mockReq = { user: { userId: 'test-id' } };
      const mockResult = {
        access_token: 'new-token',
        user: { id: 'test-id' },
      };

      mockAuthService.refreshToken.mockResolvedValue(mockResult);

      const result = await controller.refreshToken(mockReq as any);

      expect(result).toEqual(mockResult);
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('test-id');
    });
  });
});
