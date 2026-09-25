import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { FaHome, FaClock, FaCalendar } from "react-icons/fa";
import { blogApi } from "../../APi/blog";
import BlogHeader from "./BlogHeader";
import BlogFooter from "./BlogFooter";
import "./BlogDetail.css";

// ✅ Dynamically add or update meta tag
const upsertMetaTag = (name, content) => {
  if (!content) return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

// ✅ Dynamically add or update canonical link
const setCanonicalLink = (href) => {
  if (!href) return;
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const BlogDetail = () => {
  const { canonicalUrl } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readingTime, setReadingTime] = useState(0);

  useEffect(() => {
    if (!canonicalUrl) {
      setError("Canonical URL missing in parameters");
      setLoading(false);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const data = await blogApi.getByCanonicalUrl(canonicalUrl);
        if (!isMounted) return;

        if (!data) throw new Error("Blog not found");

        setBlog(data);

        // Calculate reading time
        if (data.description) {
          const text = data.description.replace(/<[^>]*>/g, "");
          const words = text.trim().split(/\s+/).length;
          const time = Math.ceil(words / 200); // Average reading speed
          setReadingTime(time);
        }

        // ✅ SEO setup
        document.title = data?.metaTitle || data?.title || "Blog";
        upsertMetaTag("description", data?.metaDescription || "");
        upsertMetaTag(
          "keywords",
          Array.isArray(data?.metaTag)
            ? data.metaTag.join(", ")
            : data?.metaTag || ""
        );
        setCanonicalLink(window.location.href);
      } catch (err) {
        if (isMounted) setError(err?.message || "Failed to load blog details");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [canonicalUrl]);

  if (loading) {
    return (
      <div className="blog-loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-text">Loading blog details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="blog-error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2 className="error-title">Oops! Something went wrong</h2>
          <p className="error-message">{error}</p>
          <Link to="/blog" className="back-to-blog-btn">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="blog-error-container">
        <div className="error-content">
          <div className="error-icon">📄</div>
          <h2 className="error-title">Blog not found</h2>
          <p className="error-message">The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="back-to-blog-btn">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const canonicalFullUrl = `https://www.picknow.in/blog/${blog.canonicalUrl}`;
  const publishDate = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <section className="blog-detail-container">
      <Helmet>
        {blog.canonicalUrl && (
          <link rel="canonical" href={canonicalFullUrl} />
        )}
      </Helmet>

      <BlogHeader />

      {/* Hero Banner Section */}
      <div className="blog-hero-section">
        <div className="blog-hero-content">
          {/* Breadcrumb */}
          <nav className="breadcrumb-nav" aria-label="breadcrumb">
            <ol className="breadcrumb-list">
              <li className="breadcrumb-item">
                <Link to="/" className="breadcrumb-link">
                  <FaHome className="breadcrumb-icon" />
                  <span>Home</span>
                </Link>
              </li>
              <li className="breadcrumb-separator">/</li>
              <li className="breadcrumb-item">
                <Link to="/blog" className="breadcrumb-link">
                  Blog
                </Link>
              </li>
              <li className="breadcrumb-separator">/</li>
              <li className="breadcrumb-item active" aria-current="page">
                {blog.title}
              </li>
            </ol>
          </nav>

          {/* Blog Category/Tag */}
          <div className="blog-category">
            <span className="category-badge">Blog</span>
          </div>

          {/* Blog Title */}
          <h1 className="blog-title" data-aos="fade-up" data-aos-delay="200">
            {blog.title}
          </h1>

          {/* Blog Meta Info */}
          <div className="blog-meta" data-aos="fade-up" data-aos-delay="400">
            {publishDate && (
              <div className="meta-item">
                <FaCalendar className="meta-icon" />
                <span>{publishDate}</span>
              </div>
            )}
            {readingTime > 0 && (
              <>
                <div className="meta-divider">•</div>
                <div className="meta-item">
                  <FaClock className="meta-icon" />
                  <span>{readingTime} min read</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Featured Image */}
        {blog.image && (
          <div className="blog-featured-image" data-aos="fade-up" data-aos-delay="600">
            <div className="image-wrapper">
              <img
                src={blog.image}
                alt={blog.title || "Blog featured image"}
                className="featured-img"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>

      {/* Blog Content Section */}
      <div className="blog-content-section">
        <div className="blog-content-wrapper">
          {blog.description && (
            <article className="blog-article" data-aos="fade-up">
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: blog.description }}
              />
            </article>
          )}

          {/* Share & Navigation Section */}
          <div className="blog-footer-actions" data-aos="fade-up">
            <Link to="/blog" className="back-link">
              ← Back to all blogs
            </Link>
          </div>
        </div>
      </div>

      <BlogFooter />
    </section>
  );
};

export default BlogDetail;
