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
import { galleryMedia } from "@/content/gallery-media";
import { festivalGalleryPhotos } from "@/content/festival-gallery";
import { beliefImages } from "@/content/beliefs";
import { hinduValues, hinduValuePhotographs } from "@/content/hindu-values";
import { INDIA_MAP_SOURCE } from "@/content/india-map";
import { languageReferences } from "@/content/jivan-shaili";
import { territoryAttire } from "@/content/territory-attire";
import { worlds } from "@/content/stories";
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
      <section id="jivan-shaili-credits" className="reference-origin" aria-labelledby="jivan-credits-title">
        <h2 id="jivan-credits-title">Dome 1: language and traditional attire</h2>
        <p>The supplied Bhusha poster provides the 28 state entries, garment pairings, Gujarati state names and regional or community labels. These are examples of dress within each state; they do not represent every community or occasion.</p>
        <p>The 28 state attire images are AI-generated illustrations created with the built-in image generation tool from that poster, at the exhibition owner’s request. They are interpretations of the reference, not original exhibition photographs. Their garment labels remain transcriptions of the poster.</p>
        <p>Two additional illustrations, requested separately for Jammu and Kashmir and Ladakh, depict a Kashmiri attire example and a Ladakhi ceremonial attire example. These were generated from the cultural references below and are not entries from the supplied poster. They do not represent every community or occasion in either union territory.</p>
        {territoryAttire.flatMap((territory) => territory.sources.map((source) => <a key={`${territory.id}-${source.href}`} href={source.href} target="_blank" rel="noreferrer">{territory.name}: {source.title} ↗</a>))}
        <p>The regional languages and varieties follow a 28-state list supplied by the exhibition owner. They are examples, not exhaustive lists or statements of official-language status. The references supplied with that list are linked below.</p>
        {languageReferences.map((source) => <a key={source.state} href={source.href} target="_blank" rel="noreferrer">{source.state}: {source.title} ↗</a>)}
        <p>Regional language examples for Jammu and Kashmir and Ladakh were added separately at the exhibition owner’s request, using the references below. These lists are also non-exhaustive and do not designate official languages.</p>
        {territoryAttire.flatMap((territory) => territory.languageSources.map((source) => <a key={`${territory.id}-language-${source.href}`} href={source.href} target="_blank" rel="noreferrer">{territory.name}: {source.title} ↗</a>))}
        <p>Legible Gujarati garment captions are still awaiting exhibition source material. Language and attire details for the other six union territories remain unavailable.</p>
        <p>The map uses simplified DataMeet / geoBoundaries geometry, with 28 states and 8 union territories. Boundaries follow the source; the map is for exhibition navigation.</p>
        <a href={INDIA_MAP_SOURCE.url} target="_blank" rel="noreferrer">DataMeet / geoBoundaries map source ↗</a>
        <a href={INDIA_MAP_SOURCE.licenseUrl} target="_blank" rel="noreferrer">Creative Commons Attribution 2.5 India ↗</a>
      </section>
      <section className="reference-origin">
        <h2>Images, artwork and permissions</h2>
        <p>
          The campus architecture, decorative reliefs
          and six section icons were created for this digital exhibition.
          The photographs across the six dark galleries come
          from official BAPS sources.
        </p>
        <p>
          Photographs are credited to BAPS Swaminarayan Sanstha and linked to
          their original event context below. Copyright remains with the
          respective owners. These photographs document community life,
          spiritual practice, service, sacred spaces and celebrations. Their
          event context is distinct from the exhibition’s teachings. This
          exhibition is not an official BAPS website.
        </p>
        <a href="https://www.baps.org/Terms-and-Conditions.aspx">
          BAPS usage terms ↗
        </a>
        <a href="https://akshardham.com/terms-and-conditions/">
          Akshardham usage terms ↗
        </a>
      </section>
      <section className="reference-festivals" aria-labelledby="gallery-photo-credits">
        <h2 id="gallery-photo-credits">Gallery photograph credits</h2>
        <ol>
          {worlds.filter((world) => ![3, 4, 5].includes(world.sectionId)).flatMap((world) => world.stories.map((story) => {
            const media = galleryMedia[story.id];
            return media ? (
              <li key={story.id}>
                <strong>{story.title}</strong>
                <span>{sections[world.sectionId - 1].title}</span>
                {(media.companion ? [media, media.companion] : [media]).map((photo) => <div key={photo.src}>
                  <span>{photo.sourceContext} · {photo.credit}</span>
                  <a href={photo.sourceHref} target="_blank" rel="noreferrer">View official BAPS source ↗</a>
                </div>)}
              </li>
            ) : null;
          }))}
        </ol>
      </section>
      <section id="manyata-visual-credits" className="reference-festivals" aria-labelledby="manyata-credits-title">
        <h2 id="manyata-credits-title">Hindu Manyata · Visual credits</h2>
        <p>The light, ripples, circular path and lotus are original abstract visual metaphors. The Gujarati sentences are transcribed from the exhibition owner’s supplied reference.</p>
        <ol>
          <li>
            <strong>Avatar · Krishna guiding Arjun</strong>
            <span>{beliefImages.avatar.credit}. The source does not identify the artist or the artwork’s creation date.</span>
            <a href={beliefImages.avatar.sourcePageUrl} target="_blank" rel="noreferrer">Official BAPS article and artwork ↗</a>
          </li>
          <li>
            <strong>Murti · {beliefImages.murti.location} · {beliefImages.murti.year}</strong>
            <span>{beliefImages.murti.credit}. Official event photography used with permission confirmed by the exhibition owner.</span>
            <a href={beliefImages.murti.sourcePageUrl} target="_blank" rel="noreferrer">Official BAPS event gallery ↗</a>
          </li>
        </ol>
      </section>
      <section id="hindu-values-credits" className="reference-festivals" aria-labelledby="values-credits-title">
        <h2 id="values-credits-title">Hindu Mulyo · Photograph credits</h2>
        <p>The four value descriptions are original exhibition copy supplied by the exhibition owner, not quotations attributed to His Holiness Mahant Swami Maharaj. The photographs document the separate events described in their captions.</p>
        <p>Official BAPS event photography, used on the basis of website-use permission previously confirmed by the exhibition owner. Copyright remains with BAPS Swaminarayan Sanstha.</p>
        <ol>
          {hinduValues.map((value) => {
            const photo = hinduValuePhotographs.find((item) => item.id === value.id)!;
            return <li key={value.id}>
              <strong>{value.title} · {value.meaning}</strong>
              <span>{photo.caption}</span>
              <span>{photo.location} · {photo.displayDate} · {photo.credit}</span>
              <a href={photo.sourcePageUrl} target="_blank" rel="noreferrer">Official event gallery ↗</a>
              <a href={photo.sourceImageUrl} target="_blank" rel="noreferrer">Original photograph ↗</a>
            </li>;
          })}
        </ol>
      </section>
      <section id="festival-photo-credits" className="reference-festivals" aria-labelledby="festival-credits-title">
        <h2 id="festival-credits-title">Dome 4 · Photograph credits</h2>
        <p>Official BAPS event photography. Each photograph retains its actual location and year. Website use is based on permission confirmed by the exhibition owner.</p>
        <ol>
          {festivalGalleryPhotos.map((photo) => (
            <li key={photo.id}>
              <strong>{photo.location} · {photo.year}</strong>
              <span>{photo.alt}</span>
              <span>{photo.credit}</span>
              <a href={photo.sourcePageUrl} target="_blank" rel="noreferrer">Official event gallery ↗</a>
              <a href={photo.sourceImageUrl} target="_blank" rel="noreferrer">Original photograph ↗</a>
            </li>
          ))}
        </ol>
      </section>
      <footer>
        <Link href="/read">Read all six sections →</Link>
        <Link href="/#map">Explore the campus →</Link>
      </footer>
    </main>
  );
}
