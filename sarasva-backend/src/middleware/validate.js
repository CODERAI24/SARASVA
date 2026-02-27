import ApiError from "../utils/ApiError.js";

/**
 * Factory that returns an Express middleware which validates req.body
 * against a Zod schema.
 *
 * Usage in a route file:
 *   import { validate } from "../middleware/validate.js";
 *   import { markAttendanceSchema } from "../validators/attendance.validator.js";
 *   router.post("/mark", protect, validate(markAttendanceSchema), markAttendance);
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return next(new ApiError(400, message));
    }

    req.body = result.data; // replace with coerced/validated data
    next();
  };
}
