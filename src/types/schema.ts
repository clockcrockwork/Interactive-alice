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

// experience-demo.schema.json
/**
 * Composition plan for one standalone concept demo under /demos/: its shots, their beats, and the narrative segment ids each beat carries, in reading order. Holds no visible text. A demo is not a story Scene: it has no pacing plan, no part, and its page is built by build/demos.ts rather than the story runtime. See docs/concept-demos.md.
 */
export interface ExperienceConceptDemoFile {
  /**
   * Optional editor hint; not part of the data.
   */
  $schema?: string;
  /**
   * Demo id; also the directory of its page and of its code under src/demos/.
   */
  id: string;
  /**
   * The chapter whose localized title names this demo.
   */
  titleChapter: number;
  /**
   * @minItems 1
   */
  shots: [
    {
      id: string;
      /**
       * @minItems 1
       */
      beats: [
        {
          id: string;
          /**
           * Optional staging cue the demo's code may look up, so code addresses a moment by what happens in it rather than by a beat id or an index.
           */
          cue?: string;
          segments: string[];
        },
        ...{
          id: string;
          /**
           * Optional staging cue the demo's code may look up, so code addresses a moment by what happens in it rather than by a beat id or an index.
           */
          cue?: string;
          segments: string[];
        }[],
      ];
    },
    ...{
      id: string;
      /**
       * @minItems 1
       */
      beats: [
        {
          id: string;
          /**
           * Optional staging cue the demo's code may look up, so code addresses a moment by what happens in it rather than by a beat id or an index.
           */
          cue?: string;
          segments: string[];
        },
        ...{
          id: string;
          /**
           * Optional staging cue the demo's code may look up, so code addresses a moment by what happens in it rather than by a beat id or an index.
           */
          cue?: string;
          segments: string[];
        }[],
      ];
    }[],
  ];
  /**
   * Optional: a story section of titleChapter whose localized title names this demo instead of the chapter's, for a second demo drawn from the same chapter.
   */
  titleSection?: string;
  /**
   * Optional: the ground the figures stand on, light when absent. A dark ground (the night wood, the court) gives the engraved figures a paper rim so they keep their edge; see docs/art-trials.md.
   */
  ground?: 'light' | 'dark';
  /**
   * Optional: true when this demo's first frame is the previous demo's last, one moment of the book across two pages (see docs/concept-demos.md, Joins). The index deals such cards over the card before.
   */
  joinsPrevious?: boolean;
  /**
   * Optional: the staging contract. What this demo's code reads out of its own sentences, per segment it stages, so a locale whose text does not provide it fails the gate instead of drawing nothing. scripts/check-experience.py verifies every listed segment, in every locale that publishes the demo, against that locale's profile in text/locales.json. See docs/text-experience-binding.md, Language differences.
   */
  reads?: {
    /**
     * Segments in which the stage finds a word on display: each must set at least one run apart by a method its locale declares (setApart: quotes, capitals).
     *
     * @minItems 1
     */
    setApart?: [string, ...string[]];
    /**
     * Segments that name a letter as a letter: each must set apart a run of exactly one grapheme (a quoted character, or a capital standing alone where the locale sets apart by capitals).
     *
     * @minItems 1
     */
    letter?: [string, ...string[]];
    /**
     * Segments whose words after a colon are the thing the stage shows: each must hold a colon of either width followed by words.
     *
     * @minItems 1
     */
    moral?: [string, ...string[]];
    /**
     * Segments the stage draws as a noise, a grapheme at a time: each must be of kind sound in the chapter structure, and non-empty.
     *
     * @minItems 1
     */
    sound?: [string, ...string[]];
  };
  /**
   * Optional: the realia ids this demo reads (text/locales/<locale>/realia.json). The build writes the locale's entries for just these ids onto the page as data-realia, and the shell's realia(id) reads them.
   *
   * @minItems 1
   */
  realia?: [string, ...string[]];
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
       * How far this shot stays render-active into the next shot's span, as a fraction of that span. 0 is a hard cut and is the default. Progress-neutral like weight: it moves no boundary, changes no beat's owner, and adds nothing to the scene's scroll distance; it only keeps the outgoing shot drawing while the incoming one is already the primary. The last shot has nothing to hand over to, so it may not carry one. See docs/scene-shot-model.md.
       */
      overlap?: number;
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
       * How far this shot stays render-active into the next shot's span, as a fraction of that span. 0 is a hard cut and is the default. Progress-neutral like weight: it moves no boundary, changes no beat's owner, and adds nothing to the scene's scroll distance; it only keeps the outgoing shot drawing while the incoming one is already the primary. The last shot has nothing to hand over to, so it may not carry one. See docs/scene-shot-model.md.
       */
      overlap?: number;
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
 * The languages the experience can be read in, their authoring budgets, and the locale profile: what each language IS, declared once, so that build, CSS and runtime read these facts and never infer them from a language name. See docs/text-experience-binding.md, Language differences.
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
      /**
       * How this language marks a word that is on display (written on a thing, named as a word), in order of preference: 'quotes' is any paired quotation marks, corner brackets included; 'capitals' is an all-capitals run of two or more letters, a capitalised word of five or more letters, or a capital standing alone as a letter. scripts/check-experience.py verifies a demo's declared reads against exactly these methods.
       *
       * @minItems 1
       */
      setApart: ['quotes' | 'capitals', ...('quotes' | 'capitals')[]];
      /**
       * How a line is split into the units a stage lights or lays out one at a time (sung words, the tail's chunks, a label's two lines): 'spaces' when the language writes its units with spaces between them (phrase spaces count), 'segmenter' when it does not, so Intl.Segmenter finds the words. One helper implements both: units() in src/demos/shell/words.ts.
       */
      wordUnit: 'spaces' | 'segmenter';
      /**
       * How speech and thought are set apart from narration: 'italic' where the script has an italic, 'slip' (a warmer slip, never a synthesised slant) where it does not. Written to the page as data-emphasis.
       */
      emphasis: 'italic' | 'slip';
      /**
       * Whether the script's glyphs fill the em box ('full': CJK, kana, Hangul) or not ('half'). Drives the smaller caption size and the looser leading; written to the page as data-glyph-width. For a mixed run, isWide() in words.ts remains the per-character truth.
       */
      glyphWidth: 'half' | 'full';
      /**
       * The Intl locale tag numbers (and words, for the segmenter) are formatted with, e.g. 'en-GB', 'ja-JP'. A demo never passes the page's lang to Intl itself; it asks shell.locale.
       */
      numbers: string;
      notes?: string;
    };
  };
}

