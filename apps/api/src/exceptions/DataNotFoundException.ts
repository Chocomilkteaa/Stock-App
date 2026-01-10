/**
 * Custom exception for when requested data is not found.
 * This exception should be thrown when a service cannot find
 * the requested resource from either the database or external sources.
 *
 * Controllers should catch this exception and return a 404 HTTP response.
 */
export class DataNotFoundException extends Error {
  // HTTP status code for this exception type
  public readonly statusCode: number = 404;

  // Name of the exception for identification in error handling
  public readonly name: string = "DataNotFoundException";

  /**
   * Creates a new DataNotFoundException.
   * @param message - Descriptive message explaining what data was not found
   */
  constructor(message: string) {
    super(message);

    // Maintain proper stack trace (only available on V8 engines like Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, DataNotFoundException);
    }
  }
}
