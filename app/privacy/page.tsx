import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="container py-8 max-w-4xl">
      <Link
        href="/"
        className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: May 20, 2023</p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p>
            At FundFlow, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and
            safeguard your information when you use our website, services, and applications (collectively, the
            "Services").
          </p>

          <h2>1. Information We Collect</h2>
          <p>
            We collect information that you provide directly to us, information we collect automatically when you use
            our Services, and information from third parties.
          </p>

          <h3>Information You Provide</h3>
          <p>We collect information you provide when you:</p>
          <ul>
            <li>Create an account (name, email address, password)</li>
            <li>Complete your profile (biography, location, profile picture)</li>
            <li>Create a fundraising campaign (title, description, goal amount, images)</li>
            <li>Make a donation (payment information, donation amount, message)</li>
            <li>Contact our support team</li>
            <li>Participate in surveys or promotions</li>
          </ul>

          <h3>Information We Collect Automatically</h3>
          <p>When you use our Services, we automatically collect certain information, including:</p>
          <ul>
            <li>Log information (IP address, browser type, pages visited, time spent)</li>
            <li>Device information (hardware model, operating system, unique device identifiers)</li>
            <li>Location information (with your consent)</li>
            <li>Cookies and similar technologies</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our Services</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Communicate with you about products, services, offers, and events</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            <li>Personalize and improve your experience</li>
          </ul>

          <h2>3. Sharing of Information</h2>
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li>With campaign organizers when you make a donation (unless you choose to be anonymous)</li>
            <li>With service providers who perform services on our behalf</li>
            <li>In response to legal process or government request</li>
            <li>To protect the rights, property, and safety of FundFlow, our users, and the public</li>
            <li>In connection with a merger, sale of company assets, financing, or acquisition</li>
            <li>With your consent or at your direction</li>
          </ul>

          <h2>4. Your Choices</h2>
          <p>You have several choices regarding the information you provide to us:</p>
          <ul>
            <li>Account Information: You can update your account information through your account settings</li>
            <li>Marketing Communications: You can opt out of receiving promotional emails</li>
            <li>
              Cookies: Most web browsers accept cookies by default, but you can usually modify your settings to decline
              cookies
            </li>
            <li>
              Do Not Track: Some browsers offer a "Do Not Track" feature, which we honor to the extent required by law
            </li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized
            access, disclosure, alteration, and destruction. However, no security system is impenetrable, and we cannot
            guarantee the security of our systems.
          </p>

          <h2>6. Children's Privacy</h2>
          <p>
            Our Services are not directed to children under the age of 13, and we do not knowingly collect personal
            information from children under 13. If we learn that we have collected personal information from a child
            under 13, we will promptly delete that information.
          </p>

          <h2>7. International Data Transfers</h2>
          <p>
            We may transfer your information to countries other than the one in which you live. By using our Services,
            you consent to the transfer of your information to countries which may have different data protection rules
            than your country.
          </p>

          <h2>8. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. If we make material changes, we will notify you by
            email or through the Services prior to the changes becoming effective.
          </p>

          <h2>9. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@fundflow.com.</p>
        </div>

        <div className="flex justify-center pt-8">
          <Link href="/">
            <Button>Return to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
