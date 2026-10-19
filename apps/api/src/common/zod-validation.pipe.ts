import { BadRequestException, PipeTransform } from "@nestjs/common";
import { z, ZodError } from "zod";

/**
 * Wraps a zod schema in a Nest pipe so controllers get parsed, typed input.
 * Usage: @Body(new ZodBody(signUpSchema)) body: SignUpInput
 */
export class ZodBody<T extends z.ZodTypeAny> implements PipeTransform {
    constructor(private readonly schema: T) { }

    transform(value: unknown): z.infer<T> {
        const result = this.schema.safeParse(value);
        if (!result.success) {
            throw new BadRequestException({
                code: "VALIDATION_ERROR",
                message: "Invalid request body",
                details: this.format(result.error),
            });
        }
        return result.data;
    }

    private format(err: ZodError) {
        return err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
        }));
    }
}