import LegalPage from "@/app/legal/[document]/page";
export default function AccessibilityPage() { return <LegalPage params={Promise.resolve({ document: "accessibility" })} />; }
