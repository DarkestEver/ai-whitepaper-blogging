import LegalPage from "@/app/legal/[document]/page";
export default function DisclaimerPage() { return <LegalPage params={Promise.resolve({ document: "disclaimer" })} />; }
