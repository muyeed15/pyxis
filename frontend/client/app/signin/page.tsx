import type { Metadata } from "next";
import SignInWrapper from "./signinwrapper";

export const metadata: Metadata = {
  title: "Sign In - Pyxis",
  description: "Sign in to your Pyxis account",
};

export default function SignInPage() {
  return <SignInWrapper />;
}