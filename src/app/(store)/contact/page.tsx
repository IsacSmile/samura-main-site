import { Metadata } from "next";
import { Phone, Mail, Clock, MessageSquare, MessageCircle, MapPin } from "lucide-react";
import { getSetting } from "@/lib/services/settings";
import { PageHero } from "@/components/content/PageHero";
import { ContentSection } from "@/components/content/ContentSection";
import { ContactForm } from "@/components/store/ContactForm";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact Us | Samaura Healthcare",
  description:
    "Have questions about menstrual cups, awareness sessions, or institutional gift kits? Get in touch with the Samaura care team.",
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

  const contactPhone = (await getSetting("contact_phone", "")).trim();
  const contactEmail = (await getSetting("contact_email", "")).trim();
  const helplineHours = (await getSetting("helpline_hours", "")).trim();
  const responseTimeText = (await getSetting("contact_response_time_text", "")).trim();
  const whatsappNumber = (await getSetting("whatsapp_number", "")).trim();
  const storeAddress = (await getSetting("store_address", "")).trim();

  const cleanWaNumber = whatsappNumber.replace(/[^0-9]/g, "");

  const hasAnyDetails = Boolean(
    contactPhone ||
    contactEmail ||
    helplineHours ||
    responseTimeText ||
    cleanWaNumber ||
    storeAddress
  );

  return (
    <div className="bg-white min-h-screen">
      <PageHero
        breadcrumbLabel="Contact"
        breadcrumbHref="/contact"
        title="Contact us"
        lead="Have questions about menstrual cups, awareness sessions, or institutional gift kits? Our dedicated care team is here to assist."
      />

      <ContentSection className="pt-6 sm:pt-10">
        <div className="lg:grid lg:grid-cols-12 lg:gap-10 items-start space-y-8 lg:space-y-0">
          {/* Details Column (Left on desktop >=1024px) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-pink-light rounded-2xl p-6 sm:p-8 space-y-6">
              <h2 className="font-heading font-semibold text-lg text-ink">
                Get in touch
              </h2>

              {hasAnyDetails ? (
                <ul className="space-y-5 text-xs sm:text-sm">
                  {contactPhone && (
                    <li className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-ink shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div className="space-y-0.5">
                        <span className="block text-muted text-xs">Phone</span>
                        <a
                          href={`tel:${contactPhone.replace(/\s+/g, "")}`}
                          className="font-medium text-ink hover:text-brand transition-colors"
                        >
                          {contactPhone}
                        </a>
                      </div>
                    </li>
                  )}

                  {contactEmail && (
                    <li className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-ink shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div className="space-y-0.5">
                        <span className="block text-muted text-xs">Email</span>
                        <a
                          href={`mailto:${contactEmail}`}
                          className="font-medium text-ink hover:text-brand transition-colors break-all"
                        >
                          {contactEmail}
                        </a>
                      </div>
                    </li>
                  )}

                  {helplineHours && (
                    <li className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-ink shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div className="space-y-0.5">
                        <span className="block text-muted text-xs">Working hours</span>
                        <span className="font-medium text-ink block leading-relaxed">
                          {helplineHours}
                        </span>
                      </div>
                    </li>
                  )}

                  {responseTimeText && (
                    <li className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-ink shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div className="space-y-0.5">
                        <span className="block text-muted text-xs">Response time</span>
                        <span className="font-medium text-ink block leading-relaxed">
                          {responseTimeText}
                        </span>
                      </div>
                    </li>
                  )}

                  {cleanWaNumber && (
                    <li className="flex items-start gap-3">
                      <MessageCircle className="w-5 h-5 text-ink shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div className="space-y-0.5">
                        <span className="block text-muted text-xs">WhatsApp</span>
                        <a
                          href={`https://wa.me/${cleanWaNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-ink hover:text-brand transition-colors"
                        >
                          +{cleanWaNumber}
                        </a>
                      </div>
                    </li>
                  )}

                  {storeAddress && (
                    <li className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-ink shrink-0 mt-0.5" strokeWidth={1.75} />
                      <div className="space-y-0.5">
                        <span className="block text-muted text-xs">Address</span>
                        <span className="font-medium text-ink block leading-relaxed">
                          {storeAddress}
                        </span>
                      </div>
                    </li>
                  )}
                </ul>
              ) : (
                <p className="text-xs text-muted">
                  Please submit your enquiry using the form and our team will get back to you.
                </p>
              )}
            </div>
          </div>

          {/* Form Column (Right on desktop >=1024px) */}
          <div className="lg:col-span-7">
            <ContactForm initialTopic={initialTopic} />
          </div>
        </div>
      </ContentSection>
    </div>
  );
}
