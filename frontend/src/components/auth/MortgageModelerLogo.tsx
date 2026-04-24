interface Props {
  size?: number;
}

export default function MortgageModelerLogo({ size = 40 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="MortgageModeler"
    >
      <rect width="64" height="64" rx="14" fill="#18181b" stroke="rgba(63,63,70,0.70)" strokeWidth="1" />
      <path
        d="M12 30L32 12L52 30"
        stroke="#34d399"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.4"
      />
      <rect x="17" y="38" width="7" height="14" rx="2" fill="#34d399" opacity="0.4" />
      <rect x="28.5" y="32" width="7" height="20" rx="2" fill="#34d399" opacity="0.7" />
      <rect x="40" y="26" width="7" height="26" rx="2" fill="#34d399" />
    </svg>
  );
}