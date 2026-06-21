import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

const sections = [
  {
    title: "1. Who We Are",
    body: `AskBase, Inc. ("AskBase", "we", "us", or "our") operates the AskBase platform at askbase.io. We are the data controller for personal data collected through our website and Service. If you have questions about this policy, contact us at privacy@askbase.io.`,
  },
  {
    title: "2. What Data We Collect",
    body: `We collect: (a) Account data — name, email address, and password when you register; (b) Billing data — payment method and transaction history, processed securely by our payment provider; (c) Usage data — which features you use, how often, and when; (d) Content data — documents and knowledge base files you upload; (e) Conversation data — chat logs between your widget and your end-users; (f) Technical data — IP address, browser type, device information, and cookies.`,
  },
  {
    title: "3. How We Use Your Data",
    body: `We use your data to: provide and improve the Service; process payments; send transactional emails (receipts, password resets, product updates); detect and prevent fraud or abuse; comply with legal obligations; and respond to your support requests. We do not use your uploaded documents or conversation data to train AI models.`,
  },
  {
    title: "4. Legal Basis for Processing (GDPR)",
    body: `For users in the European Economic Area, we process personal data under the following legal bases: Performance of a contract (providing the Service you signed up for); Legitimate interests (improving the Service, preventing fraud); Consent (marketing communications — you may withdraw at any time); and Legal obligation (complying with applicable law).`,
  },
  {
    title: "5. Data Sharing",
    body: `We do not sell your personal data. We share data only with: (a) Service providers — infrastructure, payment processing, email delivery, and analytics partners who process data on our behalf under data processing agreements; (b) Legal authorities — when required by law, court order, or to protect the rights and safety of AskBase or others; (c) Business transfers — in the event of a merger, acquisition, or sale of assets, with appropriate notice to you.`,
  },
  {
    title: "6. Your End-Users' Data",
    body: `When your visitors interact with your AskBase widget, conversation data is processed on your behalf. You are the data controller for your end-users' data; AskBase acts as a data processor. You are responsible for obtaining any necessary consents from your end-users and for providing them with appropriate privacy notices. We process this data solely to deliver the Service to you.`,
  },
  {
    title: "7. Data Retention",
    body: `We retain your account data for as long as your account is active. Conversation logs are retained for 12 months and then automatically deleted unless you choose to export them. Uploaded documents are retained until you delete them or close your account. After account closure, all personal data is deleted within 30 days except where retention is required by law.`,
  },
  {
    title: "8. Data Security",
    body: `We implement industry-standard security measures including encryption in transit (TLS 1.3), encryption at rest (AES-256), access controls, and regular security audits. No method of transmission over the internet is 100% secure, but we take all reasonable steps to protect your data.`,
  },
  {
    title: "9. International Transfers",
    body: `AskBase infrastructure is hosted in the European Union. If data is transferred outside the EEA, we ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission.`,
  },
  {
    title: "10. Cookies",
    body: `We use essential cookies for authentication and session management. We use analytics cookies (with your consent) to understand how the Service is used. You may withdraw cookie consent at any time via your browser settings. We do not use third-party advertising cookies.`,
  },
  {
    title: "11. Your Rights",
    body: `Under GDPR and applicable law, you have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your data; object to or restrict processing; data portability (receive your data in a machine-readable format); and withdraw consent at any time. To exercise any of these rights, email privacy@askbase.io. We will respond within 30 days.`,
  },
  {
    title: "12. Children's Privacy",
    body: `The Service is not directed to individuals under the age of 16. We do not knowingly collect personal data from children. If you become aware that a child has provided us with personal data, please contact us and we will delete it promptly.`,
  },
  {
    title: "13. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time. We will notify you of material changes by email or prominent notice in the Service at least 14 days before changes take effect. The date at the top of this page indicates when the policy was last updated.`,
  },
  {
    title: "14. Contact & Complaints",
    body: `For privacy questions or to exercise your rights, contact us at privacy@askbase.io. If you are based in the EU and are not satisfied with our response, you have the right to lodge a complaint with your local data protection authority.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background antialiased">
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-32">

        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">Legal</p>
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Privacy Policy</h1>
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
