import LegalPage from "@/app/legal/[document]/page";
export default function CookiesPage() { return <LegalPage params={Promise.resolve({ document: "cookies" })} />; }
