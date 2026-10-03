import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Mail } from "lucide-react";


import "../public/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      {/* TOP CTA */}
      <div className="footer-cta">
        <div className="footer-cta-content" data-animate>
          <span className="footer-eyebrow">READY TO TAKE CONTROL?</span>

          <h2>
            Turn your leads into
            <span> real opportunities.</span>
          </h2>

          <p>
            Manage every lead, follow-up and meeting from one simple workspace
            built for modern sales teams.
          </p>

          <Link to="/signup" className="footer-cta-button">
            Start for free
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>

      {/* MAIN FOOTER */}
      <div className="footer-main">
        <div className="footer-container footer-container--centered">
          {/* BRAND */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="footer-logo-mark">L</span>
              <span>LeadFlow</span>
            </Link>

            <p>
              Intelligent lead tracking and CRM management for businesses that
              want to stay organized and close more deals.
            </p>

            <a href="mailto:solutiontcp@gmail.com" className="footer-email">
              <Mail size={16} />
              solutiontcp@gmail.com
            </a>


          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <p>
            © {new Date().getFullYear()} LeadFlow. Powered by{" "}
            <a href="https://tcpitsolution.in" target="_blank" rel="noreferrer" className="footer-powered-link">
              TCP IT Solution
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
