export default function PrivacyPolicy() {
  return (
    <>
      <h1 className="mb-8 font-bold text-3xl">WAVFLIP AI Privacy Policy</h1>
      <p className="mb-8 text-gray-400 text-sm">
        Last updated: January 31, 2025
      </p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 font-semibold text-xl">Introduction</h2>
          <p className="text-gray-300">
            At WAVFLIP AI, one of our main priorities is the privacy of our
            visitors. This Privacy Policy document contains types of information
            that is collected and recorded by WAVFLIP AI and how we use it.
          </p>
        </section>

        <section>
          <h2 className="mb-4 font-semibold text-xl">Contact Information</h2>
          <p className="text-gray-300">
            For additional questions about our Privacy Policy, please contact us
            at{' '}
            <a
              className="text-blue-400 hover:underline"
              href="mailto:arth@wavflip.com"
            >
              arth@wavflip.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-4 font-semibold text-xl">Information We Collect</h2>
          <ul className="list-disc space-y-2 pl-5 text-gray-300">
            <li>
              Personal information provided during registration (name, email,
              etc.)
            </li>
            <li>Contact information when reaching out directly</li>
            <li>Log file information (IP addresses, browser type, etc.)</li>
            <li>Cookies and usage data</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-4 font-semibold text-xl">Your Rights</h2>
          <div className="space-y-2 text-gray-300">
            <p>Under GDPR and CCPA, you have the following rights:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Right to access your personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure of your data</li>
              <li>Right to restrict processing</li>
              <li>Right to object to processing</li>
              <li>Right to data portability</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-semibold text-xl">
            Children&apos;s Privacy
          </h2>
          <p className="text-gray-300">
            WAVFLIP AI does not knowingly collect any Personal Identifiable
            Information from children under the age of 13.
          </p>
        </section>

        <section>
          <h2 className="mb-4 font-semibold text-xl">Changes to This Policy</h2>
          <p className="text-gray-300">
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
          </p>
        </section>
      </div>
    </>
  );
}
