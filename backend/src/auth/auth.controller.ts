import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UsersService } from "../users/users.service";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService, private usersService: UsersService) {}

  @Post("login")
  login(@Body() body: LoginDto) {
    return this.authService.login(body.login, body.password);
  }

  @Post("register")
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  async me(@Req() req: any) {
    const payload = req.user; // { userId, role }
    try {
      const user = await this.usersService.findById(payload.userId);
      return {
        userId: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
      };
    } catch (e) {
      return payload;
    }
  }
}
