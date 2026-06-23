import React from "react";
import { Helmet } from "react-helmet-async";

/**
 * Reusable SEO Component using react-helmet-async
 * Renders complete title, meta tags, Open Graph (og:*), Twitter cards, canonical tags, and structured JSON-LD data.
 *
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.description - Meta description
 * @param {string} props.keywords - Meta keywords (comma-separated)
 * @param {string} [props.image] - Custom preview image URL
 * @param {string} [props.canonicalUrl] - Custom canonical URL (defaults to window.location.href)
 * @param {string} [props.ogType] - Open Graph type (defaults to 'website')
 * @param {Object|Object[]} [props.schema] - JSON-LD schema object(s) to inject
 */
export default function SEO({
  title,
  description,
  keywords,
  image,
  canonicalUrl,
  ogType = "website",
  schema,
}) {
  const siteName = "PustakMart";
  const defaultTitle = "PustakMart - Verified Student Academic Marketplace";
  const defaultDescription = "Buy, sell, and request academic textbooks directly from peers on your campus. Save up to 70% with zero commission fees.";
  const defaultKeywords = "pustakmart, second hand books, engineering books, college textbooks, buy books on campus, student books exchange";
  const defaultImage = "https://ik.imagekit.io/cuq3fe9wm/PustakMart/logo.jpg";

  const seoTitle = title ? `${title} | ${siteName}` : defaultTitle;
  const seoDescription = description || defaultDescription;
  const seoKeywords = keywords || defaultKeywords;
  const seoImage = image || defaultImage;
  const seoCanonical = canonicalUrl || window.location.href;

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{seoTitle}</title>
      <meta name="description" content={seoDescription} />
      <meta name="keywords" content={seoKeywords} />
      <link rel="canonical" href={seoCanonical} />

      {/* Open Graph / Facebook / LinkedIn */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={seoTitle} />
      <meta property="og:description" content={seoDescription} />
      <meta property="og:image" content={seoImage} />
      <meta property="og:url" content={seoCanonical} />
      <meta property="og:type" content={ogType} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seoTitle} />
      <meta name="twitter:description" content={seoDescription} />
      <meta name="twitter:image" content={seoImage} />

      {/* Structured JSON-LD Data Injection */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
