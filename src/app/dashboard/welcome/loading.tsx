// Shown while the welcome flow is on its way: a plain page, not the feed's skeleton (the
// dashboard's loading.tsx), which would show a header and grid this page doesn't have
export default function WelcomeLoading() {
  return (
    <div className="min-h-dvh bg-page" role="status">
      <span className="sr-only">Loading</span>
    </div>
  );
}
