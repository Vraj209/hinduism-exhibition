export type GalleryMedia = {
  src: string;
  name?: string;
  companion?: GalleryMedia;
  mobileSrc?: string;
  alt: string;
  credit: string;
  sourceHref?: string;
  sourceImageHref?: string;
  sourceContext?: string;
  width?: number;
  height?: number;
  kind: "photograph" | "illustration";
};

/**
 * Official BAPS photographs selected for the requested gallery revision.
 * Event context and visible subjects checked against their official galleries,
 * 9 November 2026. Copyright remains with BAPS; no independent licence or
 * endorsement is asserted. Resized without compositing or altering subjects.
 * Existing PDF statements and the separately sourced festival guide stay distinct.
 */
export const galleryMedia: Record<string, GalleryMedia> = {
  "diwali": {
      "src": "/gallery/diwali.webp",
      "alt": "Rows of glowing lamps arranged across the courtyard of BAPS Shri Swaminarayan Mandir, Nadiad.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://www.baps.org/News/2024/Diwali--Annakut-Celebrations-2024-27190.aspx",
      "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/31667/WebImages/BAPS_Diwali_New_Year_Annakut_Celebration_Nadiad_01.jpg",
      "sourceContext": "Diwali celebration, Nadiad, 2024",
      "width": 1200,
      "height": 800,
      "kind": "photograph"
  },
  "annakut": {
      "src": "/gallery/annakut.webp",
      "alt": "An abundant Annakut of carefully arranged food offerings in the shrine at BAPS Shri Swaminarayan Mandir, London.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://londonmandir.baps.org/2023/11/diwali-hindu-new-year-annakut-celebrations-2023/",
      "sourceImageHref": "https://londonmandir.baps.org/images/2023/11/2023-DiwaliAnnakut-London-081-Mandir-Annakut.jpg",
      "sourceContext": "Annakut, London, 2023",
      "width": 582,
      "height": 799,
      "kind": "photograph"
  },
  "holi": {
      "src": "/gallery/holi.webp",
      "alt": "Swamis and devotees gather around the Holi bonfire outside BAPS Shri Swaminarayan Mandir, London.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://londonmandir.baps.org/2023/03/holi-celebrations-6/",
      "sourceImageHref": "https://londonmandir.baps.org/images/2023/03/Holi_Celebrations_London_2023-12-scaled.jpg",
      "sourceContext": "Holi, London, 2023",
      "width": 1440,
      "height": 1082,
      "kind": "photograph"
  },
  "nutan-varsh": {
      "src": "/gallery/nutan-varsh.webp",
      "alt": "Devotees join in prayer during the Hindu New Year celebrations at BAPS Shri Swaminarayan Mandir, London.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://londonmandir.baps.org/2023/11/diwali-hindu-new-year-annakut-celebrations-2023/",
      "sourceImageHref": "https://londonmandir.baps.org/images/2023/11/2023-DiwaliAnnakut-London-065-Mahapuja-Thal-Arti.jpg",
      "sourceContext": "Hindu New Year prayers, London, 2023",
      "width": 1055,
      "height": 793,
      "kind": "photograph"
  },
  "pushpadolotsav": {
      "src": "/gallery/pushpadolotsav.webp",
      "alt": "A flower-decorated hindolo with Shri Akshar-Purushottam Maharaj and bowls of coloured powder at the Pushpadolotsav celebration in Nenpur.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://www.baps.org/Photos/2021/Pushpadolotsav-Celebration-23008.aspx",
      "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/23008/WebImages/2021_03_29_019_Nenpur.jpg",
      "sourceContext": "Pushpadolotsav, Nenpur, 2021",
      "width": 600,
      "height": 800,
      "kind": "photograph"
  },
  "ram-navami": {
      "src": "/gallery/ram-navami.webp",
      "alt": "A devotee swings a decorated cradle during the Shri Ram Navami celebration in Adelaide.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://www.baps.org/News/2026/Shri-Swaminarayan-Jayanti--Shri-Ram-Navami-Celebrations-2026-31176.aspx",
      "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/36278/WebImages/Shri_Ram_Navami_2026__Adelaide__9_.jpg",
      "sourceContext": "Ram Navami, Adelaide, 2026",
      "width": 1198,
      "height": 799,
      "kind": "photograph"
  },
  "swaminarayan-jayanti": {
      "src": "/gallery/swaminarayan-jayanti.webp",
      "alt": "An ornate silver cradle with Shri Harikrishna Maharaj and food offerings for Bhagwan Swaminarayan’s birth celebration in Sarangpur.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://www.baps.org/photos/2006/1-to-6-April-2006-2162.aspx?mid=3799",
      "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/2162/WebImages/0603232f.jpg",
      "sourceContext": "Swaminarayan Jayanti, Sarangpur, 2006",
      "width": 600,
      "height": 400,
      "kind": "photograph"
  },
  "janmashtami": {
      "src": "/gallery/janmashtami.webp",
      "alt": "Devotees gently swing the decorated cradle during Shri Krishna Janmashtami at BAPS Shri Swaminarayan Mandir, London.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://londonmandir.baps.org/2023/09/shri-krishna-janmashtami-celebrations-3/",
      "sourceImageHref": "https://londonmandir.baps.org/images/2023/10/2023-Janmashtami-31-scaled.jpg",
      "sourceContext": "Janmashtami, London, 2023",
      "width": 1440,
      "height": 1082,
      "kind": "photograph"
  },
  "maha-shivratri": {
      "src": "/gallery/maha-shivratri.webp",
      "alt": "Swamis offer worship at the shivaling during Maha-Shivaratri at BAPS Shri Swaminarayan Mandir, London.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://londonmandir.baps.org/2023/02/maha-shivaratri-celebrations-4/",
      "sourceImageHref": "https://londonmandir.baps.org/images/2023/02/Maha-Shivratri-Celebrations-2-scaled.jpg",
      "sourceContext": "Maha-Shivaratri, London, 2023",
      "width": 1440,
      "height": 1082,
      "kind": "photograph"
  },
  "raksha-bandhan": {
      "src": "/gallery/raksha-bandhan.webp",
      "alt": "A swami ties a rakhi on a young visitor’s wrist during Rakshabandhan at the BAPS Hindu Mandir, Abu Dhabi.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://www.baps.org/News/2024/Rakhis-Tied-to-over-4000-Laborers-to-Celebrate-Rakshabandhan-BAPS-Hindu-Mandir-26392.aspx",
      "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/30726/WebImages/IMG_20240820_163937_079.jpg",
      "sourceContext": "Rakshabandhan, Abu Dhabi, 2024",
      "width": 1198,
      "height": 799,
      "kind": "photograph"
  },
  "guru-purnima": {
      "src": "/gallery/guru-purnima.webp",
      "alt": "Swamis honour Mahant Swami Maharaj with a garland during the Guru Purnima celebration in Bochasan.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://www.baps.org/Photos/2024/Guru-Purnima-Celebration-30614.aspx",
      "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/30614/WebImages/2024_07_21_068_Bochasan.jpg",
      "sourceContext": "Guru Purnima, Bochasan, 2024",
      "width": 600,
      "height": 900,
      "kind": "photograph"
  },
  "rath-yatra": {
      "src": "/gallery/rath-yatra.webp",
      "alt": "A decorated swan-shaped chariot passes BAPS Shri Swaminarayan Mandir, Toronto, during Rath Yatra.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://www.baps.org/Photos/2023/Rath-Yatra-27457.aspx",
      "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/27457/WebImages/066_Rathyatra_Toronto_June20_0L9A2749.jpg",
      "sourceContext": "Rath Yatra, Toronto, 2023",
      "width": 1200,
      "height": 800,
      "kind": "photograph"
  },
  "makar-sankranti": {
      "src": "/gallery/makar-sankranti.webp",
      "alt": "Families gather with colourful kites at the BAPS London Uttarayan kite-flying day.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://londonmandir.baps.org/2009/01/family-kite-flying-day-baps-shri-swaminarayan-mandir-london/",
      "sourceImageHref": "https://londonmandir.baps.org/images/news/2009/01/kiteflying/kite_2f.jpg",
      "sourceContext": "Uttarayan, London, 2009",
      "width": 800,
      "height": 600,
      "kind": "photograph"
  },
  "navratri": {
      "src": "/gallery/navratri.webp",
      "alt": "A singer performs devotional music at the Navratri celebrations at BAPS Swaminarayan Vidyamandir, Randesan.",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "sourceHref": "https://www.baps.org/CenterNews/2018/Navratri-Function-2018-14272.aspx",
      "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/17049/WebImages/Navratri_001_001.jpg",
      "sourceContext": "Navratri, Randesan, 2018",
      "width": 800,
      "height": 533,
      "kind": "photograph"
  },

  "food-and-everyday-life": {
    "src": "/gallery/food-and-everyday-life.webp",
    "alt": "Young devotees pause with folded hands around food laid out for a shared outdoor meal.",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "sourceHref": "https://na.baps.org/learn/our-values/family",
    "sourceImageHref": "https://na.baps.org/_next/static/media/family-eating.e6e0867a.png",
    "sourceContext": "Samuh Bhojan — shared meals, BAPS family activities",
    "width": 1440,
    "height": 950,
    "kind": "photograph"
  },
  "what-we-wear": {
    "src": "/gallery/what-we-wear.webp",
    "alt": "Young performers in colourful traditional clothing dance onstage at a BAPS cultural programme in Chino Hills, California.",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "sourceHref": "https://na.baps.org/learn/our-values/culture",
    "sourceImageHref": "https://na.baps.org/_next/static/media/culture.c988d9fd.jpg",
    "sourceContext": "Traditional dance, Chino Hills, California",
    "width": 1440,
    "height": 974,
    "kind": "photograph"
  },
  "the-language-of-song": {
    "src": "/gallery/the-language-of-song.webp",
    "alt": "Singers and musicians with tabla and keyboards perform during the Janmashtami celebration at BAPS Shri Swaminarayan Mandir, London.",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "sourceHref": "https://londonmandir.baps.org/2023/09/shri-krishna-janmashtami-celebrations-3/",
    "sourceImageHref": "https://londonmandir.baps.org/images/2023/10/2023-Janmashtami-22-scaled.jpg",
    "sourceContext": "Devotional singing, Janmashtami, London, 2023",
    "width": 1440,
    "height": 1082,
    "kind": "photograph"
  },
  "remembering-our-duties": {
    "src": "/gallery/remembering-our-duties.webp",
    "alt": "Young BAPS volunteers wash dishes together at a kitchen sink.",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "sourceHref": "https://na.baps.org/learn/our-values/spirituality",
    "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/4566/WebImages/balnsc26f.jpg",
    "sourceContext": "Seva — volunteer service, BAPS satsang activities",
    "width": 800,
    "height": 600,
    "kind": "photograph"
  },
  "remembering-our-relationships": {
    "src": "/gallery/remembering-our-relationships.webp",
    "alt": "A family gathers beside their home mandir for ghar sabha, with a book open and hands joined in prayer.",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "sourceHref": "https://na.baps.org/learn/our-values/family",
    "sourceImageHref": "https://na.baps.org/_next/static/media/family.45308769.jpg",
    "sourceContext": "Ghar sabha — a family gathering at home",
    "width": 1440,
    "height": 773,
    "kind": "photograph"
  },
  "a-connection-to-something-greater": {
    "src": "/gallery/a-connection-to-something-greater.webp",
    "alt": "Adults and children sit together facing the sacred images of their home mandir during puja.",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "sourceHref": "https://na.baps.org/learn/our-values/spirituality",
    "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/21876/WebImages/01._Mahapooja_at_home.jpg",
    "sourceContext": "Family puja at home, BAPS spirituality and satsang",
    "width": 1200,
    "height": 800,
    "kind": "photograph"
  },
  "atma-the-soul": {
    "src": "/gallery/atma-the-soul.webp",
    "alt": "Female devotees sit with folded hands during morning puja on the lawn at BAPS Shri Swaminarayan Mandir, Chino Hills.",
    "sourceImageHref": "https://na.baps.org/_next/static/media/samuhpuja.85aa649b.jpg",
    "sourceContext": "Morning puja, Chino Hills, California. A photographed moment of prayer and reflection, used as context for the atma theme rather than a depiction of the soul",
    "sourceHref": "https://na.baps.org/learn/our-values/spirituality",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "width": 1440,
    "height": 960,
    "kind": "photograph"
  },
  "the-atmas-journey": {
    "src": "/gallery/the-atmas-journey.webp",
    "alt": "A family walks up the steps toward the entrance of BAPS Shri Swaminarayan Mandir, Chicago, framed by carved stone columns.",
    "sourceImageHref": "https://na.baps.org/_next/static/media/home-hero.3cf1fa77.jpg",
    "sourceContext": "A family visiting BAPS Shri Swaminarayan Mandir, Chicago, Illinois. The approach to a sacred space is an editorial connection to the journey theme, not a representation of the atma’s path",
    "sourceHref": "https://na.baps.org/learn/our-values/spirituality",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "width": 1440,
    "height": 493,
    "kind": "photograph"
  },
  "a-map-for-reflection": {
    "src": "/gallery/a-map-for-reflection.webp",
    "alt": "Young participants sit in a circle on a lawn for a BAPS goshti, or group discussion.",
    "sourceImageHref": "https://www.baps.org/Data/Sites/1/Media/GalleryImages/19800/WebImages/Southeast_Kishore_Kishori_Shibir2019_18.jpg",
    "sourceContext": "Goshti, or group discussion, pictured on the official BAPS North America spirituality page. Shared reflection provides context for the exhibition’s map metaphor; no doctrinal chart is depicted",
    "sourceHref": "https://na.baps.org/learn/our-values/spirituality",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "width": 1198,
    "height": 799,
    "kind": "photograph"
  },
  "human-values": {
    "src": "/gallery/human-values.webp",
    "alt": "Mahant Swami Maharaj joins others in planting a tree in Toronto, Canada.",
    "sourceHref": "https://na.baps.org/learn/our-values/service",
    "sourceImageHref": "https://na.baps.org/_next/static/media/service.0100626e.jpg",
    "sourceContext": "Mahant Swami Maharaj plants a tree in Toronto · BAPS North America service",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "width": 1200,
    "height": 718,
    "kind": "photograph"
  },
  "rooted-in-tradition": {
    "src": "/gallery/rooted-in-tradition.webp",
    "alt": "A younger person supports an elder as they walk together through a courtyard.",
    "sourceHref": "https://research.baps.org/about-education/",
    "sourceImageHref": "https://research.baps.org/wp-content/uploads/2020/11/Slide-4-2-scaled.jpg",
    "sourceContext": "Value-based learning · BAPS Swaminarayan Research education",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "width": 1440,
    "height": 1081,
    "kind": "photograph"
  },
  "an-act-of-kindness": {
    "src": "/gallery/an-act-of-kindness.webp",
    "alt": "BAPS London volunteers in reflective vests collect litter from a neighbourhood pavement.",
    "sourceHref": "https://londonmandir.baps.org/2024/03/great-british-spring-clean/",
    "sourceImageHref": "https://londonmandir.baps.org/images/2024/03/20240330-GBSpringClean-08.jpg",
    "sourceContext": "Great British Spring Clean · London · 30 March 2024",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "width": 1058,
    "height": 795,
    "kind": "photograph"
  },
  "shastra-scripture": {
    "src": "/gallery/shastra-scripture.webp",
    "alt": "A close view of an open text in Devanagari script resting on a wooden surface.",
    "sourceHref": "https://research.baps.org/about-education/",
    "sourceImageHref": "https://research.baps.org/wp-content/uploads/2020/11/Slide-5-min-scaled.jpg",
    "sourceContext": "Textual learning · BAPS Swaminarayan Research education",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "width": 1440,
    "height": 960,
    "kind": "photograph"
  },
  "mandir-sacred-space": {
    "src": "/gallery/mandir-sacred-space.webp",
    "alt": "The carved stone towers, broad front steps and landscaped courtyard of BAPS Swaminarayan Akshardham in Robbinsville, New Jersey, USA.",
    "sourceHref": "https://usa.akshardham.org/explore",
    "sourceImageHref": "https://media.baps.dev/wp-content/uploads/2023/09/09181239/04.-BAPS-Swaminarayan-Akshardham.jpeg",
    "sourceContext": "BAPS Swaminarayan Akshardham Mahamandir, Robbinsville, New Jersey, USA · official campus gallery",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "width": 1440,
    "height": 959,
    "kind": "photograph"
  },
  "sant-guru-living-guidance": {
    "src": "/gallery/pramukh-swami-maharaj.webp",
    "name": "Pramukh Swami Maharaj",
    "alt": "Pramukh Swami Maharaj in saffron robes, smiling gently.",
    "sourceHref": "https://londonmandir.baps.org/about/his-holiness-pramukh-swami-maharaj/",
    "sourceImageHref": "https://londonmandir.baps.org/images/2011/01/psm_001_Main.jpeg",
    "sourceContext": "Pramukh Swami Maharaj · official BAPS London profile",
    "credit": "Photo: BAPS Swaminarayan Sanstha",
    "width": 667,
    "height": 312,
    "kind": "photograph",
    "companion": {
      "src": "/gallery/sant-guru-living-guidance.webp",
      "name": "Mahant Swami Maharaj",
      "alt": "Mahant Swami Maharaj seated in saffron robes with his hands joined in greeting.",
      "sourceHref": "https://londonmandir.baps.org/about/his-holiness-mahant-swami-maharaj/",
      "sourceImageHref": "https://londonmandir.baps.org/images/2018/09/msmRGB_main.jpg",
      "sourceContext": "Mahant Swami Maharaj · official BAPS London profile",
      "credit": "Photo: BAPS Swaminarayan Sanstha",
      "width": 667,
      "height": 445,
      "kind": "photograph"
    }
  }

};
