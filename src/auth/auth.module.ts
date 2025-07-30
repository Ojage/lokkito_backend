import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('AUTH0_CLIENT_SECRET'),
        audience: configService.get<string>('AUTH0_AUDIENCE'),
        issuer: `https://${configService.get<string>('AUTH0_DOMAIN')}/`,
        signOptions: {
          expiresIn: '1h', // Token expiration time
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule], // Export services for use in other modules
})
export class AuthModule {}
