import Link from "next/link";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  forbidden: "Esta cuenta de Google no tiene acceso al panel.",
  state: "La sesión de inicio caducó. Vuelve a intentarlo.",
  exchange: "No se pudo completar el inicio de sesión con Google.",
  google: "Inicio de sesión cancelado.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? "No se pudo iniciar sesión.") : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-(--radius-card) border border-border bg-surface p-8 shadow-2xl shadow-black/40">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-3xl">
            🐾
          </div>
          <h1 className="text-xl font-bold tracking-tight">Patica Admin</h1>
          <p className="mt-1 text-sm text-muted">Panel de administración</p>
        </div>

        {message && (
          <div className="mb-5 rounded-(--radius-button) border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            {message}
          </div>
        )}

        <Link
          href="/api/auth/login"
          prefetch={false}
          className="flex w-full items-center justify-center gap-3 rounded-(--radius-button) bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-200"
        >
          <GoogleIcon />
          Continuar con Google
        </Link>

        <p className="mt-6 text-center text-xs text-subtle">
          Acceso restringido al equipo de Patica.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
