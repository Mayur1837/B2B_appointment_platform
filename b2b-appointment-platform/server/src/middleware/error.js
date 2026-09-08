export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err?.code === 11000)
    return res
      .status(409)
      .json({ message: "A record with that unique value already exists" });
  if (err?.name === "ValidationError")
    return res.status(400).json({
      message: "Validation failed",
      details: Object.values(err.errors).map((x) => x.message),
    });
  res
    .status(err.statusCode || 500)
    .json({ message: err.message || "Internal server error" });
}
