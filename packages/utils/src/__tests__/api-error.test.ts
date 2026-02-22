import { describe, it, expect } from "vitest";
import { ApiError, handleApiError } from "../http/api-error.js";

/**
 * Test suite for ApiError class and error handling utilities.
 * Tests error creation, user messages, and error handler function.
 */

describe("ApiError", () => {
  it("creates error with status, statusText, and body", () => {
    const error = new ApiError(404, "Not Found", { error: "Resource not found" });
    
    expect(error.status).toBe(404);
    expect(error.statusText).toBe("Not Found");
    expect(error.body).toEqual({ error: "Resource not found" });
    expect(error.name).toBe("ApiError");
    expect(error.message).toContain("404");
    expect(error.message).toContain("Not Found");
  });

  it("creates error with primitive body", () => {
    const error = new ApiError(500, "Internal Server Error", "Something went wrong");
    
    expect(error.status).toBe(500);
    expect(error.body).toBe("Something went wrong");
  });

  it("creates error with null body", () => {
    const error = new ApiError(204, "No Content", null);
    
    expect(error.body).toBeNull();
  });

  it("has proper error name and message", () => {
    const error = new ApiError(400, "Bad Request", {});
    
    expect(error.name).toBe("ApiError");
    expect(error.message).toBe("API Error 400: Bad Request");
  });
});

describe("ApiError.fromResponse", () => {
  it("creates ApiError from response data", () => {
    const error = ApiError.fromResponse(403, "Forbidden", { error: "Access denied" });
    
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(403);
    expect(error.statusText).toBe("Forbidden");
    expect(error.body).toEqual({ error: "Access denied" });
  });

  it("creates error from response with string body", () => {
    const error = ApiError.fromResponse(422, "Unprocessable Entity", "Validation failed");
    
    expect(error.status).toBe(422);
    expect(error.body).toBe("Validation failed");
  });
});

describe("ApiError.getUserMessage", () => {
  it("returns error message from body when present", () => {
    const error = new ApiError(400, "Bad Request", { error: "Invalid input" });
    
    expect(error.getUserMessage()).toBe("Invalid input");
  });

  it("returns friendly message for 400 Bad Request", () => {
    const error = new ApiError(400, "Bad Request", {});
    
    expect(error.getUserMessage()).toBe("Invalid request. Please check your input.");
  });

  it("returns friendly message for 401 Unauthorized", () => {
    const error = new ApiError(401, "Unauthorized", {});
    
    expect(error.getUserMessage()).toBe("You must be logged in to perform this action.");
  });

  it("returns friendly message for 403 Forbidden", () => {
    const error = new ApiError(403, "Forbidden", {});
    
    expect(error.getUserMessage()).toBe("You do not have permission to perform this action.");
  });

  it("returns friendly message for 404 Not Found", () => {
    const error = new ApiError(404, "Not Found", {});
    
    expect(error.getUserMessage()).toBe("The requested resource was not found.");
  });

  it("returns friendly message for 409 Conflict", () => {
    const error = new ApiError(409, "Conflict", {});
    
    expect(error.getUserMessage()).toBe("This action conflicts with existing data.");
  });

  it("returns friendly message for 500 Internal Server Error", () => {
    const error = new ApiError(500, "Internal Server Error", {});
    
    expect(error.getUserMessage()).toBe("An internal server error occurred. Please try again later.");
  });

  it("returns generic message for unknown status codes", () => {
    const error = new ApiError(418, "I'm a teapot", {});
    
    expect(error.getUserMessage()).toBe("An unexpected error occurred.");
  });

  it("prefers body error message over default messages", () => {
    const error = new ApiError(500, "Internal Server Error", { error: "Database connection failed" });
    
    expect(error.getUserMessage()).toBe("Database connection failed");
  });

  it("handles body without error property", () => {
    const error = new ApiError(404, "Not Found", { message: "Not found" });
    
    expect(error.getUserMessage()).toBe("The requested resource was not found.");
  });
});

describe("handleApiError", () => {
  it("handles ApiError and returns user message", () => {
    const error = new ApiError(404, "Not Found", { error: "User not found" });
    
    expect(handleApiError(error)).toBe("User not found");
  });

  it("handles standard Error and returns message", () => {
    const error = new Error("Network error");
    
    expect(handleApiError(error)).toBe("Network error");
  });

  it("handles unknown error types", () => {
    const result = handleApiError("string error");
    
    expect(result).toBe("An unexpected error occurred");
  });

  it("handles null error", () => {
    const result = handleApiError(null);
    
    expect(result).toBe("An unexpected error occurred");
  });

  it("handles undefined error", () => {
    const result = handleApiError(undefined);
    
    expect(result).toBe("An unexpected error occurred");
  });

  it("handles object errors", () => {
    const result = handleApiError({ code: "ERR_NETWORK" });
    
    expect(result).toBe("An unexpected error occurred");
  });
});

describe("ApiError integration scenarios", () => {
  it("handles typical API failure flow", () => {
    const error = ApiError.fromResponse(401, "Unauthorized", {});
    const userMessage = handleApiError(error);
    
    expect(userMessage).toBe("You must be logged in to perform this action.");
  });

  it("handles validation error with custom message", () => {
    const error = ApiError.fromResponse(400, "Bad Request", {
      error: "Email is required",
    });
    
    expect(handleApiError(error)).toBe("Email is required");
  });

  it("creates distinct error instances", () => {
    const error1 = new ApiError(404, "Not Found", {});
    const error2 = new ApiError(404, "Not Found", {});
    
    expect(error1).not.toBe(error2);
  });
});
