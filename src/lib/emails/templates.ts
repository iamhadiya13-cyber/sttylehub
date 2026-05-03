type OrderEmailItem = {
  image: string;
  title: string;
  size?: string;
  qty: number;
  price: number;
};

type OrderEmailData = {
  orderNumber: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  items: OrderEmailItem[];
  trackingNumber?: string | null;
};

type VendorApplicationEmailData = {
  applicantName: string;
  applicantEmail: string;
  shopName: string;
  shopCategory: string;
  description: string;
  phone: string;
  businessType: string;
  gstNumber?: string;
  appliedAt: string;
  reviewLink: string;
};

type VendorApplicationReceivedData = {
  name: string;
  shopName: string;
};

type VendorApprovalEmailData = {
  name: string;
  shopName: string;
  shopSlug: string;
  dashboardLink: string;
};

type VendorRejectionEmailData = {
  name: string;
  shopName: string;
  reason: string;
  reapplyLink: string;
};

const baseTemplate = (title: string, body: string) => `
  <div style="background:#0A0A0A;padding:32px;font-family:Arial,sans-serif;color:#ffffff">
    <div style="max-width:640px;margin:0 auto;background:#111111;border:1px solid #2A2A2A;border-radius:24px;overflow:hidden">
      <div style="padding:24px;border-bottom:1px solid #2A2A2A">
        <h1 style="margin:0;font-size:24px;letter-spacing:0.12em;text-transform:uppercase;color:#C7D2FE">StyleHub</h1>
      </div>
      <div style="padding:24px">
        <h2 style="margin-top:0">${title}</h2>
        ${body}
      </div>
      <div style="padding:24px;border-top:1px solid #2A2A2A;color:#999999;font-size:12px">
        You are receiving this email because you have an account or activity on StyleHub.
      </div>
    </div>
  </div>
`;

export function verificationEmail(name: string, verifyUrl: string) {
  return baseTemplate(
    "Verify your StyleHub account",
    `<p>Hi ${name},</p><p>Please verify your email to activate your account.</p><p><a href="${verifyUrl}" style="display:inline-block;background:#6366F1;color:#F8FAFC;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">Verify Email</a></p>`,
  );
}

export function verificationOtpEmail(name: string, otp: string) {
  const digits = otp
    .split("")
    .map(
      (digit) =>
        `<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:60px;background:#1A1A1A;border:1px solid #2A2A2A;border-radius:8px;font-size:36px;font-weight:700;color:#C7D2FE">${digit}</span>`,
    )
    .join("");
  return baseTemplate(
    "Verify your email",
    `<p>Hi ${name},</p><p>Use the code below to verify your StyleHub account.</p><div style="display:flex;gap:8px;justify-content:center;margin:24px 0">${digits}</div><p>This code expires in 10 minutes.</p><p>If you didn't create an account, ignore this email.</p>`,
  );
}

export function forgotPasswordEmail(name: string, otp: string) {
  return baseTemplate(
    "Your StyleHub OTP",
    `<p>Hi ${name},</p><p>Use the OTP below to reset your password. It expires in 15 minutes.</p><div style="font-size:32px;font-weight:bold;letter-spacing:0.3em;margin:24px 0;color:#C7D2FE">${otp}</div>`,
  );
}

export function orderConfirmationEmail(order: OrderEmailData, userName: string) {
  const items = order.items
    .map(
      (item) =>
        `<tr><td style="padding:8px 0">${item.title}</td><td>${item.size || "-"}</td><td>${item.qty}</td><td>₹${item.price}</td></tr>`,
    )
    .join("");

  return baseTemplate(
    `Order confirmed — #${order.orderNumber}`,
    `<p>Hi ${userName},</p><table style="width:100%;border-collapse:collapse">${items}</table><p>Subtotal: ₹${order.subtotal}</p><p>Discount: ₹${order.discount}</p><p>Shipping: ₹${order.shippingCharge}</p><p><strong>Total: ₹${order.total}</strong></p><p>Delivery address: ${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.pincode}, ${order.shippingAddress.country}</p><p>Estimated delivery: 5-7 days</p>`,
  );
}

export function orderStatusEmail(order: OrderEmailData, newStatus: string) {
  return baseTemplate(
    `Your order is ${newStatus}`,
    `<p>Order #${order.orderNumber} is now <strong>${newStatus}</strong>.</p>${order.trackingNumber ? `<p>Tracking number: ${order.trackingNumber}</p>` : ""}`,
  );
}

export function sellerApprovalEmail(shopName: string, approved: boolean, reason?: string) {
  return baseTemplate(
    `Your seller application — ${approved ? "approved" : "rejected"}`,
    approved
      ? `<p>${shopName}, your seller account is approved. You can now access the seller dashboard.</p>`
      : `<p>${shopName}, your seller application was rejected.</p><p>${reason || "Please review your submission and apply again."}</p>`,
  );
}

