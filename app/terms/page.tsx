import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: May 20, 2023</p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <p>
            Welcome to FundFlow. These Terms of Service ("Terms") govern your access to and use of the FundFlow website,
            services, and applications (collectively, the "Services"). Please read these Terms carefully before using
            our Services.
          </p>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy. If you do
            not agree to these Terms, you may not access or use the Services.
          </p>

          <h2>2. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. If we make changes, we will provide notice of such changes, such as
            by sending an email notification, providing notice through the Services, or updating the "Last Updated" date
            at the beginning of these Terms. Your continued use of the Services following notification of changes will
            constitute your acceptance of such changes.
          </p>

          <h2>3. Account Registration</h2>
          <p>
            To use certain features of the Services, you may be required to register for an account. You agree to
            provide accurate, current, and complete information during the registration process and to update such
            information to keep it accurate, current, and complete. You are responsible for safeguarding your password
            and for all activities that occur under your account.
          </p>

          <h2>4. Fundraising and Donations</h2>
          <p>
            FundFlow provides a platform for users to create fundraising campaigns and for donors to make contributions
            to those campaigns. By creating a fundraising campaign, you agree to:
          </p>
          <ul>
            <li>Provide accurate and truthful information about your campaign and its purpose</li>
            <li>Use funds received for the stated purpose of your campaign</li>
            <li>Comply with all applicable laws and regulations regarding fundraising and financial transactions</li>
            <li>Not engage in fraudulent or deceptive practices</li>
          </ul>

          <p>By making a donation, you acknowledge that:</p>
          <ul>
            <li>You are making a voluntary contribution</li>
            <li>FundFlow does not guarantee that funds will be used for the stated purpose</li>
            <li>Refunds are at the discretion of the campaign organizer, unless required by law</li>
            <li>FundFlow charges service fees that will be deducted from donations</li>
          </ul>

          <h2>5. Prohibited Activities</h2>
          <p>You agree not to engage in any of the following prohibited activities:</p>
          <ul>
            <li>Violating any applicable laws or regulations</li>
            <li>Infringing on the intellectual property rights of others</li>
            <li>Creating fundraisers for illegal purposes or activities</li>
            <li>Posting or transmitting harmful, threatening, abusive, or defamatory content</li>
            <li>Attempting to interfere with or compromise the system integrity or security</li>
            <li>Using the Services for any commercial purposes without our consent</li>
            <li>Collecting or harvesting user data without permission</li>
          </ul>

          <h2>6. Fees and Payment</h2>
          <p>
            FundFlow charges service fees for the use of our platform. These fees are deducted from donations before
            they are transferred to campaign organizers. The current fee structure is available on our website and may
            be updated from time to time.
          </p>

          <h2>7. Intellectual Property</h2>
          <p>
            The Services and all content and materials included on or within the Services are protected by various
            intellectual property laws and are the property of FundFlow or our licensors. You may not use, reproduce,
            distribute, modify, or create derivative works of any content or materials from the Services without our
            express written permission.
          </p>

          <h2>8. Termination</h2>
          <p>
            We may terminate or suspend your access to the Services at any time, without prior notice or liability, for
            any reason, including if you breach these Terms. Upon termination, your right to use the Services will
            immediately cease.
          </p>

          <h2>9. Disclaimer of Warranties</h2>
          <p>
            THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            IN NO EVENT SHALL FUNDFLOW BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH THESE TERMS OR
            THE USE OF OR INABILITY TO USE THE SERVICES.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without
            regard to its conflict of law provisions.
          </p>

          <h2>12. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us at support@fundflow.com.</p>
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
