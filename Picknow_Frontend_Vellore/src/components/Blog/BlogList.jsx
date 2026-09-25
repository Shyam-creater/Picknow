import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { blogApi } from "../../APi/blog";
import "./BlogList.css";
import BlogHeader from "./BlogHeader";
import BlogFooter from "./BlogFooter";
import blogbanner from "../../assets/blog-banner.jpg";
import blogbannertwo from "../../assets/blog-banner2.jpg";

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const data = await blogApi.getAll();
        if (isMounted) setBlogs(Array.isArray(data) ? data : []);
      } catch (err) {
        if (isMounted) setError(err?.message || "Failed to load blogs");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // if (loading)
  //   return <div className="container py-5 text-center">Loading blogs...</div>;
  // if (error)
  //   return (
  //     <div className="container py-5 text-danger text-center">{error}</div>
  //   );

  return (
    <div className="blog-container">
      <BlogHeader />
      <div className="blog-banner">
        <div className="row d-flex justify-content-center align-items-center">
          <div className="col-md-1">
            <h6
              className="text-uppercase"
              data-aos="fade-up"
              data-aos-duration="800"
              data-aos-offset="200"
              data-aos-once="false"
            >
              blog
            </h6>
          </div>
          <div className="col-md-5">
            <h2 data-aos="fade-up" data-aos-delay="600">
              PickNow brings you quick insights,trends, and tips from the world
              of e-commerce helping you shop smart and sell smarter.
            </h2>
          </div>

          <div className="col-md-6">
            <div className="blog-banner-image">
              <img src={blogbanner} alt="blogbanner" data-aos="fade-down" />
            </div>
          </div>
        </div>
      </div>
      <div className="blog-about">
        <div className="row">
          <div className="col-lg-3 col-md-4" data-aos="blink-pop">
            <h1>Blogs</h1>
            <div className="blog-banner-image">
              <img src={blogbannertwo} alt="blogbanner" data-aos="blink-pop" />
            </div>
          </div>
          <div className="col-lg-9 col-md-8" data-aos="fade-left">
            <p>
              PickNow is your go-to destination for the latest insights in
              e-commerce — from online shopping trends and product reviews to
              business growth tips for digital sellers. Stay updated with expert
              guides, market updates, and innovative ideas to help you buy
              smarter and sell better in the fast-evolving world of e-commerce.
            </p>
            <p>
              PickNow is your ultimate e-commerce hub for everything related to
              online shopping and digital business. Discover the latest product
              trends, market insights, and expert tips to boost your online
              success. We bring you easy-to-read blogs packed with practical
              strategies and innovative ideas. Stay informed about what’s new in
              the e-commerce world — from startups to global brands. With
              PickNow, explore smarter ways to shop, sell, and grow online.
            </p>
          </div>
        </div>
      </div>
      <div className="blog-list-container">
        {blogs.length === 0 ? (
          <p className="text-center text-muted">No blogs found.</p>
        ) : (
          <div className="row g-4 d-flex justify-content-center blog-card-container">
            {blogs.map((b, index) => (
              <div
                className="col-md-6 col-lg-4"
                key={b._id}
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
                <div className="blog-card">
                  {b.image && (
                    <div className="blog-card-img-container">
                      <img
                        src={b.image}
                        alt={b.title || "Blog image"}
                        className=""
                      />
                    </div>
                  )}
                  <div className="blog-contents">
                    <h5>{b.title}</h5> {b.updatedAt && (
                      <p className="text-muted mb-2">
                        {new Date(b.updatedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                    <div
                      style={{
                        fontSize: "0.95rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                      dangerouslySetInnerHTML={{ __html: b.description }}
                    ></div>
                  </div>
                  <Link className="read-more" to={`/blog/${b.canonicalUrl}`}>
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
   
    </div>
  );
};

export default BlogList;