export function newOrderNotifToSeller(shopName: string, orderNumber: string, items: OrderEmailItem[]) {
  const rows = items.map((item) => `<li>${item.title} x ${item.qty}</li>`).join("");
  return baseTemplate(
    "New order for your products!",
    `<p>Hi ${shopName},</p><p>You have a new order: <strong>${orderNumber}</strong>.</p><ul>${rows}</ul>`,
  );
}

export function payoutProcessedEmail(shopName: string, amount: number) {
  return baseTemplate("Payout processed", `<p>Hi ${shopName}, your payout of ₹${amount} has been processed.</p>`);
}

export function vendorApplicationEmail(data: VendorApplicationEmailData) {
  return baseTemplate(
    `New vendor application — ${data.shopName}`,
    `
      <p>A new vendor application has been submitted on StyleHub.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <tr><td style="padding:8px 0;color:#999">Applicant</td><td style="padding:8px 0">${data.applicantName}</td></tr>
        <tr><td style="padding:8px 0;color:#999">Email</td><td style="padding:8px 0">${data.applicantEmail}</td></tr>
        <tr><td style="padding:8px 0;color:#999">Phone</td><td style="padding:8px 0">${data.phone}</td></tr>
        <tr><td style="padding:8px 0;color:#999">Shop</td><td style="padding:8px 0">${data.shopName}</td></tr>
        <tr><td style="padding:8px 0;color:#999">Category</td><td style="padding:8px 0">${data.shopCategory}</td></tr>
        <tr><td style="padding:8px 0;color:#999">Business Type</td><td style="padding:8px 0">${data.businessType}</td></tr>
        <tr><td style="padding:8px 0;color:#999">GST</td><td style="padding:8px 0">${data.gstNumber || "Not provided"}</td></tr>
        <tr><td style="padding:8px 0;color:#999">Applied At</td><td style="padding:8px 0">${data.appliedAt}</td></tr>
      </table>
      <div style="margin:20px 0;border:1px solid #2A2A2A;border-radius:16px;background:#0A0A0A;padding:18px">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#888">Description</p>
        <p style="margin:0;color:#fff;line-height:1.7">${data.description}</p>
      </div>
      <p>
        <a href="${data.reviewLink}" style="display:inline-block;background:#6366F1;color:#F8FAFC;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">
          Review Application →
        </a>
      </p>
    `,
  );
}

export function applicationReceivedEmail(data: VendorApplicationReceivedData) {
  return baseTemplate(
    "We got your application — StyleHub",
    `
      <p>Hi ${data.name},</p>
      <p>Your application for <strong>${data.shopName}</strong> has been received.</p>
      <div style="display:grid;gap:10px;margin:24px 0">
        <div style="display:flex;gap:10px;align-items:center;color:#22C55E"><span>✓</span><span>Application submitted</span></div>
        <div style="display:flex;gap:10px;align-items:center;color:#F59E0B"><span>⏳</span><span>Team review</span></div>
        <div style="display:flex;gap:10px;align-items:center;color:#888"><span>📧</span><span>Email notification</span></div>
        <div style="display:flex;gap:10px;align-items:center;color:#888"><span>🚀</span><span>Start selling</span></div>
      </div>
      <p><strong>Expected response:</strong> 24–48 hours</p>
      <p>Questions? Reply to this email.</p>
    `,
  );
}

export function vendorApprovalEmail(data: VendorApprovalEmailData) {
  return baseTemplate(
    `${data.shopName} is approved on StyleHub!`,
    `
      <div style="display:inline-flex;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.3);color:#22C55E;border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase">Approved</div>
      <p style="margin-top:18px">Congratulations ${data.name}! Your shop <strong>${data.shopName}</strong> is now live on StyleHub.</p>
      <div style="display:grid;gap:10px;margin:22px 0">
        <div>📦 Add your products</div>
        <div>💰 Set your prices</div>
        <div>🚚 Manage orders</div>
        <div>📊 Track earnings</div>
      </div>
      <p>
        <a href="${data.dashboardLink}" style="display:inline-block;background:#6366F1;color:#F8FAFC;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">
          Open Seller Dashboard →
        </a>
      </p>
      <p style="color:#999">Your shop slug: ${data.shopSlug}</p>
    `,
  );
}

export function vendorRejectionEmail(data: VendorRejectionEmailData) {
  return baseTemplate(
    "About your StyleHub application",
    `
      <p>Hi ${data.name},</p>
      <p>After reviewing your application for <strong>${data.shopName}</strong>, we're unable to approve it right now.</p>
      <div style="margin:20px 0;border-left:3px solid #6366F1;border-radius:12px;background:#0A0A0A;padding:16px 18px;color:#fff">
        ${data.reason}
      </div>
      <p>You can fix these issues and reapply anytime.</p>
      <p>
        <a href="${data.reapplyLink}" style="display:inline-block;border:1px solid #fff;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">
          Apply Again →
        </a>
      </p>
      <p>Need help? Reply to this email.</p>
    `,
  );
}
