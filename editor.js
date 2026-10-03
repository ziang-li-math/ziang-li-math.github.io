(function () {
  "use strict";

  const STORAGE_KEY = "math-homepage-editor-draft-v3";
  const original = deepCopy(window.SITE_CONTENT);
  const root = document.querySelector("#editor-root");
  const status = document.querySelector("#save-status");

  let content = loadDraft();
  const language = "en";
  let section = "home";

  const schemas = {
    researchNotes: {
      title: "Research notes",
      help: "Research notes, course papers, and reading notes.",
      dateKey: "date",
      fields: [
        ["date", "Date"],
        ["title", "Title"],
        ["supervisor", "Supervisor"],
        ["supervisorUrl", "Supervisor homepage URL"],
        ["description", "Description", "textarea"]
      ],
      empty: { date: "", title: "", supervisor: "", supervisorUrl: "", description: "", links: [] }
    },
    publications: {
      title: "Preprints and publications",
      help: "Preprints, published papers, and submissions.",
      dateKey: "year",
      fields: [
        ["year", "Year"],
        ["type", "Type (for example Preprint or Article)"],
        ["title", "Title"],
        ["authors", "Authors"],
        ["venue", "Journal, conference, or status"]
      ],
      empty: { year: "", type: "", title: "", authors: "", venue: "", links: [] }
    },
    activities: {
      title: "Academic activities",
      help: "Summer schools, conferences, seminars, and visits.",
      dateKey: "date",
      fields: [
        ["date", "Date"],
        ["title", "Activity name"],
        ["detail", "Location, role, or description", "textarea"]
      ],
      empty: { date: "", title: "", detail: "", links: [] }
    },
    talks: {
      title: "Talks and reports",
      help: "Seminar talks, course reports, and project presentations.",
      dateKey: "date",
      fields: [
        ["date", "Date"],
        ["type", "Type"],
        ["title", "Title"],
        ["event", "Event or course"],
        ["description", "Description", "textarea"]
      ],
      empty: { date: "", type: "", title: "", event: "", description: "", links: [] }
    },
    interesting: {
      title: "Interesting Math",
      help: "Arrange text and image blocks on each topic page. Text blocks support LaTeX.",
      dateKey: "date",
      fields: [
        ["date", "Date"],
        ["title", "Title"],
        ["id", "Topic URL identifier", "input", "Keep this identifier unchanged to preserve links. New topics can leave it blank."],
        ["summary", "Short introduction", "textarea"],
        ["image", "Preview image path or URL", "input", "For example assets/grid-diagrams.svg"],
        ["imageAlt", "Preview image description"],
        ["imageCaption", "Image caption"]
      ],
      empty: {
        date: "", title: "", summary: "", body: [], image: "", imageAlt: "", imageCaption: "",
        blocks: [{ type: "text", content: "" }], links: []
      }
    },
    personalEntries: {
      title: "Personal entries",
      help: "Notes on reading, life, travel, and other interests.",
      dateKey: "date",
      fields: [
        ["date", "Date"],
        ["title", "Title"],
        ["url", "Page link", "input", "For example travel.html; leave blank for an entry without a separate page."],
        ["summary", "Short introduction", "textarea"],
        ["body", "Body (leave a blank line between paragraphs)", "paragraphs"],
        ["image", "Image path or URL", "input", "For example assets/walk.jpg"],
        ["imageAlt", "Image alt text"],
        ["imageCaption", "Image caption"]
      ],
      empty: { date: "", title: "", summary: "", body: [""], image: "", imageAlt: "", imageCaption: "", links: [] }
    },
    travelPhotos: {
      title: "Travel photographs",
      help: "Captions, image paths, and locations on travel.html. Copy new original photos into assets/travel/ before adding their paths here.",
      fields: [
        ["title", "Photo title"],
        ["image", "Original photo path", "input", "For example assets/travel/Heidelberg.jpg"],
        ["imageAlt", "Photo description"],
        ["width", "Photo width in pixels", "input", "Optional; use the original image dimensions."],
        ["height", "Photo height in pixels", "input", "Optional; use the original image dimensions."],
        ["location", "Location", "input", "City or locality, Country"],
        ["locationUrl", "Location reference URL"]
      ],
      empty: { title: "", image: "", imageAlt: "", location: "", locationUrl: "" }
    }
  };

  function deepCopy(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadDraft() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.profile && saved.ui && saved.ui.en && saved.pages && saved.pages.en) {
        if (!Array.isArray(saved.pages.en.travelPhotos)) {
          saved.pages.en.travelPhotos = deepCopy(original.pages.en.travelPhotos || []);
          const galleryLink = original.pages.en.personalEntries.find((entry) => entry.url === "travel.html");
          if (galleryLink && !saved.pages.en.personalEntries.some((entry) => entry.url === "travel.html")) saved.pages.en.personalEntries.push(deepCopy(galleryLink));
        }
        ["travelTitle", "travelIntroduction"].forEach((key) => { if (saved.ui.en[key] === undefined) saved.ui.en[key] = original.ui.en[key]; });
        saved.pages.en.travelPhotos.forEach((photo) => {
          if (photo.title === "A photo from a tricky angel") photo.title = "A photo from a tricky angle";
          if (photo.image === "assets/travel/A photo from a tricky angel.jpg") photo.image = "assets/travel/A photo from a tricky angle.jpg";
        });
        delete saved.ui.zh;
        delete saved.pages.zh;
        Object.values(saved.profile).forEach((field) => { if (typeof field === "object") delete field.zh; });
        saved.pages.en.interesting.forEach((item) => {
          const current = original.pages.en.interesting.find((topic) => topic.title === item.title);
          if (current) ["id", "summary", "image", "imageAlt"].forEach((key) => { if (!item[key]) item[key] = current[key]; });
        });
        status.textContent = "Saved draft restored";
        return saved;
      }
    } catch (error) {
      console.warn("Could not read the saved editor draft.", error);
    }
    return deepCopy(original);
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function saveDraft(message) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      status.textContent = message || `Draft saved at ${time}`;
    } catch (error) {
      status.textContent = "Unable to save draft. Please export content.js.";
      console.warn("Could not save the editor draft.", error);
    }
  }

  function showToast(message) {
    const oldToast = document.querySelector(".toast");
    if (oldToast) oldToast.remove();
    const toast = element("div", "toast", message);
    document.body.append(toast);
    window.setTimeout(() => toast.remove(), 3200);
  }

  function panel(title, description) {
    const wrapper = element("div", "editor-panel");
    const header = element("div", "panel-header");
    const headingGroup = element("div");
    const heading = element("h2", "", title);
    heading.append(element("span", "language-badge", "Editing English"));
    headingGroup.append(heading, element("p", "", description));
    header.append(headingGroup);
    wrapper.append(header);
    return wrapper;
  }

  function formSection(title, help) {
    const box = element("section", "form-section");
    const header = element("div", "form-section-header");
    header.append(element("h3", "", title));
    box.append(header);
    if (help) box.append(element("p", "section-help", help));
    return { box, header };
  }

  function field(labelText, value, onChange, options = {}) {
    const wrapper = element("div", "field");
    const id = `field-${Math.random().toString(36).slice(2)}`;
    const label = element("label", "", labelText);
    label.htmlFor = id;
    const input = document.createElement(options.textarea ? "textarea" : "input");
    input.id = id;
    input.value = value || "";
    if (!options.textarea) input.type = options.type || "text";
    input.addEventListener("input", () => {
      onChange(input.value);
      saveDraft();
      if (options.onSummaryChange) options.onSummaryChange(input.value);
    });
    wrapper.append(label, input);
    if (options.help) wrapper.append(element("span", "field-help", options.help));
    return wrapper;
  }

  function addButton(text, onClick) {
    const button = element("button", "add-button", text);
    button.type = "button";
    button.addEventListener("click", onClick);
    return button;
  }

  function paragraphEditor(items, onChange) {
    const wrapper = element("div");
    const rows = element("div");

    function drawRows() {
      rows.replaceChildren();
      items.forEach((paragraph, index) => {
        const row = element("div", "paragraph-row");
        const area = document.createElement("textarea");
        area.value = paragraph;
        area.setAttribute("aria-label", `Paragraph ${index + 1}`);
        area.addEventListener("input", () => {
          items[index] = area.value;
          onChange(items);
          saveDraft();
        });
        const remove = element("button", "icon-button", "×");
        remove.type = "button";
        remove.title = "Remove this paragraph";
        remove.addEventListener("click", () => {
          items.splice(index, 1);
          onChange(items);
          saveDraft();
          drawRows();
        });
        row.append(area, remove);
        rows.append(row);
      });
      if (!items.length) rows.append(element("div", "empty-state", "No paragraphs yet."));
    }

    const add = addButton("Add paragraph", () => {
      items.push("");
      onChange(items);
      saveDraft();
      drawRows();
      rows.lastElementChild?.querySelector("textarea")?.focus();
    });
    wrapper.append(rows, add);
    drawRows();
    return wrapper;
  }

  const mathPreviewTimers = new WeakMap();

  function updateMathPreview(preview, value) {
    if (window.MathJax && typeof window.MathJax.typesetClear === "function") {
      window.MathJax.typesetClear([preview]);
    }
    preview.replaceChildren();
    const paragraphs = String(value).split(/\n\s*\n/).filter((part) => part.trim());
    if (!paragraphs.length) {
      preview.append(element("span", "math-preview-empty", "LaTeX preview will appear here."));
    } else {
      paragraphs.forEach((paragraph) => preview.append(element("p", "", paragraph)));
    }

    window.clearTimeout(mathPreviewTimers.get(preview));
    const timer = window.setTimeout(() => {
      if (!window.MathJax || typeof window.MathJax.typesetPromise !== "function") return;
      window.MathJax.typesetPromise([preview]).catch((error) => {
        console.warn("MathJax preview failed.", error);
      });
    }, 250);
    mathPreviewTimers.set(preview, timer);
  }

  function ensureInterestingBlocks(item) {
    if (Array.isArray(item.blocks)) return item.blocks;
    const blocks = [];
    (Array.isArray(item.body) ? item.body : []).forEach((paragraph) => {
      if (String(paragraph).trim()) blocks.push({ type: "text", content: paragraph });
    });
    if (item.image) {
      blocks.push({
        type: "image",
        src: item.image,
        alt: item.imageAlt || "",
        caption: item.imageCaption || ""
      });
    }
    if (!blocks.length) blocks.push({ type: "text", content: "" });
    item.blocks = blocks;
    return blocks;
  }

  function interestingBlocksEditor(item) {
    const blocks = ensureInterestingBlocks(item);
    const wrapper = element("section", "blocks-editor");
    const header = element("div", "blocks-editor-header");
    const heading = element("div");
    heading.append(
      element("strong", "", "Article content blocks"),
      element("p", "", "Use $...$ or $$...$$ for formulas. Move blocks up or down to arrange text and images.")
    );
    const addActions = element("div", "block-add-actions");
    const rows = element("div", "block-list");

    function focusLastBlock() {
      const last = rows.lastElementChild;
      last?.querySelector("textarea, input")?.focus();
      last?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    function addBlock(block) {
      blocks.push(block);
      saveDraft("Content block added and draft saved");
      drawBlocks();
      focusLastBlock();
    }

    addActions.append(
      addButton("Add text / LaTeX", () => addBlock({ type: "text", content: "" })),
      addButton("Insert image", () => addBlock({ type: "image", src: "", alt: "", caption: "" }))
    );
    header.append(heading, addActions);
    wrapper.append(header, rows);

    function drawBlocks() {
      rows.replaceChildren();
      if (!blocks.length) rows.append(element("div", "empty-state", "No content yet. Add text or an image."));

      blocks.forEach((block, index) => {
        const card = element("div", "content-block-card");
        const cardHeader = element("div", "content-block-header");
        const blockName = block.type === "image" ? "Image" : "Text / LaTeX";
        cardHeader.append(element("strong", "", `${index + 1}. ${blockName}`));
        const controls = element("div", "block-controls");

        const up = element("button", "small-button", "Move up");
        up.type = "button";
        up.disabled = index === 0;
        up.addEventListener("click", () => {
          [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
          saveDraft();
          drawBlocks();
        });

        const down = element("button", "small-button", "Move down");
        down.type = "button";
        down.disabled = index === blocks.length - 1;
        down.addEventListener("click", () => {
          [blocks[index], blocks[index + 1]] = [blocks[index + 1], blocks[index]];
          saveDraft();
          drawBlocks();
        });

        const remove = element("button", "small-button danger", "Remove");
        remove.type = "button";
        remove.addEventListener("click", () => {
          if (!window.confirm(`Remove block ${index + 1} (${blockName})?`)) return;
          blocks.splice(index, 1);
          saveDraft();
          drawBlocks();
        });
        controls.append(up, down, remove);
        cardHeader.append(controls);
        card.append(cardHeader);

        if (block.type === "image") {
          card.append(
            field("Image path or URL", block.src, (value) => { block.src = value; }, { help: "For example assets/knot-diagram.jpg" }),
            field("Image alt text", block.alt, (value) => { block.alt = value; }, { help: "Describe the image for readers who cannot see it." }),
            field("Image caption", block.caption, (value) => { block.caption = value; })
          );
        } else {
          const textField = element("div", "field block-text-field");
          const label = element("label", "", "Text and LaTeX");
          const area = document.createElement("textarea");
          const id = `block-${Math.random().toString(36).slice(2)}`;
          label.htmlFor = id;
          area.id = id;
          area.value = block.content || "";
          area.placeholder = "Write inline formulas such as $H_1(M; \\mathbb{Z})$; use $$...$$ for display formulas.";
          const preview = element("div", "math-preview");
          area.addEventListener("input", () => {
            block.content = area.value;
            saveDraft();
            updateMathPreview(preview, area.value);
          });
          textField.append(
            label,
            area,
            element("span", "field-help", "Leave a blank line between paragraphs. Use ## for section headings, [label](URL) for links, and Markdown tables. Enter formulas without \\documentclass or \\begin{document}."),
            element("strong", "preview-label", "Preview"),
            preview
          );
          card.append(textField);
          updateMathPreview(preview, area.value);
        }
        rows.append(card);
      });
    }

    drawBlocks();
    return wrapper;
  }

  function linksEditor(item) {
    if (!Array.isArray(item.links)) item.links = [];
    const wrapper = element("div", "links-editor");
    const header = element("div", "links-header");
    header.append(element("strong", "", "PDFs, websites, and other links"));
    const rows = element("div");

    function drawLinks() {
      rows.replaceChildren();
      item.links.forEach((link, index) => {
        const row = element("div", "link-row");
        const label = document.createElement("input");
        label.value = link.label || "";
        label.placeholder = "Label, for example PDF";
        label.setAttribute("aria-label", "Link label");
        label.addEventListener("input", () => {
          link.label = label.value;
          saveDraft();
        });
        const url = document.createElement("input");
        url.value = link.url || "";
        url.placeholder = "files/note.pdf or https://...";
        url.setAttribute("aria-label", "Link URL");
        url.addEventListener("input", () => {
          link.url = url.value;
          saveDraft();
        });
        const remove = element("button", "icon-button", "×");
        remove.type = "button";
        remove.title = "Remove link";
        remove.addEventListener("click", () => {
          item.links.splice(index, 1);
          saveDraft();
          drawLinks();
        });
        row.append(label, url, remove);
        rows.append(row);
      });
    }

    header.append(addButton("Add link", () => {
      item.links.push({ label: "PDF", url: "" });
      saveDraft();
      drawLinks();
      rows.lastElementChild?.querySelector("input")?.focus();
    }));
    wrapper.append(header, rows);
    drawLinks();
    return wrapper;
  }

  function renderCollection(key) {
    const schema = schemas[key];
    const items = content.pages[language][key];
    const sectionBox = formSection(schema.title, schema.help);
    sectionBox.box.dataset.collection = key;
    const collection = element("div", "collection");

    const add = addButton("Add entry", () => {
      const newItem = deepCopy(schema.empty);
      if (key === "interesting") newItem.id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      items.push(newItem);
      saveDraft("Entry added and draft saved");
      render();
      const cards = root.querySelectorAll(`[data-collection="${key}"] .entry-card`);
      const newest = cards[cards.length - 1];
      if (newest) {
        newest.open = true;
        newest.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    sectionBox.header.append(add);

    if (!items.length) {
      collection.append(document.querySelector("#empty-template").content.cloneNode(true));
    }

    items.forEach((item, index) => {
      const card = document.createElement("details");
      card.className = "entry-card";
      const summary = document.createElement("summary");
      const title = element("span", "entry-card-title", item.title || `Untitled entry ${index + 1}`);
      const date = element("span", "entry-card-date", schema.dateKey ? item[schema.dateKey] || "No date" : item.location || "");
      summary.append(title, date);

      const editor = element("div", "entry-editor");
      schema.fields.forEach(([fieldKey, fieldLabel, fieldType, fieldHelp]) => {
        const options = {
          textarea: fieldType === "textarea" || fieldType === "paragraphs",
          help: fieldHelp,
          onSummaryChange: fieldKey === "title" ? (value) => { title.textContent = value || `Untitled entry ${index + 1}`; }
            : fieldKey === schema.dateKey ? (value) => { date.textContent = value || "No date"; } : null
        };
        const shownValue = fieldType === "paragraphs"
          ? (Array.isArray(item[fieldKey]) ? item[fieldKey].join("\n\n") : "")
          : item[fieldKey];
        editor.append(field(fieldLabel, shownValue, (value) => {
          item[fieldKey] = fieldType === "paragraphs"
            ? value.split(/\n\s*\n/).filter((paragraph) => paragraph.trim().length)
            : value;
        }, options));
      });
      if (key === "interesting") editor.append(interestingBlocksEditor(item));
      if (key !== "travelPhotos") editor.append(linksEditor(item));

      const actions = element("div", "entry-actions");
      const duplicate = element("button", "small-button", "Duplicate entry");
      duplicate.type = "button";
      duplicate.addEventListener("click", () => {
        const copy = deepCopy(item);
        if (key === "interesting") copy.id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        items.splice(index + 1, 0, copy);
        saveDraft("Entry duplicated and draft saved");
        render();
      });
      const remove = element("button", "small-button danger", "Remove entry");
      remove.type = "button";
      remove.addEventListener("click", () => {
        const label = item.title || "this untitled entry";
        if (!window.confirm(`Remove “${label}”?`)) return;
        items.splice(index, 1);
        saveDraft("Entry removed and draft saved");
        render();
      });
      actions.append(duplicate, remove);
      editor.append(actions);
      card.append(summary, editor);
      collection.append(card);
    });

    sectionBox.box.append(collection);
    return sectionBox.box;
  }

  function renderHome() {
    const wrapper = panel("Home", "Edit profile information and the English introduction.");

    const profile = formSection("Profile", "The homepage uses assets/Liziang banshen.png as the profile photograph.");
    const grid = element("div", "field-grid");
    [
      ["name", "Name"],
      ["subtitle", "Role"],
      ["institution", "Department and institution"],
      ["interests", "Research interests"]
    ].forEach(([key, label]) => {
      grid.append(field(label, content.profile[key][language], (value) => { content.profile[key][language] = value; }, {
        textarea: key === "interests"
      }));
    });
    profile.box.append(grid);

    const intro = formSection("Introduction", "Each item is a paragraph. Add, remove, or edit paragraphs.");
    intro.box.append(paragraphEditor(content.pages[language].introduction, (items) => {
      content.pages[language].introduction = items;
    }));

    const links = formSection("CV and contact links", "Use paths such as files/cv.pdf. Keep the mailto: prefix for email addresses.");
    const linksGrid = element("div", "field-grid");
    [
      ["cv", "Curriculum vitae (CV)"],
      ["email", "Email"],
      ["github", "GitHub"],
      ["scholar", "Google Scholar or another profile"]
    ].forEach(([key, label]) => {
      linksGrid.append(field(label, content.links[key], (value) => { content.links[key] = value; }));
    });
    links.box.append(linksGrid);

    wrapper.append(profile.box, intro.box, links.box);
    root.append(wrapper);
  }

  function renderResearch() {
    const wrapper = panel("Research", "Manage research notes, publications, and academic activities.");
    wrapper.append(renderCollection("researchNotes"), renderCollection("publications"), renderCollection("activities"));
    root.append(wrapper);
  }

  function renderTalks() {
    const wrapper = panel("Talks", "Manage seminar talks, course reports, and project presentations.");
    wrapper.append(renderCollection("talks"));
    root.append(wrapper);
  }

  function renderInteresting() {
    const wrapper = panel("Interesting Math", "Edit topic introductions, preview images, and full articles with LaTeX and image blocks.");
    wrapper.append(renderCollection("interesting"));
    root.append(wrapper);
  }

  function renderPersonal() {
    const wrapper = panel("Personal", "Edit the page introduction and personal entries.");
    const intro = formSection("Page introduction", "These paragraphs appear at the top of the Personal page.");
    intro.box.append(paragraphEditor(content.ui[language].personalIntroduction, (items) => {
      content.ui[language].personalIntroduction = items;
    }));
    const travel = formSection("Travel photo page", "Edit the title and introduction of the separate gallery.");
    travel.box.append(
      field("Gallery title", content.ui.en.travelTitle, (value) => { content.ui.en.travelTitle = value; }),
      field("Gallery introduction", content.ui.en.travelIntroduction, (value) => { content.ui.en.travelIntroduction = value; }, { textarea: true })
    );
    if (!Array.isArray(content.pages.en.travelPhotos)) content.pages.en.travelPhotos = [];
    wrapper.append(intro.box, renderCollection("personalEntries"), travel.box, renderCollection("travelPhotos"));
    root.append(wrapper);
  }

  function render() {
    root.replaceChildren();
    document.querySelectorAll("[data-section]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.section === section);
    });
    ({ home: renderHome, research: renderResearch, talks: renderTalks, interesting: renderInteresting, personal: renderPersonal }[section])();
  }

  function serializeContent() {
    return `/*\n  Generated by editor.html.\n  You can also edit this file directly.\n*/\nwindow.SITE_CONTENT = ${JSON.stringify(content, null, 2)};\n`;
  }

  async function exportContent() {
    const fileText = serializeContent();
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: "content.js",
          types: [{ description: "JavaScript file", accept: { "text/javascript": [".js"] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(fileText);
        await writable.close();
        status.textContent = "content.js saved";
        showToast("Saved. Replace the website’s content.js with this file.");
        return;
      } catch (error) {
        if (error && error.name === "AbortError") return;
        console.warn("File picker unavailable; falling back to a download.", error);
      }
    }

    const blob = new Blob([fileText], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "content.js";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    status.textContent = "content.js downloaded";
    showToast("Downloaded. Replace the website’s content.js with this file.");
  }

  document.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => {
      section = button.dataset.section;
      render();
    });
  });

  document.querySelector("#export-button").addEventListener("click", exportContent);
  document.querySelector("#reset-button").addEventListener("click", () => {
    if (!window.confirm("Discard the saved draft and reload the current website content?")) return;
    localStorage.removeItem(STORAGE_KEY);
    content = deepCopy(original);
    status.textContent = "Current website content reloaded";
    render();
  });

  render();
})();
