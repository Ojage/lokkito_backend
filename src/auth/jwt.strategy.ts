import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

export interface JwtPayload {
  sub: string; // Subject (user ID)
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  aud: string; // Audience
  iss: string; // Issuer
  iat: number; // Issued at
  exp: number; // Expires at
  scope?: string;
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('AUTH0_CLIENT_SECRET'),
      audience: configService.get<string>('AUTH0_AUDIENCE'),
      issuer: `https://${configService.get<string>('AUTH0_DOMAIN')}/`,
      algorithms: ['HS256'], // Auth0 typically uses RS256, but adjust based on your setup
    });
  }

  async validate(payload: JwtPayload): Promise<any> {
    // Validate the token payload
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing subject');
    }

    // Validate audience
    const expectedAudience = this.configService.get<string>('AUTH0_AUDIENCE');
    if (payload.aud !== expectedAudience) {
      throw new UnauthorizedException('Invalid token: incorrect audience');
    }

    // Validate issuer
    const expectedIssuer = `https://${this.configService.get<string>('AUTH0_DOMAIN')}/`;
    if (payload.iss !== expectedIssuer) {
      throw new UnauthorizedException('Invalid token: incorrect issuer');
    }

    // Optional: Check if user exists in your database
    // const user = await this.authService.findUserById(payload.sub);
    // if (!user) {
    //   throw new UnauthorizedException('User not found');
    // }

    // Return user object that will be attached to the request
    return {
      userId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified,
      permissions: payload.permissions || [],
      scope: payload.scope,
    };
  }
}
