import { AppError } from "../utils/AppError.js";
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });
  if (!result.success)
    return next(
      new AppError(result.error.issues.map((i) => i.message).join(", "), 400),
    );
  req.body = result.data.body;
  req.params = result.data.params;
  req.query = result.data.query;
  next();
};
