# Source text: provenance and licensing

This directory holds the unmodified English source text used as narrative
material for Interactive Alice, stored as one plain-text file per chapter.

## Work

| Field | Value |
| --- | --- |
| Title | *Alice's Adventures in Wonderland* |
| Author | Lewis Carroll (Charles Lutwidge Dodgson, 1832–1898) |
| First published | 1865 |
| Language | English |

## Where the files come from

| Field | Value |
| --- | --- |
| Source | Project Gutenberg, eBook #11 |
| Landing page | https://www.gutenberg.org/ebooks/11 |
| File retrieved | https://www.gutenberg.org/files/11/11-0.txt |
| Transcription | The Millennium Fulcrum Edition 3.0 |

`manifest.json` records the retrieval date, the SHA-256 of the downloaded
file, and the SHA-256, title, and length of every chapter file. Re-run
`scripts/fetch-source-text.py` to regenerate the whole directory.

## Copyright status

The 1865 work is in the public domain: its author died in 1898, so copyright
has expired in the United States, the United Kingdom, the European Union,
Japan, and every other jurisdiction using a life-plus-70-years term or
shorter. No permission is required to reproduce, adapt, translate, or
perform it.

Project Gutenberg does not claim copyright in its transcriptions of
public-domain works. Its ebook files carry a header and footer containing the
Project Gutenberg Trademark License, which applies to the distribution of
files bearing the "Project Gutenberg" name rather than to the prose itself.
Those header and footer blocks are stripped by the fetch script, so the files
in this directory contain only public-domain text and the project makes no
use of the Project Gutenberg trademark.

Project Gutenberg's own terms are at https://www.gutenberg.org/policy/license.html.

## Attribution used in the product

Even though no licence obliges it, the shipped experience should credit both
the work and the transcription source. Recommended wording:

> Text adapted from *Alice's Adventures in Wonderland* by Lewis Carroll
> (1865), a public-domain work. English source transcription: Project
> Gutenberg eBook #11.

## Rules for this directory

- Treat these files as read-only inputs. Never hand-edit them; a change to
  the text belongs in a derived file, not here.
- Adapted, abridged, or translated copy used by scenes lives elsewhere (for
  example `text/scenes/` or locale files), so the original stays auditable.
- The public domain covers the 1865 text only. Later adaptations, including
  film and television versions and their character designs, remain
  copyrighted and are not source material for this project.
