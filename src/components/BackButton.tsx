import Link from "next/link";

export default function BackButton() {
  return (
    <Link
      href="/"
      className="text-sm text-muted hover:text-ink transition-colors"
    >
      ← Back
    </Link>
  );
}
