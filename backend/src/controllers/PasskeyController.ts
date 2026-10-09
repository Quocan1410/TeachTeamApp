import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { PasskeyService } from "../services/passkeyService";
import { RefreshTokenService } from "../services/RefreshTokenService";
import { setAuthCookie, setRefreshCookie } from "../utils/authCookie";

export class PasskeyController {
    private userRepository = AppDataSource.getRepository(User);

    async registrationOptions(req: Request, res: Response): Promise<void> {
        const user = await this.currentUser(req);
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Access token is required",
            });
            return;
        }
        const result = await PasskeyService.registrationOptions(user);
        if (!result.ok) {
            res.status(result.status).json({
                success: false,
                message: result.message,
            });
            return;
        }
        res.status(200).json({ success: true, options: result.options });
    }

    async verifyRegistration(req: Request, res: Response): Promise<void> {
        const user = await this.currentUser(req);
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Access token is required",
            });
            return;
        }
        const result = await PasskeyService.verifyRegistration(user, req.body);
        if (!result.ok) {
            res.status(result.status).json({
                success: false,
                message: result.message,
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Passkey saved.",
        });
    }

    async loginOptions(_req: Request, res: Response): Promise<void> {
        const options = await PasskeyService.loginOptions();
        res.status(200).json({ success: true, options });
    }

    async verifyLogin(req: Request, res: Response): Promise<void> {
        const result = await PasskeyService.verifyLogin(req.body);
        if (!result.ok) {
            res.status(401).json({
                success: false,
                message: result.message,
            });
            return;
        }
        setAuthCookie(res, {
            userId: result.user.id,
            email: result.user.email,
            userType: result.user.userType,
        });
        const refreshToken = await RefreshTokenService.issue(result.user.id);
        setRefreshCookie(res, refreshToken);
        const { password: _password, ...userWithoutPassword } = result.user;
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: { user: userWithoutPassword },
        });
    }

    private async currentUser(req: Request): Promise<User | null> {
        const userId = req.user?.userId;
        if (!userId) return null;
        return this.userRepository.findOne({ where: { id: userId } });
    }
}
