/** An error whose message is safe and useful to show to the shop user. */
export class AppError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}
