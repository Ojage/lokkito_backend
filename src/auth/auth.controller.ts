import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, UserProfile } from './auth.service';
import { Request } from 'express';

// DTOs for request/response validation
export class UpdateProfileDto {
  name?: string;
  picture?: string;
}

export class AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Custom decorator to get current user
export const CurrentUser = (req: Request): any => {
  return req.user;
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Get current user profile
   * Requires valid JWT token
   */
  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request): Promise<AuthResponse> {
    try {
      const user = req.user as any;
      const auth0User = await this.authService.getUserProfile(user.userId);
      const permissions = await this.authService.getUserPermissions(
        user.userId,
      );

      const profile = this.authService.createUserProfile(
        auth0User,
        permissions,
      );

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: profile,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to retrieve profile');
    }
  }

  /**
   * Update current user profile
   * Requires valid JWT token
   */
  @Patch('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: Request,
    @Body() updateData: UpdateProfileDto,
  ): Promise<AuthResponse> {
    try {
      const user = req.user as any;
      const updatedUser = await this.authService.updateUserProfile(
        user.userId,
        updateData,
      );

      return {
        success: true,
        message: 'Profile updated successfully',
        data: {
          userId: updatedUser.user_id,
          email: updatedUser.email,
          name: updatedUser.name,
          picture: updatedUser.picture,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to update profile');
    }
  }

  /**
   * Get user permissions
   * Requires valid JWT token
   */
  @Get('permissions')
  @UseGuards(AuthGuard('jwt'))
  async getPermissions(@Req() req: Request): Promise<AuthResponse> {
    try {
      const user = req.user as any;
      const permissions = await this.authService.getUserPermissions(
        user.userId,
      );

      return {
        success: true,
        message: 'Permissions retrieved successfully',
        data: { permissions },
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to retrieve permissions');
    }
  }

  /**
   * Validate token endpoint
   * Useful for client-side token validation
   */
  @Post('validate')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async validateToken(@Req() req: Request): Promise<AuthResponse> {
    const user = req.user as any;

    return {
      success: true,
      message: 'Token is valid',
      data: {
        userId: user.userId,
        email: user.email,
        permissions: user.permissions,
      },
    };
  }

  /**
   * Logout endpoint
   * Revokes user session
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request): Promise<AuthResponse> {
    try {
      const user = req.user as any;
      await this.authService.revokeUserSession(user.userId);

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      return {
        success: true,
        message: 'Logged out successfully', // Always return success for logout
      };
    }
  }

  /**
   * Get user by ID (admin endpoint)
   * Requires valid JWT token and admin permissions
   */
  @Get('users/:userId')
  @UseGuards(AuthGuard('jwt'))
  async getUserById(
    @Param('userId') userId: string,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    try {
      const currentUser = req.user as any;

      // Check if user is accessing their own profile or has admin permissions
      if (
        currentUser.userId !== userId &&
        !this.authService.hasPermission(currentUser.permissions, 'read:users')
      ) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      const auth0User = await this.authService.getUserProfile(userId);
      const permissions = await this.authService.getUserPermissions(userId);

      const profile = this.authService.createUserProfile(
        auth0User,
        permissions,
      );

      return {
        success: true,
        message: 'User retrieved successfully',
        data: profile,
      };
    } catch (error) {
      throw new UnauthorizedException('Failed to retrieve user');
    }
  }

  /**
   * Health check endpoint for auth service
   */
  @Get('health')
  async healthCheck(): Promise<AuthResponse> {
    return {
      success: true,
      message: 'Auth service is healthy',
      data: {
        timestamp: new Date().toISOString(),
        service: 'auth',
      },
    };
  }

  /**
   * Get Auth0 login URL (for frontend integration)
   */
  @Get('login-url')
  getLoginUrl(): AuthResponse {
    const auth0Domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const redirectUri =
      process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback';
    const audience = process.env.AUTH0_AUDIENCE;

    const loginUrl =
      `https://${auth0Domain}/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=openid profile email&` +
      `audience=${encodeURIComponent(audience)}`;

    return {
      success: true,
      message: 'Login URL generated successfully',
      data: { loginUrl },
    };
  }

  /**
   * Get Auth0 logout URL (for frontend integration)
   */
  @Get('logout-url')
  getLogoutUrl(): AuthResponse {
    const auth0Domain = process.env.AUTH0_DOMAIN;
    const clientId = process.env.AUTH0_CLIENT_ID;
    const returnTo = process.env.AUTH0_LOGOUT_URL || 'http://localhost:3000';

    const logoutUrl =
      `https://${auth0Domain}/v2/logout?` +
      `client_id=${clientId}&` +
      `returnTo=${encodeURIComponent(returnTo)}`;

    return {
      success: true,
      message: 'Logout URL generated successfully',
      data: { logoutUrl },
    };
  }
}
