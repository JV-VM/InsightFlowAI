import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { randomUUID, scrypt, timingSafeEqual } from "crypto";
import * as jwt from "jsonwebtoken";
import { promisify } from "util";
import { DatabaseService } from "../database/database.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
};

const scryptAsync = promisify(scrypt);

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  async register(payload: RegisterDto) {
    const email = payload.email.toLowerCase();
    const passwordHash = await this.hashPassword(payload.password);

    const result = await this.databaseService.query<UserRow>(
      `
        INSERT INTO app.users (id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, email, password_hash, role, created_at
      `,
      [randomUUID(), payload.name, email, passwordHash, payload.role ?? "ANALYST"],
    ).catch((error: { code?: string }) => {
      if (error.code === "23505") {
        throw new ConflictException("User already exists");
      }

      throw error;
    });

    const user = this.fromRow(result.rows[0]);

    return {
      token: this.signToken(user),
      user: this.toResponseUser(user),
    };
  }

  async login(payload: LoginDto) {
    const result = await this.databaseService.query<UserRow>(
      `
        SELECT id, name, email, password_hash, role, created_at
        FROM app.users
        WHERE email = $1
      `,
      [payload.email.toLowerCase()],
    );
    const user = result.rows[0] ? this.fromRow(result.rows[0]) : null;

    if (!user || !(await this.verifyPassword(payload.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      token: this.signToken(user),
      user: this.toResponseUser(user),
    };
  }

  async getProfile(authorizationHeader?: string) {
    if (!authorizationHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authorizationHeader.slice("Bearer ".length);
    const decoded = this.verifyToken(token);
    const result = await this.databaseService.query<UserRow>(
      `
        SELECT id, name, email, password_hash, role, created_at
        FROM app.users
        WHERE id = $1
      `,
      [decoded.sub],
    );
    const user = result.rows[0] ? this.fromRow(result.rows[0]) : null;

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return this.toResponseUser(user);
  }

  private signToken(user: UserRecord) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      this.getJwtSecret(),
      {
        expiresIn: "1h",
      },
    );
  }

  private getJwtSecret() {
    return process.env.JWT_SECRET ?? "change-me-in-phase-1";
  }

  private verifyToken(token: string) {
    try {
      return jwt.verify(token, this.getJwtSecret()) as { sub: string; email: string };
    } catch {
      throw new UnauthorizedException("Invalid bearer token");
    }
  }

  private async hashPassword(password: string) {
    const salt = randomUUID();
    const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  private async verifyPassword(password: string, passwordHash: string) {
    const [salt, storedKey] = passwordHash.split(":");

    if (!salt || !storedKey) {
      return false;
    }

    const storedKeyBuffer = Buffer.from(storedKey, "hex");
    const derivedKey = (await scryptAsync(password, salt, storedKeyBuffer.length)) as Buffer;

    return (
      storedKeyBuffer.length === derivedKey.length &&
      timingSafeEqual(storedKeyBuffer, derivedKey)
    );
  }

  private fromRow(row: UserRow): UserRecord {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: row.created_at.toISOString(),
    };
  }

  private toResponseUser(user: UserRecord) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
