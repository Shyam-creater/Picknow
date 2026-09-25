import React, { useEffect, useLayoutEffect } from "react";

const Heading = ({ title, description, keywords, url, type, image, card, canonical, schemaMarkup }) => {
  // Use useLayoutEffect for canonical to ensure it's in the HTML before paint
  useLayoutEffect(() => {
    // Update document title
    document.title = title;

    // Add canonical URL first (for SEO)
    if (canonical) {
      let canonicalLink = document.querySelector(`link[rel="canonical"]`);
      if (!canonicalLink) {
        canonicalLink = document.createElement("link");
        canonicalLink.rel = "canonical";
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;
    } else {
      // If no canonical is provided, remove any existing canonical to avoid stale values
      const existingCanonical = document.querySelector(`link[rel="canonical"]`);
      if (existingCanonical && existingCanonical.parentNode) {
        existingCanonical.parentNode.removeChild(existingCanonical);
      }
    }
  }, [title, canonical]);

  useEffect(() => {
    // Update document title and meta tags
    document.title = title;

    const metaTags = {
      //   viewport: "width=device-width, initial-scale=1",
      keywords: keywords,
      description: description,
      //   'google-site-verification': '6FZyF2_Ah7j5YoCkb-uFO4cEsIrLWYEyAyeiS791Fd8'
    };
    Object.entries(metaTags).forEach(([name, content]) => {
      // console.log("metaname", name);
      // console.log("metaname", content);
      let meta = document.querySelector(`meta[name="${name}"]`);
      // console.log("==============", meta);
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    });

    // Open Graph meta tags
    const ogTags = {
      "og:title": title,
      "og:description": description,
      "og:url": url || canonical,
      "og:type": type,
      "og:image": image,
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      if (content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.setAttribute("property", property);
          document.head.appendChild(meta);
        }
        meta.content = content;
      }
    });

    // Twitter meta tags
    const twitterTags = {
      "twitter:card": card,
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": image,
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      if (content) {
        let meta = document.querySelector(`meta[name="${name}"]`);
        if (!meta) {
          meta = document.createElement("meta");
          meta.name = name;
          document.head.appendChild(meta);
        }
        meta.content = content;
      }
    });

    // Canonical is handled in useLayoutEffect above
  }, [title, description, keywords, url, type, image, card]);

  useEffect(() => {
    // Inject JSON-LD schema markup if provided
    const existing = document.getElementById("ld-json-schema");
    if (existing) {
      existing.parentNode.removeChild(existing);
    }
    if (schemaMarkup) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "ld-json-schema";
      try {
        // Accept both string and object inputs
        const json = typeof schemaMarkup === "string" ? schemaMarkup : JSON.stringify(schemaMarkup);
        script.text = json;
      } catch (e) {
        // Fallback: do not inject invalid JSON
      }
      document.head.appendChild(script);
    }
  }, [schemaMarkup]);

  return null;
};

export default Heading;
