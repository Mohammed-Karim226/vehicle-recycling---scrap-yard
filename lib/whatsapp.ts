

export function buildWhatsAppLink({
  recipientPhone,
  message,
}: {
  recipientPhone: string;
  message: string;
}) {
  // Clean phone (remove all non-digit)
  const cleanedPhone = recipientPhone.replace(/\D/g, "");

  // Ensure starts with country code (default to 44 for UK)
  let internationalPhone = cleanedPhone;
  if (cleanedPhone.startsWith("0")) {
    internationalPhone = "44" + cleanedPhone.slice(1);
  } else if (!cleanedPhone.startsWith("44")) {
    internationalPhone = "44" + cleanedPhone;
  }

  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${internationalPhone}?text=${encodedMessage}`;
}

export interface WhatsAppMessageData {
  vehicleName: string;
  registration: string;
  postcode: string;
  estimatedValue: number;
  weightKg: number;
  engineSize: string;
  fuelType: string;
  customerPhone?: string;
}

export function buildScrapQuoteMessage(data: WhatsAppMessageData) {
  return `
🚗 New Scrap Quote Request!

📋 Vehicle Details:
- ${data.vehicleName}
- Reg: ${data.registration}
- Postcode: ${data.postcode}
- Engine: ${data.engineSize}
- Fuel: ${data.fuelType}
- Weight: ${data.weightKg}kg

💰 Estimated Scrap Value: £${data.estimatedValue}
${data.customerPhone ? `📞 Customer Phone: ${data.customerPhone}` : ""}

---
Sent from Vehicle Recycling Scrap Yard
`.trim();
}

// Optional: For automatic WhatsApp sending via Twilio
export async function sendWhatsAppViaTwilio({
  toPhone,
  message,
}: {
  toPhone: string;
  message: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !twilioWhatsAppNumber) {
    console.warn("Twilio credentials not set — skipping automatic WhatsApp");
    return { success: false, error: "Missing Twilio credentials" };
  }

  const cleanedTo = toPhone.replace(/\D/g, "");
  let to = cleanedTo.startsWith("0") ? "44" + cleanedTo.slice(1) : cleanedTo;
  if (!to.startsWith("44")) to = "44" + to;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const formData = new URLSearchParams({
    From: `whatsapp:${twilioWhatsAppNumber}`,
    To: `whatsapp:${to}`,
    Body: message,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Twilio error:", response.status, errText);
      return { success: false, error: "Twilio request failed" };
    }

    const result = await response.json();
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error("Failed to send WhatsApp via Twilio:", error);
    return { success: false, error: "Network error" };
  }
}
