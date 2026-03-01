import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";

vi.mock("../components/auth/LoginForm", () => ({
  LoginForm: () => <form data-testid="login-form">login form</form>,
}));

vi.mock("../components/auth/RegisterForm", () => ({
  RegisterForm: () => <form data-testid="register-form">register form</form>,
}));

describe("auth pages", () => {
  it("renders login page shell and form", () => {
    render(<LoginPage />);
    expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("renders register page shell and form", () => {
    render(<RegisterPage />);
    expect(screen.getByText("Create a new account")).toBeInTheDocument();
    expect(screen.getByTestId("register-form")).toBeInTheDocument();
  });
});
