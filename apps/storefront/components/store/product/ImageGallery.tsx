// apps/storefront/components/store/product/ImageGallery.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

interface ImageGalleryProps {
  images: string[];
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState("center");

  // Mobile Embla carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const initCarousel = () => {
      setActiveIndex(emblaApi.selectedScrollSnap());
    };
    const frame = requestAnimationFrame(initCarousel);
    emblaApi.on("select", onSelect);
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [emblaApi, onSelect]);

  const selectImage = (index: number) => {
    setActiveIndex(index);
    if (emblaApi) emblaApi.scrollTo(index);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const handleMouseEnter = () => setIsZoomed(true);
  const handleMouseLeave = () => {
    setIsZoomed(false);
    setZoomOrigin("center");
  };

  return (
    <div className="w-full flex flex-col gap-3 select-none">
      
      {/* Main image container */}
      <div
        className="w-full aspect-square rounded-[var(--radius-lg)] border border-[var(--ag-gray-200)] overflow-hidden bg-[var(--ag-gray-100)] relative cursor-zoom-in hidden md:block"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Image
          src={images[activeIndex]}
          alt="Product details"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="w-full h-full object-cover transition-transform duration-100 ease-linear"
          style={{
            transformOrigin: zoomOrigin,
            transform: isZoomed ? "scale(2)" : "scale(1)",
          }}
        />
      </div>

      {/* Mobile view swiper (Embla Carousel) */}
      <div className="overflow-hidden w-full aspect-square border border-[var(--ag-gray-200)] rounded-[var(--radius-lg)] bg-[var(--ag-gray-100)] md:hidden" ref={emblaRef}>
        <div className="flex h-full">
          {images.map((img, i) => (
            <div key={i} className="flex-[0_0_100%] min-w-0 h-full relative">
              <Image src={img} alt="" fill sizes="100vw" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => selectImage(i)}
              className={`w-16 h-16 rounded-[var(--radius-sm)] border-2 bg-[var(--ag-gray-100)] overflow-hidden shrink-0 transition-all ${
                i === activeIndex ? "border-[var(--ag-red)] shadow-sm" : "border-[var(--ag-gray-200)]"
              }`}
            >
              <Image src={img} alt="" width={64} height={64} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

    </div>
  );
}
