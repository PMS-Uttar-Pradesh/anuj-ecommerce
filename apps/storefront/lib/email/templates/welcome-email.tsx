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
} from "@react-email/components";
import * as React from "react";
import { WelcomeEmailProps } from "../types";

export const WelcomeEmail = ({
  firstName = "Customer",
  storeUrl = "https://anuj-ecommerce-pi.vercel.app",
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to PMS - Let&apos;s get started!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={logoSection}>
            <Text style={logoText}>PMS</Text>
          </Section>

          {/* Heading */}
          <Heading style={h1}>Welcome to PMS, {firstName}!</Heading>

          {/* Content */}
          <Text style={text}>
            We&apos;re thrilled to have you here. PMS is your premier destination for high-quality writing instruments, curated stationery, and creative tools designed to elevate your daily writing experience.
          </Text>

          <Text style={text}>
            Your account is now active. You can browse our collections, track your orders, and manage your shipping details seamlessly.
          </Text>

          {/* CTA Button */}
          <Section style={btnContainer}>
            <Button style={button} href={storeUrl}>
              Explore the Storefront
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Need assistance? Contact our support team at{" "}
              <Link href="mailto:support@pms.com" style={link}>
                support@pms.com
              </Link>
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} PMS. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// --- Styles ---
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px 48px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
  maxWidth: "580px",
};

const logoSection = {
  paddingBottom: "24px",
  borderBottom: "1px solid #e6ebf1",
  textAlign: "center" as const,
};

const logoText = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#0f172a",
  margin: "0",
  letterSpacing: "1px",
};

const h1 = {
  color: "#1e293b",
  fontSize: "24px",
  fontWeight: "bold",
  paddingTop: "24px",
  margin: "0 0 16px",
};

const text = {
  color: "#475569",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 16px",
};

const btnContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#0f172a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const footer = {
  textAlign: "center" as const,
};

const footerText = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "4px 0",
};

const link = {
  color: "#0f172a",
  textDecoration: "underline",
};
