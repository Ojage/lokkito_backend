import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface Auth0User {
  user_id: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  created_at: string;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  userId: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
  permissions?: string[];
}

@Injectable()
export class AuthService {
  private readonly auth0Domain: string;
  private readonly auth0ClientId: string;
  private readonly auth0ClientSecret: string;
  private readonly auth0Audience: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.auth0Domain = this.configService.get<string>('AUTH0_DOMAIN');
    this.auth0ClientId = this.configService.get<string>('AUTH0_CLIENT_ID');
    this.auth0ClientSecret = this.configService.get<string>(
      'AUTH0_CLIENT_SECRET',
    );
    this.auth0Audience = this.configService.get<string>('AUTH0_AUDIENCE');
  }

  /**
   * Get Management API access token for Auth0 operations
   */
  async getManagementToken(): Promise<string> {
    try {
      const response = await axios.post(
        `https://${this.auth0Domain}/oauth/token`,
        {
          client_id: this.auth0ClientId,
          client_secret: this.auth0ClientSecret,
          audience: `https://${this.auth0Domain}/api/v2/`,
          grant_type: 'client_credentials',
        },
      );

      return response.data.access_token;
    } catch (error) {
      throw new UnauthorizedException('Failed to get management token');
    }
  }

  /**
   * Get user profile from Auth0
   */
  async getUserProfile(userId: string): Promise<Auth0User> {
    try {
      const managementToken = await this.getManagementToken();

      const response = await axios.get(
        `https://${this.auth0Domain}/api/v2/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${managementToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new UnauthorizedException('User not found');
      }
      throw new UnauthorizedException('Failed to fetch user profile');
    }
  }

  /**
   * Update user profile in Auth0
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<{ name: string; picture: string }>,
  ): Promise<Auth0User> {
    try {
      const managementToken = await this.getManagementToken();

      const response = await axios.patch(
        `https://${this.auth0Domain}/api/v2/users/${userId}`,
        updates,
        {
          headers: {
            Authorization: `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new BadRequestException('Failed to update user profile');
    }
  }

  /**
   * Get user permissions from Auth0
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const managementToken = await this.getManagementToken();

      const response = await axios.get(
        `https://${this.auth0Domain}/api/v2/users/${userId}/permissions`,
        {
          headers: {
            Authorization: `Bearer ${managementToken}`,
          },
        },
      );

      return response.data.map((permission: any) => permission.permission_name);
    } catch (error) {
      throw new UnauthorizedException('Failed to fetch user permissions');
    }
  }

  /**
   * Validate and decode JWT token
   */
  async validateToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Create user profile object from Auth0 data
   */
  createUserProfile(auth0User: Auth0User, permissions?: string[]): UserProfile {
    return {
      userId: auth0User.user_id,
      email: auth0User.email,
      name: auth0User.name,
      picture: auth0User.picture,
      emailVerified: auth0User.email_verified,
      permissions: permissions || [],
    };
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(
    userPermissions: string[],
    requiredPermission: string,
  ): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of the required permissions
   */
  hasAnyPermission(
    userPermissions: string[],
    requiredPermissions: string[],
  ): boolean {
    return requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );
  }

  /**
   * Find user by ID (if you have local database integration)
   */
  async findUserById(userId: string): Promise<any> {
    // This would integrate with your local database
    // For now, we'll fetch from Auth0
    return this.getUserProfile(userId);
  }

  /**
   * Revoke user session (logout)
   */
  async revokeUserSession(userId: string): Promise<void> {
    try {
      const managementToken = await this.getManagementToken();

      await axios.post(
        `https://${this.auth0Domain}/api/v2/device-credentials`,
        {},
        {
          headers: {
            Authorization: `Bearer ${managementToken}`,
          },
          params: {
            user_id: userId,
          },
        },
      );
    } catch (error) {
      throw new BadRequestException('Failed to revoke user session');
    }
  }
}
