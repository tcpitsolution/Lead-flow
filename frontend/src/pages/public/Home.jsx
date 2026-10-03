import Hero from "../../components/public/Hero";
import SEO from "../../components/SEO";
import { Helmet } from "react-helmet-async";

const LD_ORGANIZATION = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LeadFlow",
  url: "https://leadflow.tcpitsolution.in",
  logo: "https://leadflow.tcpitsolution.in/logo.png",
  contactPoint: { "@type": "ContactPoint", email: "solutiontcp@gmail.com", contactType: "customer support" },
};

const LD_WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LeadFlow",
  url: "https://leadflow.tcpitsolution.in",
};

const LD_SOFTWARE = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LeadFlow",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "LeadFlow is a simple CRM for lead management, sales pipeline tracking, follow-up reminders, and AI-powered lead scoring.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR", description: "Free plan available" },
  url: "https://leadflow.tcpitsolution.in",
};

const Home = () => {
  return (
    <div className="site">
      <SEO
        title="Simple CRM for Lead Management and Sales Tracking"
        description="LeadFlow is a simple CRM for lead management, sales pipeline tracking, follow-up reminders, and AI-powered lead scoring. Start free — no credit card required."
        canonical="/"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(LD_ORGANIZATION)}</script>
        <script type="application/ld+json">{JSON.stringify(LD_WEBSITE)}</script>
        <script type="application/ld+json">{JSON.stringify(LD_SOFTWARE)}</script>
      </Helmet>
      <Hero />
    </div>
  );
};

export default Home;
