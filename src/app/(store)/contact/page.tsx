import { Metadata } from "next";
import { MessageCircle, Mail, Clock, Sparkles, Phone, MapPin } from "lucide-react";
import { getSetting } from "@/lib/services/settings";
import { ContactForm } from "@/components/store/ContactForm";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact & Enquiries | Samaura Healthcare",
  description:
    "Get in touch with Samaura Healthcare. Enquire about menstrual health education, awareness sessions, menstrual cups, and gift collections.",
};

interface ContactPageProps {
  searchParams?: Promise<{
    topic?: string;
  }>;
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const rawTopic = (resolvedParams.topic || "").toLowerCase().trim();

  let initialTopic = "General";
  if (rawTopic.includes("awareness")) {
    initialTopic = "Awareness session";
  } else if (rawTopic.includes("gift")) {
    initialTopic = "Gift pack";
  } else if (rawTopic.includes("institution") || rawTopic.includes("csr")) {
    initialTopic = "Institutional/CSR";
  } else if (rawTopic.includes("cup")) {
    initialTopic = "Menstrual cup";
  }

  const whatsappNumber = await getSetting("whatsapp_number", "");
  const contactPhone = await getSetting("contact_phone", "+91 6282132510");
  const contactEmail = await getSetting("contact_email", "samaurahealthcare@gmail.com");
  const helplineHours = await getSetting("helpline_hours", "Monday to Saturday, 9:00 AM – 7:00 PM IST");
  const storeAddress = await getSetting("store_address", "");

  const cleanWaNumber = whatsappNumber.replace(/[^0-9]/g, "");

  return (
    <div className="bg-linear-to-b from-blush/40 via-white to-white min-h-screen py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-pink-light shadow-xs text-xs font-semibold text-brand">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Customer Care &amp; Enquiries</span>
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-ink">
            Contact Us
          </h1>
          <p className="text-muted text-sm sm:text-base leading-relaxed">
            Have questions about menstrual cups, awareness sessions, or institutional gift kits? Our dedicated care team is here to assist.
          </p>
        </div>

        {/* Dynamic Contact Details from Settings */}
        {(() => {
          const activeCardsCount = [cleanWaNumber, contactPhone, contactEmail, helplineHours].filter(Boolean).length;
          return (
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${activeCardsCount === 3 ? "md:grid-cols-3 max-w-4xl" : "lg:grid-cols-4 max-w-5xl"} gap-6 mx-auto`}>
              {cleanWaNumber && (
                <a
                  href={`https://wa.me/${cleanWaNumber}?text=Hi%20Samaura%20Team%2C%20I%20have%20an%20enquiry%20regarding%20hygiene%20products.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-full bg-white rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-ink">
                        WhatsApp Helpline
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        Instant confidential chat.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700">
                    +{cleanWaNumber}
                  </div>
                </a>
              )}

              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="h-full bg-white rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Phone className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-ink">
                        Phone Assistance
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        Direct helpline support.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-brand">
                    {contactPhone}
                  </div>
                </a>
              )}

              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="h-full bg-white rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs hover:shadow-md transition-all group flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Mail className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-ink">
                        Email Support
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        Orders &amp; enquiries.
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-brand break-all sm:break-normal">
                    {contactEmail}
                  </div>
                </a>
              )}

              <div className="h-full bg-white rounded-3xl p-6 sm:p-7 border border-pink-light shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blush text-brand flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base text-ink">
                      Helpline Hours
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      Support schedule
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium text-ink">
                  {helplineHours}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Contact Form Component */}
        <ContactForm initialTopic={initialTopic} />

        {/* Physical Address if configured */}
        {storeAddress && (
          <div className="text-center text-xs text-muted flex items-center justify-center gap-1.5 pt-4">
            <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>{storeAddress}</span>
          </div>
        )}
      </div>
    </div>
  );
}
