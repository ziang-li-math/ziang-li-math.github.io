# Ziang Li’s mathematics homepage

A static, English-only website. Open index.html locally, or upload the whole folder to a static host. No build step is needed.

## Pages

- index.html: Home, profile photograph, introduction, and contact links.
- research.html: Research notes, publications, and academic activities.
- talks.html: Talks and reports.
- interesting-math.html: Short topic introductions and preview pictures.
- topic.html?topic=grid-diagrams: A full topic page, with a unique URL for each note.
- personal.html: Personal introduction and entries.
- travel.html: Travel photo gallery, linked from Personal.
- editor.html: English content editor.

Top navigation links to each main page and highlights the current page. Topic pages link back to the list and to adjacent topics.

## Edit content

1. Open editor.html and choose a page from the sidebar.
2. Edit entries or click Add entry. Drafts are saved in this browser.
3. Click Save content.js, then replace the website’s content.js with the exported file.
4. Upload any new pictures or PDFs together with the changed content.js.

The editor does not directly modify website files. Existing bilingual browser drafts retain their English content; Chinese content is omitted from exports.

You can also edit content.js directly. Profile fields use { en: "..." }, interface text is in ui.en, and entries are in pages.en. Unavailable profile links can remain "#" and will be hidden automatically.

## Photograph and colors

Home uses assets/Liziang banshen.png. To use another photograph, change the image src in index.html. The light-blue palette is defined at the top of styles.css and editor.css. Pale blue appears in the header, illustration backgrounds, and accents; darker blue text keeps links and headings readable.

## Curriculum vitae

Home's Curriculum vitae link opens the updated `files/cv.pdf`, with a version query to refresh cached copies. The editable LaTeX source is `files/cv.tex`, revised from the user's edited CV.zip. Personal information, education dates, and colors are defined near the top. `\MasterThesis` and `\MasterSupervisors` now contain the confirmed master thesis title and linked supervisors, Prof. Stefan Friedl and Prof. Bernd Ammann. Course grades, the bachelor's thesis and supervisor, and the student-seminar dates and roles are retained from that source. There is no forced page break. Dates and titles align at the top; date ranges share a single `\daterange` format. Student-led reading seminars are the final section, with small, compact entries. Research notes match the homepage: the Alexander-polynomial note is supervised by Prof. Stefan Friedl and includes its proof summary; the master thesis note is supervised by Prof. Bernd Ammann and its introduction is `Tba`. Both supervisor names link to their homepages. Program links are copied from the homepage, and report links refer to its four existing talk reports.

The current two-page PDF has been regenerated from the latest source, with automatic pagination and clickable links. It is separately typeset: the built-in LaTeX compiler reported `Unable to find standard directories for platform`, so the exact LaTeX layout could not be verified here. To update the attachment, compile `files/cv.tex` using pdfLaTeX (for example in Overleaf), then replace `files/cv.pdf` with the resulting PDF. Alternatively, `scripts/render_cv_preview.py` reads this source and regenerates the separately typeset preview using Python and reportlab. Editing the LaTeX source alone does not update the attached PDF.

Keep `cv.pdf` and the four `rep-*.pdf` reports together in the same directory; the PDF's report links are relative. The complete homepage ZIP preserves `files/` and all website assets. The separate CV ZIP includes the source, current PDF, all four reports, and instructions, so those links also work after extraction. Program links require internet access.

Conference names in the CV match `pages.en.activities` in `content.js` verbatim, including the USTC, SUSTech, BICMR, and YMSC prefixes and years. Both the homepage content script and the CV attachment link have version queries to refresh previously cached copies.

The Home introduction includes both linked supervisors and the master thesis title. In editor.html → Research, each research note has Supervisor and Supervisor homepage URL fields, alongside its title and description. The content editor can still edit the website and its CV link, but it does not edit the LaTeX document or regenerate the PDF. If it restores a draft from before the CV was added, set Profile's CV link to `files/cv.pdf` before exporting, or preserve your unsaved work and reload the latest content as described above.

Travel photographs are copied unchanged into assets/travel/, with the supplied filenames preserved. The gallery scales photos for the layout without cropping or modifying their files. Clicking a photo, its title, or “View full size” opens the same original file. Location labels link to reference pages; mountain and rural destinations use their locality names. In editor.html → Personal, edit the gallery title and introduction under Travel photo page, and captions, paths, and locations under Travel photographs. The Personal entry’s Page link points to travel.html. If the editor restores an older browser draft, preserve any unexported work before using Discard draft and reload to load the latest content.js.

## Interesting Math

Each topic in pages.en.interesting has these fields:

- id: A unique, stable URL identifier. Keep this unchanged after sharing the link.
- title and summary: The title and short introduction in the topic list.
- image, imageAlt, imageCaption: The preview illustration and optional caption.
- blocks: Ordered text and image blocks for the full article.
- links: References, PDFs, or related resources.

New and duplicated topics receive unique IDs in the editor. They appear automatically in the list and at topic.html?topic=THE_ID. No additional HTML file is needed.

The grid-diagram topic explains grid states, the rectangle differential, gradings, and stabilization factors, with three illustrations and a closing sentence linking computation programs. Aspherical Manifolds covers classical examples, the Borel conjecture, and Lück’s “almost all” discussion, with two illustrations. The Kneser graph topic focuses on the Lovász, Greene, and Matoušek proofs, with three illustrations and “A few more surprises.” The Pontryagin–Thom topic covers framed cobordism, stable stems, the two geometric constructions, examples, and generalizations, with four illustrations. Its URL identifier remains pontryagin-isomorphism. Skein Lasagna Modules contains an honest note that the author has not studied the topic and links to the five supplied papers. Empty articles display “Full note forthcoming”; adding article content replaces this message automatically.

Text blocks support section headings (`##` and `###`), links (`[label](URL)`), bold text, inline code, and Markdown tables, alongside LaTeX. Article figures link to their full-size SVGs or images.

In the editor, use Add text / LaTeX and Insert image to build an article. Move blocks up or down to arrange them. Use $...$ for inline formulas and $$...$$ for display formulas. Enter single backslashes in the editor; JavaScript strings in content.js require double backslashes. MathJax loads from a CDN and requires internet access for formula rendering. Text, pictures, and page navigation also work offline.

Place pictures in assets/ and PDFs in files/, then enter their relative paths in the editor. Exporting content.js does not package these files.

## Publish

Upload every HTML page, content.js, app.js, stylesheets, assets/, and files/ to your static host. Relative links support hosting in a subdirectory, including GitHub Pages. Keep .nojekyll for GitHub Pages.
