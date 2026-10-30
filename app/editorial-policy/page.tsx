import LegalPage from "@/app/legal/[document]/page";
export default function EditorialPolicyPage() { return <LegalPage params={Promise.resolve({ document: "editorial-policy" })} />; }
