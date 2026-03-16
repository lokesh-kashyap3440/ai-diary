import { AuthForm } from "../../components/auth-form";

export default function RegisterPage() {
  return (
    <main className="page-shell">
      <section className="hero" style={{ maxWidth: 860 }}>
        <span className="muted">Create your account</span>
        <h1>Give your diary a name and start writing with context.</h1>
        <p>
          Registration uses the same magic-link flow, but it now saves your display name
          and gives you a cleaner first-run path into the app.
        </p>
      </section>
      <AuthForm mode="register" />
    </main>
  );
}
