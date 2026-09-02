import Link from 'next/link';
import { LogoMark } from './LogoMark';

export function Logo() {
  return (
    <Link href="/" className="brand-logo" aria-label="SlivaPack — на главную">
      <LogoMark className="logo-mark" />
      <span className="logo-word">
        SLIVA<span className="logo-accent">PACK</span>
      </span>
    </Link>
  );
}