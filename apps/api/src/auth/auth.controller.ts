import { Body, Controller, Get, Headers, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a local development user" })
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post("login")
  @ApiOperation({ summary: "Login with the local development user" })
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Return the authenticated user profile" })
  getMe(@Headers("authorization") authorization?: string) {
    return this.authService.getProfile(authorization);
  }
}
