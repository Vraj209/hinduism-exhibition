import type { ExhibitionSection } from "./exhibition";
import { galleryMedia, type GalleryMedia } from "./gallery-media";
import { worlds, type StoryMoment } from "./stories";

export type GalleryMoment = {
  id: string;
  title: string;
  caption: string;
  kind: "opening" | "story" | "closing";
  media?: GalleryMedia;
  story?: StoryMoment;
  storyIndex?: number;
};

/** Preserve the approved stories and their stable IDs; add only narrative bookends. */
export function galleryForSection(section: ExhibitionSection): GalleryMoment[] {
  const world = worlds.find((item) => item.sectionId === section.id);
  if (!world) return [];
  return [
    {
      id: `${section.slug}-opening`,
      title: section.title,
      caption: section.message,
      kind: "opening",
    },
    ...world.stories.map((story, storyIndex): GalleryMoment => ({
      id: story.id,
      title: story.title,
      caption: story.caption,
      kind: "story",
      story,
      storyIndex,
      media: galleryMedia[story.id],
    })),
    {
      id: `${section.slug}-closing`,
      title: "Carry this with you",
      caption: section.takeaways.at(-1) ?? section.message,
      kind: "closing",
    },
  ];
}
