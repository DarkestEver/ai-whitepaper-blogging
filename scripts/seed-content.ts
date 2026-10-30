/**
 * Seed script: inserts sample whitepapers into the database.
 * Run with: npx tsx scripts/seed-content.ts
 */
import { createWhitepaper, updateWhitepaper, listWhitepapers } from "../lib/db";
import { Whitepaper as WhitepaperModel } from "../lib/models";

const siteId = 2; // Research Platform

const samples = [
  {
    siteId,
    title: "Machine Learning Fundamentals",
    slug: "machine-learning-fundamentals",
    subtitle: "A practical introduction for data scientists",
    summary: "A comprehensive guide to machine learning basics, including supervised and unsupervised learning techniques.",
    category: "Artificial Intelligence",
    publisher: "Signal Research",
    readingMinutes: 12,
    status: "draft" as const,
    abstract: "This whitepaper explores the foundational concepts of machine learning, covering supervised learning, unsupervised learning, and reinforcement learning paradigms with practical examples.",
    takeaways: ["Understand supervised vs unsupervised learning", "Learn key ML algorithms", "Apply ML to real-world problems"],
    authorName: "Dr. Sarah Chen",
    authorTitle: "Lead Data Scientist",
    documentType: "whitepaper" as const,
    language: "en",
    publicationDate: "2024-10-27",
    industry: "Technology",
    targetAudience: "Data scientists and ML engineers",
    geographicTarget: "Global",
    tags: ["AI", "ML", "Python"],
    seoTitle: "Machine Learning Fundamentals | Research Platform",
    seoDescription: "Learn the fundamentals of machine learning including supervised and unsupervised techniques.",
    seoKeywords: ["machine learning", "AI", "supervised learning"],
    sourceRightsStatus: "allowed" as const,
    sourceRightsEvidence: "Original research owned by publisher, all rights reserved",
  },
  {
    siteId,
    title: "Advanced NLP Techniques",
    slug: "advanced-nlp-techniques",
    subtitle: "From transformers to large language models",
    summary: "Deep dive into modern NLP architectures including transformers, attention mechanisms, and large language models.",
    category: "Natural Language Processing",
    publisher: "Signal Research",
    readingMinutes: 18,
    status: "draft" as const,
    abstract: "This research report examines the evolution of natural language processing from recurrent networks to transformer architectures and the emergence of large language models.",
    takeaways: ["Understand transformer architecture", "Learn attention mechanisms", "Explore LLM capabilities"],
    authorName: "Prof. James Wu",
    authorTitle: "NLP Research Lead",
    documentType: "research_report" as const,
    language: "en",
    publicationDate: "2024-10-22",
    industry: "Technology",
    targetAudience: "NLP researchers and engineers",
    geographicTarget: "Global",
    tags: ["NLP", "Transformers", "LLM"],
    seoTitle: "Advanced NLP Techniques | Research Platform",
    seoDescription: "Deep dive into modern NLP including transformers and large language models.",
    seoKeywords: ["NLP", "transformers", "large language models"],
    sourceRightsStatus: "allowed" as const,
    sourceRightsEvidence: "Original research owned by publisher, all rights reserved",
  },
  {
    siteId,
    title: "Quantum Computing Introduction",
    slug: "quantum-computing-intro",
    subtitle: "Understanding qubits and quantum gates",
    summary: "An accessible introduction to quantum computing concepts, from qubits to quantum algorithms and their potential applications.",
    category: "Quantum Computing",
    publisher: "Signal Research",
    readingMinutes: 15,
    status: "draft" as const,
    abstract: "This guide introduces quantum computing fundamentals including superposition, entanglement, quantum gates, and early quantum algorithms like Shor's and Grover's.",
    takeaways: ["Grasp qubit fundamentals", "Understand quantum gates", "Learn about quantum algorithms"],
    authorName: "Dr. Maria Lopez",
    authorTitle: "Quantum Computing Researcher",
    documentType: "guide" as const,
    language: "en",
    publicationDate: "2024-10-28",
    industry: "Technology",
    targetAudience: "Software engineers exploring quantum",
    geographicTarget: "Global",
    tags: ["Quantum", "Computing", "Physics"],
    seoTitle: "Quantum Computing Introduction | Research Platform",
    seoDescription: "An accessible introduction to quantum computing from qubits to algorithms.",
    seoKeywords: ["quantum computing", "qubits", "quantum algorithms"],
    sourceRightsStatus: "unknown" as const,
    sourceRightsEvidence: "",
  },
];

async function seed() {
  // Check if content already exists for this site
  const existing = await listWhitepapers({ includeNonPublic: true, siteId });
  if (existing.length >= 3) {
    console.log(`Site ${siteId} already has ${existing.length} whitepapers. Skipping seed.`);
    return;
  }
  // Remove partial seeds
  if (existing.length > 0) {
    console.log(`Clearing ${existing.length} existing whitepapers for re-seed...`);
    await WhitepaperModel.deleteMany({ siteId });
  }

  for (const sample of samples) {
    const paper = await createWhitepaper(sample);
    console.log(`Created: "${paper.title}" (id=${paper.id}, slug=${paper.slug})`);

    // Publish first two via update (need editorial approval + rights)
    if (sample.sourceRightsStatus === "allowed") {
      // First approve editorially
      await updateWhitepaper(paper.id, {
        ...sample,
        status: "draft",
      });
      // Mark as approved by directly updating the model
      await WhitepaperModel.updateOne(
        { numericId: paper.id },
        { editorialStatus: "approved" }
      );
      // Now publish
      await updateWhitepaper(paper.id, {
        ...sample,
        status: "published",
      });
      console.log(`  -> Published`);
    } else {
      console.log(`  -> Left as draft (rights not cleared)`);
    }
  }

  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
