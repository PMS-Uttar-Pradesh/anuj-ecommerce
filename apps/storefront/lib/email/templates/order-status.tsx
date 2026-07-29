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
import { OrderStatusEmailProps } from "../types";

export const OrderStatusEmail = ({
  orderNumber = "ORD-000000",
  customerName = "Customer",
  status = "PROCESSING",
  storeUrl = "https://anuj-ecommerce-pi.vercel.app",
}: OrderStatusEmailProps) => {
  const getStatusText = () => {
    switch (status) {
      case "PROCESSING":
        return "is being processed";
      case "SHIPPED":
        return "has been shipped! 🚚";
      case "DELIVERED":
        return "has been delivered! 🎉";
      default:
        return "status has been updated";
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "PROCESSING":
        return "Our team is carefully preparing your package. We will let you know as soon as it ships.";
      case "SHIPPED":
        return "Your package has been handed over to our delivery partner and is on its way to you. You can check details or track your shipment below.";
      case "DELIVERED":
        return "Your order has been successfully delivered. We hope you enjoy your new stationery and writing instruments! If you love them, feel free to leave a review.";
      default:
        return "Your order status has been updated. Please see details below.";
    }
  };

  const previewText = `Order ${orderNumber} update: ${status}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={logoSection}>
            <Text style={logoText}>PMS</Text>
          </Section>

          {/* Heading */}
          <Heading style={h1}>Order Update</Heading>
          <Text style={text}>
            Hi {customerName},
          </Text>
          <Text style={text}>
            Your order <strong>{orderNumber}</strong> {getStatusText()}.
          </Text>

          {/* Status Details Card */}
          <Section style={detailsCard}>
            <Text style={cardText}>{getStatusMessage()}</Text>
          </Section>

          {/* Action Button */}
          <Section style={btnContainer}>
            <Button style={button} href={`${storeUrl}/account/orders`}>
              View Your Orders
            </Button>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Have questions or need support? Reach us at{" "}
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

export default OrderStatusEmail;

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

const detailsCard = {
  backgroundColor: "#f8fafc",
  borderRadius: "6px",
  padding: "16px",
  margin: "24px 0",
  border: "1px solid #f1f5f9",
};

const cardText = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#1e293b",
  margin: "0",
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
