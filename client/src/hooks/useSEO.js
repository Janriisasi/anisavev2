import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getSEOForPath, SITE_URL } from "../lib/seoConfig";

function setMeta(attr, key, content) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Keeps <title>, meta description, meta robots, canonical link, and the
 * JS-visible Open Graph tags in sync with the current route.
 *
 * This app is a client-only SPA served from one index.html, so crawlers
 * or scrapers that don't execute JS (most social-share bots) always see
 * the static tags baked into index.html. This hook only updates what
 * JS-rendering crawlers (Googlebot, etc.) see after the app mounts —
 * index.html's static tags remain the safe, generic fallback for
 * everything else.
 */
export default function useSEO() {
  const location = useLocation();

  useEffect(() => {
    const seo = getSEOForPath(location.pathname);
    const canonicalUrl = `${SITE_URL}${location.pathname}`;

    document.title = seo.title;
    setMeta("name", "description", seo.description);
    setMeta("name", "robots", seo.index ? "index, follow" : "noindex, nofollow");
    setCanonical(canonicalUrl);

    setMeta("property", "og:title", seo.title);
    setMeta("property", "og:description", seo.description);
    setMeta("property", "og:url", canonicalUrl);
  }, [location.pathname]);
}