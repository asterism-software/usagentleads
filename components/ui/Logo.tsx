import Image from "next/image"

// Brand mark — renders /public/icon.svg directly so the source of truth stays
// in one file. Use in the navbar and anywhere the full-color logo is needed.
// SVGs are not optimized by the Next.js image optimizer, so `unoptimized` is
// set to avoid unnecessary processing while still using next/image.
export function LogoIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <Image
      src="/icon.svg"
      alt=""
      aria-hidden="true"
      width={96}
      height={96}
      unoptimized
      className={className}
    />
  )
}
