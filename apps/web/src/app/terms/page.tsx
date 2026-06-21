import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using AskBase ("the Service"), you agree to be bound by these Terms of Service. If you are using the Service on behalf of a company or other legal entity, you represent that you have authority to bind that entity to these terms. If you do not agree to these terms, do not use the Service.`,
  },
  {
    title: "2. Description of Service",
    body: `AskBase provides a software platform that allows businesses to create, deploy, and manage AI-powered chat assistants grounded in their own knowledge base. The Service includes the AskBase dashboard, embeddable widget, API access, and related features as described on our website.`,
  },
  {
    title: "3. Account Registration",
    body: `You must register for an account to use most features of the Service. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.`,
  },
  {
    title: "4. Acceptable Use",
    body: `You may not use the Service to: (a) violate any applicable law or regulation; (b) infringe any intellectual property rights; (c) transmit harmful, fraudulent, or deceptive content; (d) attempt to gain unauthorized access to any system or network; (e) interfere with or disrupt the integrity or performance of the Service; (f) collect or harvest personal data without proper consent; or (g) use the Service to build a competing product.`,
  },
  {
    title: "5. Your Content",
    body: `You retain full ownership of all documents, text, and data you upload to the Service ("Your Content"). By uploading Your Content, you grant AskBase a limited, non-exclusive licence to process and store that content solely to provide the Service to you. We do not use Your Content to train our AI models. You are solely responsible for ensuring Your Content does not violate any laws or third-party rights.`,
  },
  {
    title: "6. Subscription and Payment",
    body: `Paid plans are billed monthly or annually as selected at purchase. All fees are in EUR and exclusive of applicable taxes. You authorise AskBase to charge your payment method on a recurring basis. Failure to pay may result in suspension or termination of your account. We reserve the right to change our pricing with 30 days' written notice.`,
  },
  {
    title: "7. Free Plan",
    body: `The Free plan provides 100 conversations per day at no charge, with no time limit. We reserve the right to modify the Free plan limits with 30 days' notice. The Free plan is intended for genuine product use; automated abuse or systematic scraping may result in account termination.`,
  },
  {
    title: "8. Intellectual Property",
    body: `AskBase and its licensors retain all rights, title, and interest in and to the Service, including all software, designs, and documentation. Nothing in these terms grants you any ownership rights in the Service. All feedback you provide to us may be used by AskBase without restriction or compensation.`,
  },
  {
    title: "9. Data Privacy",
    body: `Our collection and use of personal data is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to our data practices as described in the Privacy Policy.`,
  },
  {
    title: "10. Confidentiality",
    body: `Each party agrees to keep confidential any non-public information disclosed by the other party that is designated as confidential or that reasonably should be understood to be confidential. This obligation does not apply to information that becomes publicly available through no fault of the receiving party.`,
  },
  {
    title: "11. Disclaimers",
    body: `The Service is provided "as is" and "as available" without warranties of any kind, express or implied. AskBase does not warrant that the Service will be uninterrupted, error-free, or that AI-generated responses will be accurate. AI responses are generated automatically and should not be relied upon as professional legal, financial, or medical advice.`,
  },
  {
    title: "12. Limitation of Liability",
    body: `To the maximum extent permitted by law, AskBase shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability to you for any claim shall not exceed the fees you paid to AskBase in the 12 months preceding the claim.`,
  },
  {
    title: "13. Termination",
    body: `You may terminate your account at any time from your dashboard settings. AskBase may suspend or terminate your account if you violate these terms, with or without notice. Upon termination, your right to use the Service ceases immediately. We will delete your data within 30 days of termination unless required by law to retain it.`,
  },
  {
    title: "14. Governing Law",
    body: `These Terms shall be governed by and construed in accordance with the laws of the European Union and the Republic of Ireland, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Dublin, Ireland, unless otherwise required by applicable consumer protection law.`,
  },
  {
    title: "15. Changes to Terms",
    body: `We may update these Terms from time to time. We will notify you of material changes by email or in-app notice at least 14 days before they take effect. Continued use of the Service after changes become effective constitutes acceptance of the revised Terms.`,
  },
  {
    title: "16. Contact",
    body: `For questions about these Terms, contact us at legal@askbase.io or write to AskBase, Inc., Dublin, Ireland.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background antialiased">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32">

        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Legal</p>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-14">Last updated: January 2026</p>

        <div className="space-y-10">
          {sections.map(({ title, body }) => (
            <div key={title}>
              <h2 className="text-base font-semibold text-foreground mb-3">{title}</h2>
              <p className="text-[15px] text-foreground/65 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

      </main>
      <Footer />
    </div>
  );
}
