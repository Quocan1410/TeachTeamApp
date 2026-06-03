import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/database";
import { User, UserType } from "../entities/User";
import { UserSecurityAnswer } from "../entities/UserSecurityAnswer";
import {
    SECURITY_QUESTION_COUNT,
    getQuestionById,
    isValidQuestionId,
} from "../config/securityQuestions";
import { PasswordResetService } from "./PasswordResetService";

export interface SecurityAnswerInput {
    questionId: string;
    answer: string;
}

const normalizeAnswer = (answer: string): string =>
    answer.trim().toLowerCase();

export class SecurityQuestionService {
    private answerRepo = AppDataSource.getRepository(UserSecurityAnswer);
    private userRepo = AppDataSource.getRepository(User);

    static validateSecurityAnswersInput(
        answers: unknown
    ): { isValid: boolean; errors: Record<string, string>; parsed: SecurityAnswerInput[] } {
        const errors: Record<string, string> = {};

        if (!Array.isArray(answers)) {
            return {
                isValid: false,
                errors: { securityAnswers: "Security questions are required" },
                parsed: [],
            };
        }

        if (answers.length !== SECURITY_QUESTION_COUNT) {
            errors.securityAnswers = `Please set exactly ${SECURITY_QUESTION_COUNT} security questions`;
        }

        const parsed: SecurityAnswerInput[] = [];
        const usedQuestionIds = new Set<string>();

        for (let i = 0; i < answers.length; i++) {
            const item = answers[i] as SecurityAnswerInput;
            const questionId = String(item?.questionId || "").trim();
            const answer = String(item?.answer || "");

            if (!questionId || !isValidQuestionId(questionId)) {
                errors[`securityAnswers.${i}.questionId`] = "Invalid security question";
                continue;
            }
            if (usedQuestionIds.has(questionId)) {
                errors.securityAnswers = "Each security question must be different";
            }
            usedQuestionIds.add(questionId);

            const normalized = normalizeAnswer(answer);
            if (normalized.length < 2) {
                errors[`securityAnswers.${i}.answer`] =
                    "Answer must be at least 2 characters";
            } else if (normalized.length > 100) {
                errors[`securityAnswers.${i}.answer`] =
                    "Answer must be at most 100 characters";
            }

            parsed.push({ questionId, answer });
        }

        if (usedQuestionIds.size !== SECURITY_QUESTION_COUNT) {
            errors.securityAnswers = `Please set exactly ${SECURITY_QUESTION_COUNT} different security questions`;
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
            parsed,
        };
    }

    async saveAnswers(
        userId: number,
        answers: SecurityAnswerInput[]
    ): Promise<void> {
        await this.answerRepo.delete({ userId });

        const saltRounds = 10;
        for (const { questionId, answer } of answers) {
            const answerHash = await bcrypt.hash(
                normalizeAnswer(answer),
                saltRounds
            );
            await this.answerRepo.save(
                this.answerRepo.create({
                    userId,
                    questionId,
                    answerHash,
                })
            );
        }
    }

    private async findEligibleUser(email: string): Promise<User | null> {
        const user = await this.userRepo.findOne({
            where: { email: email.trim().toLowerCase() },
        });
        if (!user || user.userType === UserType.ADMIN || user.isBlocked) {
            return null;
        }
        return user;
    }

    async getChallengeForEmail(
        email: string
    ): Promise<
        | { ok: true; questions: { questionId: string; text: string }[] }
        | { ok: false; message: string }
    > {
        const user = await this.findEligibleUser(email);
        if (!user) {
            return {
                ok: false,
                message:
                    "We could not find an account with recovery questions for that email.",
            };
        }

        const rows = await this.answerRepo.find({
            where: { userId: user.id },
            order: { id: "ASC" },
        });

        if (rows.length < SECURITY_QUESTION_COUNT) {
            return {
                ok: false,
                message:
                    "This account has no security questions on file. Sign in or contact an administrator.",
            };
        }

        const questions = rows.map((row) => {
            const def = getQuestionById(row.questionId);
            return {
                questionId: row.questionId,
                text: def?.text || row.questionId,
            };
        });

        return { ok: true, questions };
    }

    async verifyAndIssueResetToken(
        email: string,
        answers: SecurityAnswerInput[]
    ): Promise<
        | { ok: true; resetToken: string; resetUrl: string }
        | { ok: false; message: string; errors?: Record<string, string> }
    > {
        const validation = SecurityQuestionService.validateSecurityAnswersInput(
            answers
        );
        if (!validation.isValid) {
            return {
                ok: false,
                message: "Please answer all security questions",
                errors: validation.errors,
            };
        }

        const user = await this.findEligibleUser(email);
        if (!user) {
            return {
                ok: false,
                message: "Incorrect answers. Please try again or sign in.",
            };
        }

        const stored = await this.answerRepo.find({ where: { userId: user.id } });
        if (stored.length < SECURITY_QUESTION_COUNT) {
            return {
                ok: false,
                message: "Incorrect answers. Please try again or sign in.",
            };
        }

        const submittedByQuestion = new Map(
            validation.parsed.map((a) => [a.questionId, a.answer])
        );

        for (const row of stored) {
            const submitted = submittedByQuestion.get(row.questionId);
            if (!submitted) {
                return {
                    ok: false,
                    message: "Incorrect answers. Please try again or sign in.",
                };
            }
            const matches = await bcrypt.compare(
                normalizeAnswer(submitted),
                row.answerHash
            );
            if (!matches) {
                return {
                    ok: false,
                    message: "Incorrect answers. Please try again or sign in.",
                };
            }
        }

        const passwordResetService = new PasswordResetService();
        const { rawToken, resetUrl } =
            await passwordResetService.createResetTokenForUser(user.id);

        return { ok: true, resetToken: rawToken, resetUrl };
    }
}
