interface WaveformProps {
  levels: number[];
}

export function Waveform({ levels }: WaveformProps) {
  return (
    <div
      className="flex h-12 items-center justify-center gap-1"
      role="img"
      aria-label="রেকর্ডিং চলছে — শব্দের তরঙ্গ"
    >
      {levels.map((level, i) => (
        <span
          key={i}
          className="w-1 rounded-full bg-khata-red transition-[height] duration-75 ease-out"
          style={{ height: `${8 + level * 40}px` }}
        />
      ))}
    </div>
  );
}
