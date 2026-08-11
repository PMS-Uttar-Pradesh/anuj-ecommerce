import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0F0F10] text-neutral-400 pt-16 pb-8 select-none">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 border-b border-white/[0.07] pb-12">

        {/* Column 1: Brand */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2.5 w-fit group">
            <Image
              src="/logo.jpg"
              alt="Personal Marketing Store Logo"
              width={112}
              height={56}
              className="h-14 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
            />
            <div className="flex flex-col">
              <span className="text-xl font-display font-black tracking-tight leading-none text-white">
                Personal Marketing Store
              </span>
            </div>
          </Link>
          <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">
            Curating premium writing instruments, refined journals, and professional tools for students and artists who appreciate the art of fine writing.
          </p>
        </div>

        {/* Column 2: Delivery & Returns */}
        <div className="lg:col-span-2 lg:col-start-7 flex flex-col gap-4">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">
            Delivery &amp; Returns
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm font-medium text-neutral-500">
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Shipping Policy</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Easy Returns &amp; Exchanges</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Track Your Order</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Delivery FAQs</Link></li>
          </ul>
        </div>

        {/* Column 3: Programs */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">
            Our Programs
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm font-medium text-neutral-500">
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Affiliate Program</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Rewards Club</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Bulk &amp; Corporate Orders</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Gift Cards</Link></li>
          </ul>
        </div>

        {/* Column 4: Company Info */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">
            Company Info
          </h3>
          <ul className="flex flex-col gap-2.5 text-sm font-medium text-neutral-500">
            <li><Link href="/" className="hover:text-white transition-colors duration-150">About Us</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Careers</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors duration-150">Contact Us</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors duration-150">Our Retail Stores</Link></li>
          </ul>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">

        <div className="text-xs font-medium text-neutral-600">
          © {currentYear} Personal Marketing Store. All Rights Reserved.
        </div>

        {/* Payment methods */}
        <div className="flex items-center gap-4 bg-white/[0.04] px-4 py-2 rounded-full border border-white/[0.07]">
          <span className="text-[10px] font-bold uppercase text-neutral-600 tracking-wider">Payments:</span>
          <span className="text-xs font-medium text-neutral-500">Visa</span>
          <span className="text-xs font-medium text-neutral-500">Mastercard</span>
          <span className="text-xs font-medium text-neutral-500">UPI</span>
          <span className="text-xs font-medium text-neutral-500">Razorpay</span>
        </div>

        {/* Social links */}
        <div className="flex items-center gap-3">
          <Link
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-neutral-600 hover:text-white hover:border-white/25 transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
            </svg>
          </Link>
          <Link
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-neutral-600 hover:text-white hover:border-white/25 transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
            </svg>
          </Link>
          <Link
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Twitter / X"
            className="w-8 h-8 rounded-full border border-white/[0.08] flex items-center justify-center text-neutral-600 hover:text-white hover:border-white/25 transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </Link>
        </div>

      </div>
    </footer>
  );
}
