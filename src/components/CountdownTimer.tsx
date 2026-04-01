interface CountdownTimerProps {
  targetTime: number;
}

export function CountdownTimer({ targetTime }: CountdownTimerProps) {
  if (targetTime <= 0) return null;

  const totalSeconds = Math.ceil(targetTime / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex items-center justify-center gap-3 py-2.5 px-4 rounded-2xl"
      style={{ background: 'hsl(0 70% 50% / 0.08)', border: '2px solid hsl(0 70% 50% / 0.15)' }}
    >
      <span className="text-xs text-muted-foreground">⏱ Keyingi suv</span>
      <span className="text-lg font-bold tabular-nums text-foreground tracking-tight">
        {String(minutes).padStart(2, '0')}
        <span className="animate-soft-pulse" style={{ color: 'hsl(0 75% 50%)' }}>:</span>
        {String(seconds).padStart(2, '0')}
      </span>
      <span className="text-xs text-muted-foreground">🌱 O'smoqda</span>
    </div>
  );
}
