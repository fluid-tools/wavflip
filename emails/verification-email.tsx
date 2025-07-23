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
  Text,
  Tailwind,
} from '@react-email/components';

interface VerificationEmailProps {
  username?: string;
  verificationLink?: string;
}

export const VerificationEmail = ({
  username,
  verificationLink,
}: VerificationEmailProps) => {
  const previewText = `Verify your email address`;
  
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Verify your email address
            </Heading>
            <Text className="text-black text-[14px] leading-[24px]">
              Hello {username || 'there'},
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Thank you for signing up! Please verify your email address by clicking the button below to complete your account setup.
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href={verificationLink}
              >
                Verify Email Address
              </Button>
            </Section>
            <Text className="text-black text-[14px] leading-[24px]">
              or copy and paste this URL into your browser:{' '}
              <Link href={verificationLink} className="text-blue-600 no-underline">
                {verificationLink}
              </Link>
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              This verification email was intended for{' '}
              <span className="text-black">{username}</span>. If you did not sign up for an account, you can ignore this email.
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