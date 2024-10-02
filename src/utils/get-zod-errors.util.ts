import { ZodError } from "zod";

export const getZodErrors = (error: ZodError) => {
  const errorMessageStrings = error.errors.map((error) => {
    return error.message;
  });

  const issues: Record<string, string> = {};

  error.errors.map((error) => {
    issues[error.path[0]] = error.message;
  });

  return {
    message: errorMessageStrings.join(", "),
    issues: issues,
  };
};
