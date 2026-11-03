import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function useAnimate() {
  const { pathname } = useLocation();
  useEffect(() => {
    const els = document.querySelectorAll("[data-animate]");
    els.forEach((el) => el.classList.remove("in-view"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);
}
