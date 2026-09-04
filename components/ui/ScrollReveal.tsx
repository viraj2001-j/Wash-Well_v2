"use client";

import React, { useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  variant?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "zoom-in" | "scale-up";
  delay?: number;
  duration?: number;
  className?: string;
}

export default function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 600,
  className = "",
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const getVariantStyles = () => {
    if (!isVisible) {
      switch (variant) {
        case "fade-up":
          return "opacity-0 translate-y-10";
        case "fade-down":
          return "opacity-0 -translate-y-10";
        case "fade-left":
          return "opacity-0 translate-x-10";
        case "fade-right":
          return "opacity-0 -translate-x-10";
        case "zoom-in":
          return "opacity-0 scale-90";
        case "scale-up":
          return "opacity-0 scale-95 translate-y-6";
        default:
          return "opacity-0 translate-y-10";
      }
    }
    return "opacity-100 translate-y-0 translate-x-0 scale-100";
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
      }}
      className={`transition-all ease-out ${getVariantStyles()} ${className}`}
    >
      {children}
    </div>
  );
}

