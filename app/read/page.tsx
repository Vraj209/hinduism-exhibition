import type { Metadata } from "next";
import Link from "next/link";
import { sections, sourcePdfHref } from "@/content/exhibition";
import { PavilionMark } from "@/components/pavilion-mark";
import { worlds, storySourceNote } from "@/content/stories";
import styles from "./read.module.css";

export const metadata: Metadata = {
  title: "All six sections | Hinduism",
  description:
    "Read the six messages of the Hinduism exhibition: everyday life, traditions, belief, festivals, values, and the three pillars of culture.",
};

function Arrow({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={direction === "left" ? { transform: "rotate(180deg)" } : undefined}
    >
      <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function ReadingPage() {
  return (
    <div className={styles.page}>
      <a href="#reading-content" className={styles.skipLink}>
        Skip to the sections
      </a>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Hinduism home">
          Hinduism
          <span className={styles.brandDot} aria-hidden="true">
            .
          </span>
        </Link>
        <Link className={styles.backLink} href="/#map">
          <Arrow direction="left" /> Back to Map
        </Link>
      </header>

      <main id="reading-content" className={styles.main}>
        <div className={styles.introduction}>
          <p className={styles.eyebrow}>THE EXHIBITION · READING VIEW</p>
          <Link href="/references" className={styles.sourceLink}>
            Sources & visual credits ↗
          </Link>
          <h1>All six sections.</h1>
          <p className={styles.lead}>
            From the way we live to the values we carry.
            <br />A quiet journey through the exhibition’s six messages.
          </p>
          <p className={styles.introNote}>
            Summaries follow the mandir exhibition’s one-page takeaway sheet.
            Read in order, or begin wherever your curiosity takes you.
          </p>
          <p className={styles.storyIntroNote}>{storySourceNote}</p>
        </div>

        <div className={styles.readingLayout}>
          <aside className={styles.sidebar}>
            <nav
              aria-label="The six exhibition sections"
              className={styles.contents}
            >
              <p className={styles.contentsTitle}>In this exhibition</p>
              <ol>
                {sections.map((section) => (
                  <li key={section.id}>
                    <a href={`#${section.slug}`}>
                      <span className={styles.navNumber}>
                        {String(section.id).padStart(2, "0")}
                      </span>
                      <span>{section.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
              <Link className={styles.exploreMap} href="/#map">
                Explore the Map <Arrow />
              </Link>
            </nav>
          </aside>

          <div className={styles.articles}>
            {sections.map((section) => (
              <article
                id={section.slug}
                key={section.id}
                className={styles.article}
                aria-labelledby={`title-${section.slug}`}
              >
                <div className={styles.articleHeader}>
                  <span className={styles.sectionNumber} aria-hidden="true">
                    <PavilionMark variant={section.id} />
                  </span>
                  <div>
                    <p className={styles.theme}>{section.theme}</p>
                    <h2 id={`title-${section.slug}`}>{section.title}</h2>
                  </div>
                </div>
                <p className={styles.message}>{section.message}</p>
                <p className={styles.summary}>{section.summary}</p>
                <h3 className={styles.takeawaysTitle}>
                  What to carry with you
                </h3>
                <ul className={styles.takeaways}>
                  {section.takeaways.map((takeaway) => (
                    <li key={takeaway}>{takeaway}</li>
                  ))}
                </ul>
                <aside
                  className={styles.reflection}
                  aria-label="Reflection question"
                >
                  <p>A moment to reflect</p>
                  <span>{section.reflection}</span>
                </aside>
                <details className={styles.sourceDetail}>
                  <summary>Words from the exhibition</summary>
                  <blockquote>“{section.quotation}”</blockquote>
                  <p>
                    An unattributed exhibition statement, reproduced from the
                    source sheet.
                  </p>
                </details>
                {worlds
                  .filter((world) => world.sectionId === section.id)
                  .map((world) => (
                    <section
                      className={styles.storyCollection}
                      key={world.sectionId}
                      aria-labelledby={`stories-${section.slug}`}
                    >
                      <h3 id={`stories-${section.slug}`}>
                        {section.id === 4
                          ? "Explore fourteen festivals"
                          : "Three moments to explore"}
                      </h3>
                      <p className={styles.storyCollectionNote}>
                        {world.sourceNote}
                      </p>
                      {world.stories.map((story, index) => (
                        <details
                          className={styles.storyDetail}
                          key={story.id}
                          id={`story-${story.id}`}
                        >
                          <summary>
                            <span className={styles.storyHeading}>
                              <span
                                className={styles.storyNumber}
                                aria-hidden="true"
                              >
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span>{story.title}</span>
                            </span>
                            <span className={styles.storyCaption}>
                              {story.caption}
                            </span>
                          </summary>
                          <div className={styles.storyBody}>
                            <p>{story.summary}</p>
                            <p className={styles.storyTakeaway}>
                              <strong>Carry this with you</strong>
                              {story.takeaway}
                            </p>
                            <a
                              href={
                                story.sourceHref ?? `${sourcePdfHref}#page=1`
                              }
                              className={styles.sourceLink}
                            >
                              Source: {story.sourceLabel}
                            </a>
                          </div>
                        </details>
                      ))}
                    </section>
                  ))}
                <div className={styles.articleFooter}>
                  <a
                    href={`${sourcePdfHref}#page=${section.sourcePages[0]}`}
                    className={styles.sourceLink}
                  >
                    Source: {section.sourceLabel}
                  </a>
                  <Link
                    href={`/#section-${section.slug}`}
                    className={styles.pavilionLink}
                  >
                    Explore this pavilion <Arrow />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        <section
          className={styles.aboutSource}
          aria-labelledby="about-source-title"
        >
          <div className={styles.sourceMark} aria-hidden="true">
            <svg viewBox="0 0 80 80" fill="none">
              <path
                d="M10 63h60M14 58h52M20 58V36c0-10 9-20 20-26 11 6 20 16 20 26v22M28 58V39c0-7 5-13 12-18 7 5 12 11 12 18v19M35 58V41a5 5 0 0 1 10 0v17"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </div>
          <div>
            <h2 id="about-source-title">A note on the source</h2>
            <p>
              The six section messages and reflection questions are grounded in
              the supplied takeaway sheet,
              <a href={`${sourcePdfHref}#page=1`}>
                {" "}
                Takeaways for gutko, page 1
              </a>
              . It contains six messages, with three subdivisions within the
              final section. Full exhibition panels, stories, and approved
              imagery have not been supplied. The expanded festival collection
              draws on separately linked official BAPS sources.
            </p>
            <p>
              The account of Sant — Guru and Satpurush preserves this
              exhibition’s devotional perspective; Hindu traditions do not all
              describe these ideas identically. The campus is a proposed digital
              interpretation, inspired by the architecture of
              <a
                href="https://akshardham.com/explore/mandir/"
                target="_blank"
                rel="noreferrer"
              >
                {" "}
                Swaminarayan Akshardham in New Delhi
              </a>
              .
            </p>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <span>Hinduism · A journey of understanding</span>
        <a href="#reading-content">
          Back to the beginning <span aria-hidden="true">↑</span>
        </a>
      </footer>
    </div>
  );
}
