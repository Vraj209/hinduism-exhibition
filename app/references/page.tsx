import Link from "next/link";
import { sections, sourcePdfHref } from "@/content/exhibition";
import {
  visualReferences,
  visualCredit,
  exhibitionExteriorReference,
  mandirReference,
} from "@/content/visual-references";
import { festivals, festivalSourceNote } from "@/content/festivals";
import { pavilionCarvings } from "@/content/pavilion-carvings";
import { PavilionMark, MandirMark } from "@/components/pavilion-mark";
import "./references.css";

export const metadata = { title: "Sources & visual credits | Hinduism" };
export default function ReferencesPage() {
  return (
    <main className="references-page">
      <Link className="reference-back" href="/#map">
        ← Back to the exhibition
      </Link>
      <header>
        <MandirMark />
        <p className="reference-eyebrow">THE CRAFT BEHIND THE EXPERIENCE</p>
        <h1>Sources & visual credits</h1>
        <p>{visualCredit}</p>
      </header>
      <section id="robbinsville" className="reference-origin" aria-labelledby="mandir-reference-title">
        <p className="reference-eyebrow">{mandirReference.status}</p>
        <h2 id="mandir-reference-title">{mandirReference.title}</h2>
        <p>{mandirReference.description}</p>
        <p>{mandirReference.evidence}</p>
        <p>{mandirReference.limits}</p>
        <p>{mandirReference.campus}</p>
        {mandirReference.sources.map((source) => (
          <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
            {source.label} ↗
          </a>
        ))}
      </section>
      <section className="reference-origin">
        <h2>The exhibition’s six messages</h2>
        <p>
          The six titles and central messages are preserved from the one-page
          exhibition brief. Named festival research was added separately at the
          exhibition owner’s request.
        </p>
        <a href={`${sourcePdfHref}#page=1`}>
          Read the supplied exhibition brief ↗
        </a>
      </section>
      <section className="reference-origin">
        <h2>{exhibitionExteriorReference.title}</h2>
        <p>{exhibitionExteriorReference.description}</p>
        <p>{exhibitionExteriorReference.interpretation}</p>
        <a
          href={exhibitionExteriorReference.url}
          target="_blank"
          rel="noreferrer"
        >
          {exhibitionExteriorReference.credit} ↗
        </a>
      </section>
      <section aria-labelledby="architecture-title">
        <h2 id="architecture-title">
          An architectural reference for every subject
        </h2>
        <div className="reference-grid">
          {visualReferences.map((ref) => (
            <article key={ref.sectionId}>
              <PavilionMark variant={ref.sectionId} />
              <p className="reference-eyebrow">
                {String(ref.sectionId).padStart(2, "0")} /{" "}
                {sections[ref.sectionId - 1].title}
              </p>
              <h3>{ref.title}</h3>
              <p>{ref.use}</p>
              <h4>{pavilionCarvings[ref.sectionId - 1].title}</h4>
              <p>{pavilionCarvings[ref.sectionId - 1].description}</p>
              <p className="reference-material">{ref.material}</p>
              <a href={ref.url} target="_blank" rel="noreferrer">
                {ref.credit} ↗
              </a>
            </article>
          ))}
        </div>
      </section>
      <section className="reference-festivals">
        <h2>Festival research</h2>
        <p>{festivalSourceNote}</p>
        <ol>
          {festivals.map((festival) => (
            <li key={festival.id}>
              <strong>{festival.name}</strong>
              <span>{festival.traditionLabel}</span>
              <a href={festival.sourceUrls[0]} target="_blank" rel="noreferrer">
                Read the official BAPS reference ↗
              </a>
            </li>
          ))}
        </ol>
      </section>
      <section className="reference-origin">
        <h2>Images, artwork and permissions</h2>
        <p>
          All rendered architecture, still images, decorative reliefs and six
          section icons were created for this digital exhibition. Official
          photographs informed the research and are linked for context; none are
          redistributed as website assets. No BAPS logo, portrait, sacred figure
          or copied sculptural relief is used.
        </p>
        <p>
          Festival object studies are illustrations, not photographs of a real
          celebration. Their compositions, materials and colours are design
          choices. Approved mandir photographs can replace them when supplied
          with permission and credit details.
        </p>
        <a href="https://www.baps.org/Terms-and-Conditions.aspx">
          BAPS usage terms ↗
        </a>
        <a href="https://akshardham.com/terms-and-conditions/">
          Akshardham usage terms ↗
        </a>
      </section>
      <footer>
        <Link href="/read">Read all six sections →</Link>
        <Link href="/#map">Explore the campus →</Link>
      </footer>
    </main>
  );
}
