export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { plan } = req.body;

  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const passphrase = process.env.PAYFAST_PASSPHRASE;

  const isUnlimited = plan === "unlimited";

  const data = {
    merchant_id: merchantId,
    merchant_key: merchantKey,
    return_url: "https://learneasily.co.za?payment=success",
    cancel_url: "https://learneasily.co.za?payment=cancelled",
    notify_url: "https://learneasily.co.za/api/notify",
    name_first: "Student",
    email_address: "student@learneasily.co.za",
    m_payment_id: Date.now().toString(),
    amount: isUnlimited ? "249.00" : "29.00",
    item_name: isUnlimited
      ? "LearnEasily Unlimited Monthly"
      : "LearnEasily Session",
    subscription_type: isUnlimited ? "1" : undefined,
    billing_date: isUnlimited
      ? new Date().toISOString().split("T")[0]
      : undefined,
    recurring_amount: isUnlimited ? "249.00" : undefined,
    frequency: isUnlimited ? "3" : undefined,
    cycles: isUnlimited ? "0" : undefined,
  };

  // Remove undefined values
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

  // Build query string
  const queryString = Object.entries(data)
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`)
    .join("&");

  return res.status(200).json({
    paymentUrl: `https://www.payfast.co.za/eng/process?${queryString}`,
  });
}
