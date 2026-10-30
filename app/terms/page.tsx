import LegalPage from "@/app/legal/[document]/page";
export default function TermsPage() { return <LegalPage params={Promise.resolve({ document: "terms" })} />; }
