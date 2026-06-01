import { useEffect } from 'react';

interface SeoProps {
  /** Full document title for this route. */
  title: string;
  /** Meta + OG description. Optional; falls back to the document default. */
  description?: string;
  /** Canonical path, e.g. "/courses". Defaults to the current pathname. */
  canonicalPath?: string;
  /** Absolute or root-relative OG image. Defaults to the document default. */
  image?: string;
}

type MetaAttr = 'name' | 'property';

function upsertMeta(attr: MetaAttr, key: string, content: string): void {
  const selector = `meta[${attr}="${key}"]`;
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Imperatively manages per-route head tags for this SPA. No SSR, so this runs
 * client-side after hydration. Restores the previous title on unmount so the
 * static index.html default is never permanently clobbered.
 */
export function Seo({ title, description, canonicalPath, image }: SeoProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const origin = window.location.origin;
    const url = origin + (canonicalPath ?? window.location.pathname);
    upsertCanonical(url);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:url', url);

    if (description) {
      upsertMeta('name', 'description', description);
      upsertMeta('property', 'og:description', description);
      upsertMeta('name', 'twitter:description', description);
    }
    if (image) {
      upsertMeta('property', 'og:image', image);
      upsertMeta('name', 'twitter:image', image);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonicalPath, image]);

  return null;
}

export default Seo;
