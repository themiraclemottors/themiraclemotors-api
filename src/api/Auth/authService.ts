import { SignupData } from "./authInterface";
import { Roles } from "./../Role/roleModel";
import { Users } from "./../User";
import uuidv4 from "uuid/v4";
import jwt from "jsonwebtoken";
import { AppError } from "./../../utils";
import { JWT_SECRET, JWT_EXPIRY_TIME, APP_URL } from "../../config";
import {
  PhoneNumberUtil,
  PhoneNumberFormat,
  PhoneNumber,
} from "google-libphonenumber";

import bcrypt from "bcrypt";
import { Not } from "typeorm";

export class AuthService {
  public loginUser = async ({ phoneNumber, password }) => {
    let { parsedPhoneNumber } = this.parsePhoneNumber(phoneNumber);

    const user = await Users.findOne({
      where: { phoneNumber: parsedPhoneNumber },
      select: ["id", "firstName", "lastName", "email", "password", "phoneNumber", "verified", "createdAt"],
      relations: ["roles"],
    });

    if (!user) {
      throw new AppError(
        "No user associated with that phone number!",
        null,
        404,
      );
    }

    /* Compare password against hash */
    if (bcrypt.compareSync(password, user.password)) {
      delete (user.password);
      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user);
      return { accessToken, refreshToken, user };
    }

    throw new AppError(
      "Invalid phone number or password entered!",
      null,
      404,
    );
  }

  public async registerUser(userData: SignupData) {
    let { parsedPhoneNumber, isValidPhoneNumber } = this.parsePhoneNumber(userData.phoneNumber);

    if (isValidPhoneNumber) {
      const exPhoneUser = await Users.findOne({ phoneNumber: parsedPhoneNumber });
      if (exPhoneUser) {
        throw new AppError(`An account with ${userData.phoneNumber} already exists!`);
      }

      const exEmailUser = await Users.findOne({ email: userData.email });
      if (exEmailUser) {
        throw new AppError(`An account with ${exEmailUser.email} already exists!`);
      }

      userData.phoneNumber = parsedPhoneNumber;
      userData.password = bcrypt.hashSync(userData.password, 10);

      let role: Roles;
      if (userData.roleId) {
        role = await Roles.findOneOrFail({
          where: [{
            id: userData.roleId,
            role: Not("admin"),
          }],
        }).catch(() => {
          throw new AppError("Invalid role selected");
        });
      } else {
        /* defaults to user role */
        role = await Roles.findOneOrFail({ role: "user" }).catch(() => {
          throw new AppError("Invalid role selected");
        });

      }

      const newUser = { roles: [role], ...userData };
      const user = await Users.create(newUser).save();
      user.save();

      const accessToken = this.generateAccessToken(user);
      const refreshToken = await this.generateRefreshToken(user);

      return { accessToken, refreshToken, user };
    }
    throw new AppError("Invalid phone number entered.");
  }

  public refreshTokens = async (refreshToken: string) => {
    const user = await Users.findOne({ refreshToken });
    if (user) {
      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = await this.generateRefreshToken(user);
      return { accessToken, refreshToken: newRefreshToken };
    }
    throw new AppError("Invalid refresh token sent", refreshToken, 404);
  }

  private parsePhoneNumber(phoneNumber: string) {
    const phoneNumberUtilInstance = PhoneNumberUtil.getInstance();
    let googlePhoneNumber: PhoneNumber;
    let parsedPhoneNumber: string;
    try {
      googlePhoneNumber = phoneNumberUtilInstance.parse(phoneNumber.toString(), "NG");
      parsedPhoneNumber = phoneNumberUtilInstance.format(googlePhoneNumber, PhoneNumberFormat.E164);
    } catch (error) {
      /* Handle errors thrown by phoneNumber parsing */
      throw new AppError(error.message);
    }
    const isValidPhoneNumber = phoneNumberUtilInstance.isValidNumberForRegion(googlePhoneNumber, "NG");
    return { isValidPhoneNumber, parsedPhoneNumber };
  }

  /**
   * Generates JWT from user details
   *
   * @private
   * @param {Users} user
   * @returns
   * @memberof AuthService
   */
  private generateAccessToken(user: Users) {
    const body = { id: user.id };
    const token = jwt.sign({ iss: APP_URL, user: body }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY_TIME,
    });
    return token;
  }

  private async generateRefreshToken(user: Users) {
    const refreshToken = uuidv4();
    user.refreshToken = refreshToken;
    await user.save();
    return refreshToken;
  }
}