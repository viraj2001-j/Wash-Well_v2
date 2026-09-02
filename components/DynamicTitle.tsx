"use client";

import { useEffect } from "react";

export default function DynamicTitle() {
  useEffect(() => {
    const titles = [
      "Wash & Well",
      "Wash-Well Delivery Management System",
    ];

    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % titles.length;
      document.title = titles[index];
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return null;
}