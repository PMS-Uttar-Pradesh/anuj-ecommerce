import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ContactAdminEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const ContactAdminEmail = ({
  name = "Your Name",
  email = "john@example.com",
  subject = "Support Request",
  message = "This is a test support message.",
}: ContactAdminEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Support Submission: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>PMS Admin Notification</Text>
          </Section>

          <Heading style={h1}>New Support Request Received</Heading>
          <Text style={text}>
            A new support contact form request has been submitted on the storefront. Details are below:
          </Text>

          <Section style={detailsCard}>
            <table style={{ width: "100%", fontSize: "14px" }}>
              <tbody>
                <tr>
                  <td style={{ color: "#64748b", padding: "6px 0", fontWeight: "bold" }}>Customer Name:</td>
                  <td style={{ color: "#1e293b", padding: "6px 0" }}>{name}</td>
                </tr>
                <tr>
                  <td style={{ color: "#64748b", padding: "6px 0", fontWeight: "bold" }}>Customer Email:</td>
                  <td style={{ color: "#1e293b", padding: "6px 0" }}>{email}</td>
                </tr>
                <tr>
                  <td style={{ color: "#64748b", padding: "6px 0", fontWeight: "bold" }}>Subject:</td>
                  <td style={{ color: "#1e293b", padding: "6px 0", fontWeight: "bold" }}>{subject}</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={messageCard}>
            <Text style={cardTitle}>Message Details</Text>
            <Text style={messageText}>{message}</Text>
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated notification. To reply, email the customer directly at {email}.
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

export default ContactAdminEmail;

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
  fontSize: "20px",
  fontWeight: "bold",
  color: "#475569",
  margin: "0",
  letterSpacing: "1px",
};

const h1 = {
  color: "#1e293b",
  fontSize: "22px",
  fontWeight: "bold",
  paddingTop: "24px",
  margin: "0 0 12px",
};

const text = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const detailsCard = {
  backgroundColor: "#f8fafc",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
  border: "1px solid #f1f5f9",
};

const messageCard = {
  backgroundColor: "#ffffff",
  borderRadius: "6px",
  padding: "16px",
  margin: "16px 0",
  border: "1px solid #e2e8f0",
};

const cardTitle = {
  fontSize: "13px",
  fontWeight: "bold",
  color: "#64748b",
  margin: "0 0 8px",
  textTransform: "uppercase" as const,
};

const messageText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#1e293b",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
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
