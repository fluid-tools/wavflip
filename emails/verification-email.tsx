import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface VerificationEmailProps {
  username?: string;
  verificationLink?: string;
}

export const VerificationEmail = ({
  username,
  verificationLink,
}: VerificationEmailProps) => {
  const previewText = 'Verify your email address';

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-white px-2 font-sans">
          <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
              Verify your email address
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">
              Hello {username || 'there'},
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
              Thank you for signing up! Please verify your email address by
              clicking the button below to complete your account setup.
            </Text>
            <Section className="mt-[32px] mb-[32px] text-center">
              <Button
                className="rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                href={verificationLink}
              >
                Verify Email Address
              </Button>
            </Section>
            <Text className="text-[14px] text-black leading-[24px]">
              or copy and paste this URL into your browser:{' '}
              <Link
                className="text-blue-600 no-underline"
                href={verificationLink}
              >
                {verificationLink}
              </Link>
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-[#eaeaea] border-solid" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This verification email was intended for{' '}
              <span className="text-black">{username}</span>. If you did not
              sign up for an account, you can ignore this email.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export function reactVerificationEmail(props: VerificationEmailProps) {
  return <VerificationEmail {...props} />;
}
