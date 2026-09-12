// Generated from schema/*.json by build/generate-types.mjs. Do not edit by hand.
// Run `npm run types:schema` after changing a schema; CI diffs this file.

// chapter-structure.schema.json
/**
 * Language-neutral narrative skeleton for one chapter: story-section order, segment order, and who is speaking. Carries no visible text. A story section is a division of the TEXT, not a runtime Scene; Scene / Shot / Beat composition lives in experience/ and is documented in docs/text-experience-binding.md.
 */
export interface ChapterStructureFile {
  /**
   * Optional editor hint; not part of the data.
   */
  $schema?: string;
  chapter: number;
  /**
   * Path to the original public-domain chapter this was adapted from.
   */
  sourceFile: string;
  /**
   * Story sections in reading order. A section groups consecutive segments of the text; it does not describe how they are staged.
   *
   * @minItems 1
   */
  sections: [
    {
      id: string;
    },
    ...{
      id: string;
    }[],
  ];
  /**
   * Segments in reading order. One segment is one short sentence: the narrative atom that the experience displays, reads aloud, highlights, and translates.
   *
   * @minItems 1
   */
  segments: [
    {
      id: string;
      section: string;
      kind: 'narration' | 'dialogue' | 'thought' | 'sound';
      speaker?: string;
    },
    ...{
      id: string;
      section: string;
      kind: 'narration' | 'dialogue' | 'thought' | 'sound';
      speaker?: string;
    }[],
  ];
}

// characters.schema.json
/**
 * Every speaker a chapter structure may name. Language-neutral: the id is what the text structure and the runtime use, and the label is for developers. A character's name as a visitor reads it lives inside the localized sentences, not here.
 */
export interface CharacterRegistry {
  /**
   * Optional editor hint; not part of the data.
   */
  $schema?: string;
  /**
   * @minItems 1
   */
  characters: [
    {
      id: string;
      /**
       * Development and debug label only.
       */
      devLabel?: string;
      notes?: string;
    },
    ...{
      id: string;
      /**
       * Development and debug label only.
       */
      devLabel?: string;
      notes?: string;
    }[],
  ];
}

// experience-scene.schema.json
/**
 * Composition plan for one runtime Scene: its Shots, their Beats, and the narrative segment ids each Beat carries. Holds no visible text and no localized strings; text is fetched from text/locales/<locale>/ by segment id at runtime. A scene is not tied to one chapter: the chapters it draws from are derived from the referenced ids. See docs/text-experience-binding.md.
 */
export interface ExperienceSceneFile {
  /**
   * Optional editor hint; not part of the data.
   */
  $schema?: string;
  /**
   * Scene id, unique across the story.
   */
  id: string;
  /**
   * Development and debug label only. Never shown to a visitor, never translated.
   */
  devLabel?: string;
  /**
   * Shots in progression order. A Shot is one way of presenting part of the Scene; see docs/scene-shot-model.md.
   *
   * @minItems 1
   */
  shots: [
    {
      /**
       * Shot id, unique within the scene.
       */
      id: string;
      devLabel?: string;
      /**
       * Staging weight: how much longer or shorter this shot should run than its reading load alone would suggest. Relative and progress-neutral, never a scroll distance or a duration. Defaults to 1.
       */
      weight?: number;
      /**
       * Beats in progression order. A Beat is a timing unit; it may carry several segments, one, or none.
       *
       * @minItems 1
       */
      beats: [
        {
          /**
           * Beat id, unique within the scene. The addressable key is scene/shot/beat.
           */
          id: string;
          devLabel?: string;
          /**
           * Staging weight for this beat, same meaning as on a shot. Defaults to 1. A textless beat is held for one segment-equivalent times its weight.
           */
          weight?: number;
          /**
           * Segment ids, in reading order. Ids may come from more than one chapter. An empty array is valid: a beat may be pure staging with no text.
           */
          segments: string[];
        },
        ...{
          /**
           * Beat id, unique within the scene. The addressable key is scene/shot/beat.
           */
          id: string;
          devLabel?: string;
          /**
           * Staging weight for this beat, same meaning as on a shot. Defaults to 1. A textless beat is held for one segment-equivalent times its weight.
           */
          weight?: number;
          /**
           * Segment ids, in reading order. Ids may come from more than one chapter. An empty array is valid: a beat may be pure staging with no text.
           */
          segments: string[];
        }[],
      ];
    },
    ...{
      /**
       * Shot id, unique within the scene.
       */
      id: string;
      devLabel?: string;
      /**
       * Staging weight: how much longer or shorter this shot should run than its reading load alone would suggest. Relative and progress-neutral, never a scroll distance or a duration. Defaults to 1.
       */
      weight?: number;
      /**
       * Beats in progression order. A Beat is a timing unit; it may carry several segments, one, or none.
       *
       * @minItems 1
       */
      beats: [
        {
          /**
           * Beat id, unique within the scene. The addressable key is scene/shot/beat.
           */
          id: string;
          devLabel?: string;
          /**
           * Staging weight for this beat, same meaning as on a shot. Defaults to 1. A textless beat is held for one segment-equivalent times its weight.
           */
          weight?: number;
          /**
           * Segment ids, in reading order. Ids may come from more than one chapter. An empty array is valid: a beat may be pure staging with no text.
           */
          segments: string[];
        },
        ...{
          /**
           * Beat id, unique within the scene. The addressable key is scene/shot/beat.
           */
          id: string;
          devLabel?: string;
          /**
           * Staging weight for this beat, same meaning as on a shot. Defaults to 1. A textless beat is held for one segment-equivalent times its weight.
           */
          weight?: number;
          /**
           * Segment ids, in reading order. Ids may come from more than one chapter. An empty array is valid: a beat may be pure staging with no text.
           */
          segments: string[];
        }[],
      ];
    }[],
  ];
}

