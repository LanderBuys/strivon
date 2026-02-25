export function sanitizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

export function mapAuthError(message: string): string {
  if (message.includes("auth/user-not-found") || message.includes("auth/wrong-password"))
    return "Invalid email or password.";
  if (message.includes("auth/invalid-email")) return "Please enter a valid email.";
  if (message.includes("auth/too-many-requests")) return "Too many attempts. Try again later.";
  if (message.includes("auth/network-request-failed")) return "Network error. Check your connection.";
  if (message.includes("auth/email-already-in-use")) return "This email is already registered.";
  if (message.includes("auth/weak-password")) return "Password should be at least 6 characters.";
  return "Something went wrong. Please try again.";
}
