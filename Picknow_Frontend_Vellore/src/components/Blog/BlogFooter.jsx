import { Fragment } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import "./BlogFooter.css";
import picknowLogo from "../../assets/PicknowLogo.png";

const BlogFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Fragment>
      <section className="blog-footer-section">
        <div className="row g-4 g-md-5 border-bottom" data-aos="fade-up">
          <div className="col-lg-5 col-md-12">
            <h1>Let's make something great work together.</h1>
          </div>
          <div className="col-lg-2 col-md-4">
            <h5>Company</h5>
            <ul>
              <li>
                <a href="/" className="link link-hover">
                  Home
                </a>
              </li>
              <li>
                <a href="/" className="link link-hover">
                  Shop
                </a>
              </li>
              <li>
                <a href="/vendor" className="link link-hover">
                  Be a seller
                </a>
              </li>
            </ul>
          </div>
          <div className="col-lg-2 col-md-4">
            <h5>Social Media</h5>
            <ul>
              <li>
                <a
                  href="https://www.facebook.com/picknow001/"
                  className="link link-hover"
                  target="_blank"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://x.com/picknow00/" className="link link-hover">
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/picknow001/"
                  className="link link-hover"
                >
                  Instagram
                </a>
              </li>
            </ul>
          </div>
          <div className="col-lg-3 col-md-4">
            <div className="blog-footer-logo">
              <Link to="/" className="">
                <img
                  src={picknowLogo}
                  style={{ width: "10rem" }}
                  alt="PickNow"
                />
              </Link>
            </div>
            <div className="contact-no">
              <h5>Contact</h5>
              <h6>+91 7092770118</h6>
            </div>
            <div className="email mt-4">
              <h5>Send a message</h5>
              <h6>support@picknow.in</h6>
            </div>
          </div>
          <div className="d-flex justify-content-end blog-copyright">
            <p className="fw-normal">Copyright {currentYear} © Picknow</p>
          </div>
        </div>
      </section>
    </Fragment>
  );
};
export default BlogFooter;