// experience-story.schema.json
/**
 * The runtime Scene order for the whole story, and optionally how those scenes are grouped into documents. Holds no visible text.
 */
export interface ExperienceStoryFile {
  /**
   * Optional editor hint; not part of the data.
   */
  $schema?: string;
  story: string;
  /**
   * Scenes in story order.
   *
   * @minItems 1
   */
  scenes: [
    {
      id: string;
      /**
       * Repository-relative path to the scene file.
       */
      file: string;
    },
    ...{
      id: string;
      /**
       * Repository-relative path to the scene file.
       */
      file: string;
    }[],
  ];
  /**
   * Documents, in story order. A part hosts one or more scenes; a document boundary is a delivery decision, never a scene boundary. Required: every scene belongs to exactly one document, and that grouping is declared rather than inferred. See docs/frontend-architecture.md.
   *
   * @minItems 1
   */
  parts: [
    {
      /**
       * URL segment for this document.
       */
      id: string;
      /**
       * @minItems 1
       */
      scenes: [string, ...string[]];
    },
    ...{
      /**
       * URL segment for this document.
       */
      id: string;
      /**
       * @minItems 1
       */
      scenes: [string, ...string[]];
    }[],
  ];
}

// locale-chapter.schema.json
/**
 * Visible text for one chapter in one language. Segment ids, their order, and the story sections are owned by the matching text/story/chNN.structure.json file.
 */
export interface LocaleChapterFile {
  /**
   * Optional editor hint; not part of the data.
   */
  $schema?: string;
  /**
   * BCP 47 tag, or a tag plus variant such as en-simple. Must be a key of text/locales.json.
   */
  locale: string;
  chapter: number;
  /**
   * Chapter title in this language.
   */
  title: string;
  /**
   * Story-section id to that section's title in this language. Story sections divide the text and are not runtime Scenes.
   */
  sections: {
    [k: string]: string;
  };
  /**
   * Segment id to one short sentence in this language.
   */
  segments: {
    [k: string]: string;
  };
}

// locales.schema.json
/**
 * The languages the experience can be read in, their authoring budgets, and the presentation facts a scene needs in order to lay their text out.
 */
export interface LocaleRegistry {
  /**
   * Optional editor hint; not part of the data.
   */
  $schema?: string;
  /**
   * The language of the original public-domain text in text/raw/.
   */
  sourceLocale: string;
  /**
   * The retelling every translation works from.
   */
  baseLocale: string;
  locales: {
    [k: string]: {
      name: string;
      nativeName: string;
      role: 'base' | 'translation';
      /**
       * Authoring budget per segment. A limit on how long a sentence may be written, not a promise that it fits one rendered line.
       */
      maxChars: number;
      status: 'in-progress' | 'complete';
      /**
       * Base writing direction for this language's text.
       */
      dir: 'ltr' | 'rtl';
      /**
       * CSS line-break keyword a scene should apply to this language's text.
       */
      lineBreak: 'auto' | 'loose' | 'normal' | 'strict';
      /**
       * True when spaces inside a segment are authored content, as in the Japanese phrase spacing. Such text must never be trimmed, collapsed, or re-wrapped by a template or a minifier.
       */
      significantSpaces: boolean;
      notes?: string;
    };
  };
}

// ui-strings.schema.json
/**
 * The words the site itself says in one language, as opposed to the words of the story. Every locale in text/locales.json must have this file in full: a language may be behind on chapters, but the chrome around the story cannot be half translated. Keys are added only when something on screen needs them; see docs/text-pipeline.md.
 */
export interface LocaleUIStrings {
  /**
   * Optional editor hint; not part of the data.
   */
  $schema?: string;
  /**
   * Must equal the directory name, so a copied file cannot silently claim another language.
   */
  locale: string;
  strings: {
    /**
     * Shown beside a part this language has no text for yet, on the story entry.
     */
    partPending: string;
    /**
     * Shown beside a language on the home page when some of its parts can be read and some cannot.
     */
    localePartial: string;
    /**
     * Shown beside a language on the home page when none of its parts can be read yet.
     */
    localeNone: string;
  };
}