// realia.schema.json
/**
 * The things a joke or a sentence is ABOUT, in one language, which a stage draws or measures: what the Cat hears instead of a pig, the things that begin with the sisters' letter, the measure Alice's height is given in. Text layer: keyed by stable ids, it may name a thing but never a scene, shot, beat or demo. Required for every locale in full, like ui.json, and ids are added only when a stage needs one. A demo declares the ids it reads (realia in its demo file); the build writes this locale's entries for just those ids onto the page. See docs/text-experience-binding.md, Language differences.
 */
export interface LocaleRealia {
  /**
   * Optional editor hint; not part of the data.
   */
  $schema?: string;
  /**
   * Must equal the directory name, so a copied file cannot silently claim another language.
   */
  locale: string;
  realia: {
    /**
     * The thing the Cheshire Cat hears instead of a pig: the word in this language's text that rhymes with or nearly sounds like its word for pig.
     */
    'cat-mishearing': {
      /**
       * A figure id in the art registry, or a figure name the stage that draws it knows.
       */
      picture: string;
    };
    /**
     * The things the Dormouse's sisters drew, all beginning with this language's letter, in the order the sentence lists them.
     *
     * @minItems 1
     */
    'm-things': [
      {
        /**
         * A figure id in the art registry, or a figure name the stage that draws it knows.
         */
        picture: string;
      },
      ...{
        /**
         * A figure id in the art registry, or a figure name the stage that draws it knows.
         */
        picture: string;
      }[],
    ];
    /**
     * The measure this language's text gives Alice's height in. Its label is UI copy (demoHeightUnit); numbers are formatted with the locale profile's numbers tag.
     */
    height: {
      /**
       * A stable name for the unit, for tests and the page; never shown.
       */
      unit: string;
      /**
       * How many of this unit make one inch.
       */
      perInch: number;
      /**
       * The height, in this unit, the text names as hers: the reading a stage marks with a notch (three inches; one finger).
       */
      notch: number;
    };
    /**
     * The marks this language's readers write for yes and for no, as the jury writes them on their slates (important, unimportant): a tick and a cross, or a circle and a cross where a tick reads as wrong. Shapes a stage draws, never letters.
     */
    marks: {
      /**
       * The shape for yes: a tick, a circle, or a cross.
       */
      yes: 'check' | 'circle' | 'cross';
      /**
       * The shape for no: a tick, a circle, or a cross.
       */
      no: 'check' | 'circle' | 'cross';
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
    /**
     * Shown as the heading of the concept-demo index.
     */
    demosTitle: string;
    /**
     * One line under the demo index heading.
     */
    demosIntro: string;
    /**
     * Link from a demo back to the demo index.
     */
    demoBack: string;
    /**
     * Link from a demo to the next demo.
     */
    demoNext: string;
    /**
     * Label of the motion toggle while ambient motion is playing.
     */
    demoPause: string;
    /**
     * Rabbit hole: a button to look closely at a map on the well wall while falling.
     */
    demoLookMap: string;
    /**
     * Rabbit hole: close the map and look down the well again.
     */
    demoLookAway: string;
    /**
     * Drink Me: a button to lift the low curtain before the little door is found.
     */
    demoPeekCurtain: string;
    /**
     * Pool of tears: tilt the water to the left (the button form of tilting the phone).
     */
    demoLeanLeft: string;
    /**
     * Pool of tears: tilt the water to the right.
     */
    demoLeanRight: string;
    /**
     * Caterpillar: hint that holding the puff button blows a bigger smoke ring.
     */
    demoPuffHold: string;
    /**
     * Cheshire Cat: the reader chooses the Cat goes tail first; the grin always last.
     */
    demoVanishTail: string;
    /**
     * Cheshire Cat: the reader chooses the Cat goes head first; the grin always last.
     */
    demoVanishHead: string;
    /**
     * Tea-party: status when the reader moves round into a used place.
     */
    demoDirtySeat: string;
    /**
     * Croquet: a button to settle the flamingo before it sulks and twists away.
     */
    demoStrokeFlamingo: string;
    /**
     * Croquet: status when the flamingo has been left alone too long.
     */
    demoFlamingoSulks: string;
    /**
     * Trial: lean out of the way of the flying cards, to the left.
     */
    demoDodgeLeft: string;
    /**
     * Trial: lean out of the way of the flying cards, to the right.
     */
    demoDodgeRight: string;
    /**
     * Trial: status when a card misses her.
     */
    demoDodged: string;
    /**
     * The Duchess: a button that blows the latest moral ribbon away over the croquet-ground.
     */
    demoFlingMoral: string;
    /**
     * The witnesses: a button that puts the cheering guinea-pig into the officers' bag before they do.
     */
    demoSuppressGuineaPig: string;
    /**
     * The witnesses: a button that turns the Lizard in the jury-box the right way up before Alice does.
     */
    demoRightLizard: string;
    /**
     * Drink Me: turn the bottle to look for a poison label (there is none).
     */
    demoTurnBottle: string;
    /**
     * Drink Me: try to climb the glass table's leg to the key; she slides down.
     */
    demoClimbLeg: string;
    /**
     * Pool of tears: shed one giant tear; the pool rises a notch.
     */
    demoCryTear: string;
    /**
     * Pool of tears: wave the Rabbit's fan; each wave shrinks her.
     */
    demoFan: string;
    /**
     * Caucus-race: give the focused runner a comfit (the keyboard's way to feed).
     */
    demoGiveComfit: string;
    /**
     * A Long Tale: magnify the words of the tail where the reader is.
     */
    demoReadTail: string;
    /**
     * Growing in the House: her foot up the chimney kicks in a puff of soot.
     */
    demoWiggleFoot: string;
    /**
     * There Goes Bill: a guinea-pig holds up Bill's head for the brandy.
     */
    demoHoldHead: string;
    /**
     * There Goes Bill: move the crowd by the hedge under the falling Bill.
     */
    demoCatchBill: string;
    /**
     * Caterpillar: dip her long neck down into the tree tops.
     */
    demoDipLeaves: string;
    /**
     * Caterpillar: accessible name of the tape-measure that reads her height, naming the unit the locale's realia measure it in (text/locales/<locale>/realia.json, height).
     */
    demoHeight: string;
    /**
     * Caterpillar: the name of that unit, printed at the head of the tape: the unit of the locale's realia height, never a second choice of unit.
     */
    demoHeightUnit: string;
    /**
     * Pig and Pepper: unfold the Queen's invitation, as large as the Footman.
     */
    demoOpenLetter: string;
    /**
     * Pig and Pepper: look at the grinning cat on the hearth.
     */
    demoLookCat: string;
    /**
     * Cheshire Cat: the pig from the kitchen trots across the wood.
     */
    demoCallPig: string;
    /**
     * Cheshire Cat: answer "pig" to the Cat's "pig, or fig?".
     */
    demoPig: string;
    /**
     * Cheshire Cat: answer "fig" to the Cat's "pig, or fig?".
     */
    demoFig: string;
    /**
     * No Room: tap along with the Hatter's song; bats flap across the sky.
     */
    demoSingAlong: string;
    /**
     * No Room: try the raven against the writing-desk; they never match.
     */
    demoAnswerRiddle: string;
    /**
     * Dormouse: first-touch hint that the treacle can be stirred.
     */
    demoStirTreacle: string;
    /**
     * Dormouse: pull a little bucket of treacle up the spiral.
     */
    demoDrawTreacle: string;
    /**
     * Dormouse: turn a floating M into a thing that begins with M.
     */
    demoDrawM: string;
    /**
     * Croquet: during the quarrel, a tap makes the players quarrel louder.
     */
    demoStirQuarrel: string;
    /**
     * Croquet: turn over a gardener lying face down to see which card it is.
     */
    demoTurnCard: string;
    /**
     * The Duchess: Alice shrugs the Duchess's sharp chin off her shoulder.
     */
    demoShrug: string;
    /**
     * Mock Turtle: break the long silence; the Mock Turtle sobs louder.
     */
    demoClearThroat: string;
    /**
     * Mock Turtle: the conger-eel drawls, stretches and faints in coils.
     */
    demoWakeEel: string;
    /**
     * The witnesses: catch the King writing Rule Forty-two on the spot.
     */
    demoKingsNotebook: string;
    /**
     * Sentence First: the dream comes back (the other half of Open her eyes).
     */
    demoCloseEyes: string;
    /**
     * Sentence First: hand a keepsake to the little children of the after-time.
     */
    demoGiveChildren: string;
    /**
     * Rabbit hole: Dinah, in the dream of cats and bats, pounces at the bat.
     */
    demoCallDinah: string;
    /**
     * Riverbank: status after the reader turns a page of her sister's book.
     */
    demoPageEmpty: string;
    /**
     * Riverbank: status after the reader picks a daisy.
     */
    demoChainLonger: string;
    /**
     * Riverbank: status after the reader looks at the Rabbit's watch.
     */
    demoWatchSpins: string;
    /**
     * The Duchess: status after the reader shrugs the chin off.
     */
    demoShrugged: string;
    /**
     * Croquet: status after the reader turns a face-down gardener over.
     */
    demoCardTurned: string;
    /**
     * Croquet: status after the reader strikes the hedgehog.
     */
    demoStruck: string;
    /**
     * Index: heading of the picker of how the figures are drawn (engraved, the default; flat; cut paper).
     */
    demoArtTitle: string;
    /**
     * Index: art style, the figures in flat tints, as first drawn.
     */
    demoArtFlat: string;
    /**
     * Index: note under the flat art style.
     */
    demoArtFlatNote: string;
    /**
     * Index: art style, ink line and hatching; the chosen look and the default.
     */
    demoArtEngraved: string;
    /**
     * Index: note under the engraved art style.
     */
    demoArtEngravedNote: string;
    /**
     * Index: art style, shapes cut from tinted paper.
     */
    demoArtPaper: string;
    /**
     * Index: note under the cut-paper art style.
     */
    demoArtPaperNote: string;
    /**
     * Toggle at the end of a demo: when on, the page goes to the next scene by itself after a pause at the end.
     */
    demoAuto: string;
    /**
     * Label of the motion toggle while ambient motion is paused.
     */
    demoResume: string;
    /**
     * Hint at the top of a demo that scrolling moves the story on.
     */
    demoScrollHint: string;
    /**
     * Technique note on the demo index card for the rabbit hole.
     */
    demoTechRabbitHole: string;
    /**
     * Technique note on the demo index card for the Dormouse's tale.
     */
    demoTechDormouse: string;
    /**
     * Technique note on the demo index card for the trial.
     */
    demoTechTrial: string;
    /**
     * Button that takes the marmalade jar off its shelf.
     */
    demoGrabJar: string;
    /**
     * Status once the jar is tucked into a cupboard.
     */
    demoJarTucked: string;
    /**
     * Button that pinches the Dormouse awake.
     */
    demoPinch: string;
    /**
     * Button that brushes the cards off the screen.
     */
    demoBeatOff: string;
    /**
     * Note shown when the well cannot be drawn with WebGL and is drawn flat instead.
     */
    demoFlatWell: string;
    /**
     * Note shown when the visitor prefers reduced motion.
     */
    demoReducedMotion: string;
    /**
     * Technique note on the demo index card for Drink Me.
     */
    demoTechDrinkMe: string;
    /**
     * Technique note on the demo index card for the pool of tears.
     */
    demoTechPool: string;
    /**
     * Technique note on the demo index card for the Caucus-race.
     */
    demoTechCaucus: string;
    /**
     * Button that drinks from the bottle.
     */
    demoDrink: string;
    /**
     * Button that eats the cake.
     */
    demoEat: string;
    /**
     * Button that stirs the water.
     */
    demoRipple: string;
    /**
     * Accessible name of a runner in the Caucus-race; pressing it stops or starts that runner.
     */
    demoRunToggle: string;
    /**
     * Button that sets every runner running.
     */
    demoRaceStart: string;
    /**
     * Technique note on the demo index card for the White Rabbit's house.
     */
    demoTechRabbitHouse: string;
    /**
     * Technique note on the demo index card for Bill the Lizard.
     */
    demoTechBill: string;
    /**
     * Technique note on the demo index card for the Cheshire Cat.
     */
    demoTechCheshire: string;
    /**
     * Button that makes the snatch out of the window.
     */
    demoSnatch: string;
    /**
     * Button that gives the sharp kick up the chimney.
     */
    demoKick: string;
    /**
     * Button that makes the Cat vanish or appear.
     */
    demoVanish: string;
    /**
     * Heading of the Alice picker on the demo index.
     */
    demoAliceTitle: string;
    /**
     * Name of the blue Alice.
     */
    demoAliceBlue: string;
    /**
     * One line under the blue Alice: the look everyone knows.
     */
    demoAliceBlueNote: string;
    /**
     * Name of the yellow Alice.
     */
    demoAliceYellow: string;
    /**
     * One line under the yellow Alice: the earlier look, for those who remember it.
     */
    demoAliceYellowNote: string;
    /**
     * Signpost button toward the Hatter's house.
     */
    demoWayHatter: string;
    /**
     * Signpost button toward the March Hare's house.
     */
    demoWayHare: string;
    /**
     * Button that calls the Cat to another bough.
     */
    demoCallCat: string;
    /**
     * Accessible name of a door in the hall; pressing it tries the lock.
     */
    demoTryDoor: string;
    /**
     * Hint under the Cheshire Cat: tap the wood to move the Cat there.
     */
    demoTeleportHint: string;
    /**
     * Button that puts a thing taken from a shelf back into a cupboard.
     */
    demoPutBack: string;
    /**
     * Accessible name of a juror; pressing one flips what it writes on its slate.
     */
    demoJurorToggle: string;
    /**
     * Label of the sound toggle while sound is off.
     */
    demoSoundOn: string;
    /**
     * Label of the sound toggle while sound is on.
     */
    demoSoundOff: string;
    /**
     * Button that asks to steer the view with the phone's tilt.
     */
    demoTilt: string;
    /**
     * Status once tilt steering is on.
     */
    demoTiltOn: string;
    /**
     * Button that picks up the little golden key.
     */
    demoTakeKey: string;
    /**
     * Accessible-name suffix for the runner the reader chose.
     */
    demoMyRunner: string;
    /**
     * Hint that a comfit can be dragged to a runner.
     */
    demoFeed: string;
    /**
     * Button that shakes the house.
     */
    demoShakeHouse: string;
    /**
     * Index card: what the Caterpillar demo shows.
     */
    demoTechCaterpillar: string;
    /**
     * Index card: what the croquet demo shows.
     */
    demoTechCroquet: string;
    /**
     * Index card: what the Lobster Quadrille demo shows.
     */
    demoTechQuadrille: string;
    /**
     * Button that turns a page of the sister's book on the riverbank.
     */
    demoTurnPage: string;
    /**
     * Button that picks a daisy for Alice's chain on the riverbank.
     */
    demoPickDaisy: string;
    /**
     * Button that looks at the White Rabbit's watch; its hands spin for a moment.
     */
    demoLookWatch: string;
    /**
     * Button that makes the Caterpillar blow a smoke ring.
     */
    demoPuff: string;
    /**
     * Button on the left bit of mushroom: nibbling it makes her taller.
     */
    demoNibbleLeft: string;
    /**
     * Button on the right bit of mushroom: nibbling it makes her shorter.
     */
    demoNibbleRight: string;
    /**
     * Hint that the pointer bends her neck.
     */
    demoBendNeck: string;
    /**
     * Button on the Pigeon: shoo it away for a moment.
     */
    demoShoo: string;
    /**
     * Hint that a drag over a white rose paints it red.
     */
    demoPaintRose: string;
    /**
     * Button that swings the flamingo at the hedgehog.
     */
    demoStrike: string;
    /**
     * Button that brings the flamingo back.
     */
    demoCatchFlamingo: string;
    /**
     * Button that puts the gardeners into the flower-pot.
     */
    demoHideGardeners: string;
    /**
     * Button that throws the lobster out to sea.
     */
    demoThrowLobster: string;
    /**
     * Button that puts the reader into the line of dancers.
     */
    demoJoinDance: string;
    /**
     * Button that turns a somersault in the sea.
     */
    demoSomersault: string;
    /**
     * Button that wakes the sister from her dream.
     */
    demoOpenEyes: string;
    /**
     * Button on the snail in the song: it draws into its shell.
     */
    demoSnail: string;
    /**
     * Technique note on the demo index card for Pig and Pepper.
     */
    demoTechPig: string;
    /**
     * Technique note on the demo index card for the Mock Turtle's story.
     */
    demoTechMockTurtle: string;
    /**
     * Button that makes the two footmen bow again, tangling their curls.
     */
    demoBow: string;
    /**
     * Button, and the cauldron's label: more pepper, and a sneeze.
     */
    demoPepper: string;
    /**
     * Button that ducks the reader under the flying pots and pans.
     */
    demoDuck: string;
    /**
     * Label on a pan stuck to the glass: a tap bats it away.
     */
    demoBatPan: string;
    /**
     * Button that knots the baby into a bundle in her arms.
     */
    demoHoldTight: string;
    /**
     * Label on the baby in her arms: a tap makes it grunt and turn a little more pig.
     */
    demoPokeBaby: string;
    /**
     * Button on the Mock Turtle: comforting him makes him sigh harder and the sea heave.
     */
    demoComfort: string;
    /**
     * Button that sends a wave over the subject words written on the sand.
     */
    demoWash: string;
    /**
     * Button that makes one of the subject words writhe; tapping a word does the same.
     */
    demoUglify: string;
    /**
     * Button in the Mouse's tale that slides the tail-text along its curve; a drag on the tail does the same.
     */
    demoPullTail: string;
    /**
     * Button at the knot in the Mouse's tale: trying to undo it only offends the Mouse.
     */
    demoUndoKnot: string;
    /**
     * Status line after a failed undo of the knot: it holds, and the Mouse takes offence.
     */
    demoKnotHolds: string;
    /**
     * Label on each member of the party once the sensation starts: a tap sends it off at once.
     */
    demoBirdLeave: string;
    /**
     * Technique note on the demo index card for the riverbank.
     */
    demoTechRiverbank: string;
    /**
     * Technique note on the demo index card for the Mouse's tale.
     */
    demoTechMouseTale: string;
    /**
     * Index card: what the witnesses demo shows.
     */
    demoTechWitnesses: string;
    /**
     * Index card: what the Duchess demo shows.
     */
    demoTechDuchess: string;
    /**
     * Technique note on the demo index card for the tea-party.
     */
    demoTechTeaParty: string;
    /**
     * Button at the tea-party that lifts the pot-lids: there is nothing but tea.
     */
    demoLookForWine: string;
    /**
     * Button at the tea-party that spreads the best butter on the Hatter's watch.
     */
    demoButterWatch: string;
    /**
     * Button at the tea-party that whispers a hint to Time: round goes the clock.
     */
    demoWhisperTime: string;
    /**
     * Button at the tea-party that moves everyone one seat along the table.
     */
    demoMoveRound: string;
    /**
     * Demo index: the name of the language switch, read by assistive technology; each choice is named in its own language.
     */
    demoLanguages: string;
  };
}
