import LegalPage from "@/app/legal/[document]/page";
export default function PrivacyPage() { return <LegalPage params={Promise.resolve({ document: "privacy" })} />; }
