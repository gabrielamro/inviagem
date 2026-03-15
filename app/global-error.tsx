'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#020202', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 24, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ color: '#f87171', marginBottom: 8 }}>Erro no carregamento</h1>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24, maxWidth: 400, textAlign: 'center' }}>{error.message}</p>
        <button
          onClick={reset}
          style={{ padding: '12px 24px', background: '#10b981', color: '#000', border: 'none', borderRadius: 9999, fontWeight: 500, cursor: 'pointer' }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
