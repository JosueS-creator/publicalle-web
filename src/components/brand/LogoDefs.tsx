/** Gradientes metálicos del logo aprobado. `id` se sufija para permitir múltiples logos en la página. */
export function LogoDefs({ uid, theme }: { uid: string; theme: "light" | "dark" }) {
  const dark = theme === "dark";
  return (
    <>
      <linearGradient id={`gn-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={dark ? "#0D3B8A" : "#0A2F72"} />
        <stop offset=".45" stopColor={dark ? "#114AA6" : "#0B3C8C"} />
        <stop offset=".72" stopColor={dark ? "#2C8BE6" : "#1B6FC8"} />
        <stop offset="1" stopColor={dark ? "#0A2F72" : "#062457"} />
      </linearGradient>
      <linearGradient id={`gt-${uid}`} x1="1" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1FB8AE" />
        <stop offset=".35" stopColor="#46E3CF" />
        <stop offset=".75" stopColor="#14A69B" />
        <stop offset="1" stopColor="#0C7E7A" />
      </linearGradient>
      <linearGradient id={`gf-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#083B6E" />
        <stop offset="1" stopColor="#0A6C70" />
      </linearGradient>
      <linearGradient id={`gw-${uid}`} x1="0" y1="0" x2="0" y2="1">
        {dark ? (
          <>
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset=".55" stopColor="#E3ECFA" />
            <stop offset="1" stopColor="#A9C3EA" />
          </>
        ) : (
          <>
            <stop offset="0" stopColor="#0D4A9E" />
            <stop offset=".5" stopColor="#1667C4" />
            <stop offset="1" stopColor="#062C6A" />
          </>
        )}
      </linearGradient>
      <radialGradient id={`gs-${uid}`} cx="0.85" cy="0.35" r="0.5">
        <stop offset="0" stopColor="#7FD0FF" stopOpacity=".55" />
        <stop offset="1" stopColor="#7FD0FF" stopOpacity="0" />
      </radialGradient>
    </>
  );
}
