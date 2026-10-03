(() => {
  const site = window.SITE_CONTENT;
  const language = "en";

  const valueAt = (object, path) => path.split(".").reduce((value, key) => value == null ? undefined : value[key], object);
  const paragraphs = (items = []) => items.map((item) => `<p>${item}</p>`).join("");
  const renderLinks = (items = []) => items.filter((item) => item.url && item.url !== "#").map((item) => `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${item.label}</a>`).join("");
  const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);

  const renderInlineText = (text) => escapeHTML(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|(?:files|assets)\/[^\s)]+)\)/g,
      '<a href="$2">$1</a>');

  const renderTextBlock = (text = "") => {
    const parts = String(text).split(/\n\s*\n/).filter((part) => part.trim());
    return parts.map((part) => {
      const heading = part.match(/^(#{2,3}) (.+)$/);
      if (heading) return `<h${heading[1].length}>${renderInlineText(heading[2])}</h${heading[1].length}>`;
      const rows = part.trim().split("\n");
      if (rows.length > 2 && /^\|.*\|$/.test(rows[0]) && /^\|[\s:|\-]+\|$/.test(rows[1])) {
        const cells = (row) => row.trim().slice(1, -1).split("|").map((cell) => renderInlineText(cell.trim()));
        return `<div class="article-table-wrapper"><table class="article-table"><thead><tr>${cells(rows[0]).map((cell) => `<th scope="col">${cell}</th>`).join("")}</tr></thead><tbody>${rows.slice(2).map((row) => `<tr>${cells(row).map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      }
      return `<p>${renderInlineText(part)}</p>`;
    }).join("");
  };

  const renderInlineImage = (block = {}) => {
    if (!block.src) return "";
    return `<figure class="article-inline-image article-block">
      <a href="${escapeHTML(block.src)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHTML(`Open full-size figure: ${block.alt || block.caption || 'illustration'}`)}"><img src="${escapeHTML(block.src)}" alt="${escapeHTML(block.alt || "")}" loading="lazy" /></a>
      <figcaption>${block.caption ? `${escapeHTML(block.caption)} ` : ""}<a class="figure-full-size" href="${escapeHTML(block.src)}" target="_blank" rel="noopener noreferrer">View full size</a></figcaption>
    </figure>`;
  };

  const renderArticleBlocks = (item) => {
    if (!Array.isArray(item.blocks)) return "";
    return item.blocks.map((block) => {
      if (block.type === "image") return renderInlineImage(block);
      return `<div class="article-text-block article-block">${renderTextBlock(block.content || "")}</div>`;
    }).join("");
  };

  const renderBibliography = (items, emptyMessage) => {
    if (!items.length) return `<p class="empty-message">${emptyMessage}</p>`;
    return items.map((item) => `
      <article class="bibliography-entry">
        <div class="entry-date">${item.year || ""}</div>
        <div class="entry-body">
          ${item.type ? `<p class="entry-type">${item.type}</p>` : ""}
          <h4>${item.title}</h4>
          ${item.authors ? `<p>${item.authors}</p>` : ""}
          ${item.venue ? `<p>${item.venue}</p>` : ""}
          <div class="resource-links">${renderLinks(item.links)}</div>
        </div>
      </article>`).join("");
  };

  const renderActivities = (items = []) => items.map((item) => `
    <article class="activity-entry">
      <div class="entry-date">${item.date}</div>
      <div class="entry-body"><h4>${item.title}</h4><p>${item.detail}</p><div class="resource-links">${renderLinks(item.links)}</div></div>
    </article>`).join("");

  const renderResearchNotes = (items = []) => items.map((item) => `
    <article class="research-note-entry">
      <div class="entry-date">${item.date}</div>
      <div class="entry-body">
        <h4>${item.title}</h4>
        ${item.supervisor ? `<p class="note-supervisor">Supervised by: ${item.supervisorUrl ? `<a href="${escapeHTML(item.supervisorUrl)}">${escapeHTML(item.supervisor)}</a>` : escapeHTML(item.supervisor)}</p>` : ""}
        ${item.description ? `<p>${item.description}</p>` : ""}
        <div class="resource-links">${renderLinks(item.links)}</div>
      </div>
    </article>`).join("");

  const renderTalks = (items = []) => items.map((item) => `
    <article class="talk-entry">
      <div class="entry-date">${item.date}</div>
      <div class="entry-body">
        <p class="entry-type">${item.type}</p><h4>${item.title}</h4><p>${item.event}</p>
        ${item.description ? `<p>${item.description}</p>` : ""}
        <div class="resource-links">${renderLinks(item.links)}</div>
      </div>
    </article>`).join("");

  const renderArticles = (items = []) => items.map((item) => {
    const usesBlocks = Array.isArray(item.blocks);
    const image = !usesBlocks && item.image ? `<figure class="article-image"><img src="${item.image}" alt="${item.imageAlt || ""}" />${item.imageCaption ? `<figcaption>${item.imageCaption}</figcaption>` : ""}</figure>` : "";
    const body = usesBlocks ? renderArticleBlocks(item) : paragraphs(item.body);
    return `<article class="article-entry${item.image && !usesBlocks ? " has-image" : ""}${usesBlocks ? " uses-blocks" : ""}">
      <div class="article-copy">
        ${item.date ? `<p class="article-date">${item.date}</p>` : ""}<h3>${item.url ? `<a href="${escapeHTML(item.url)}">${escapeHTML(item.title)}</a>` : item.title}</h3>
        ${item.summary ? `<p class="article-summary">${item.summary}</p>` : ""}
        <div class="article-body">${body}</div><div class="resource-links">${renderLinks(item.links)}</div>
      </div>${image}
    </article>`;
  }).join("");

  const renderTravelPhotos = (items = []) => items.map((item) => {
    const image = escapeHTML(item.image || "");
    const title = escapeHTML(item.title || "");
    const location = escapeHTML(item.location || "");
    const dimensions = Number(item.width) > 0 && Number(item.height) > 0 ? ` width="${Number(item.width)}" height="${Number(item.height)}"` : "";
    return `<figure class="travel-photo">
      <a class="travel-photo-image" href="${image}" target="_blank" rel="noopener noreferrer" aria-label="Open full-size photo: ${title}"><img src="${image}" alt="${escapeHTML(item.imageAlt || item.title || "")}"${dimensions} loading="lazy" decoding="async" /></a>
      <figcaption>
        <h2><a href="${image}" target="_blank" rel="noopener noreferrer">${title}</a></h2>
        ${location ? `<p class="travel-location">${item.locationUrl ? `<a href="${escapeHTML(item.locationUrl)}" target="_blank" rel="noopener noreferrer">${location}</a>` : location}</p>` : ""}
        <a class="figure-full-size" href="${image}" target="_blank" rel="noopener noreferrer">View full size</a>
      </figcaption>
    </figure>`;
  }).join("");

  function typesetMath(targets) {
    if (!window.MathJax || typeof window.MathJax.typesetPromise !== "function") return;
    window.MathJax.typesetPromise(targets).catch((error) => {
      console.warn("MathJax could not typeset part of the page.", error);
    });
  }

  const topicId = (item) => item.id || item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const topicURL = (item) => `topic.html?topic=${encodeURIComponent(topicId(item))}`;
  const renderTopicCards = (items) => items.map((item) => `
    <article class="topic-card">
      ${item.image ? `<a class="topic-thumbnail" href="${topicURL(item)}" tabindex="-1" aria-hidden="true"><img src="${escapeHTML(item.image)}" alt="" loading="lazy" /></a>` : ""}
      <div class="topic-card-copy">
        <h2><a href="${topicURL(item)}">${escapeHTML(item.title)}</a></h2>
        ${item.summary ? `<p>${escapeHTML(item.summary)}</p>` : ""}
        <a class="topic-status" href="${topicURL(item)}">${hasArticleContent(item) ? "Read the note" : "Full note forthcoming"} <span aria-hidden="true">↗</span></a>
      </div>
    </article>`).join("");

  function hasArticleContent(item) {
    return Array.isArray(item.blocks)
      ? item.blocks.some((block) => block.type === "image" ? Boolean(block.src) : Boolean((block.content || "").trim()))
      : (item.body || []).some((paragraph) => paragraph.trim());
  }

  function renderTopicPage(items) {
    const id = new URLSearchParams(window.location.search).get("topic");
    const index = items.findIndex((item) => topicId(item) === id);
    const title = document.querySelector("#topic-title");
    const content = document.querySelector(".topic-content");
    if (index < 0) {
      title.textContent = "Topic not found";
      document.title = `Topic not found — ${site.profile.name.en}`;
      content.innerHTML = '<p>This topic is not available. <a href="interesting-math.html">Browse all mathematical notes.</a></p>';
      return;
    }
    const item = items[index];
    title.textContent = item.title;
    document.title = `${item.title} — ${site.profile.name.en}`;
    document.querySelector(".topic-summary").textContent = item.summary || "";
    const hasBodyIllustrations = (item.blocks || []).some((block) => block.type === "image" && block.src);
    const illustration = item.image && !hasBodyIllustrations ? `<figure class="topic-illustration"><img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.imageAlt || "")}" />${item.imageCaption ? `<figcaption>${escapeHTML(item.imageCaption)}</figcaption>` : ""}</figure>` : "";
    const body = hasArticleContent(item)
      ? `<div class="article-body">${Array.isArray(item.blocks) ? renderArticleBlocks(item) : paragraphs(item.body)}</div>`
      : '<div class="forthcoming-note"><h2>Full note forthcoming</h2><p>The detailed exposition and illustrations will be added here.</p></div>';
    content.innerHTML = illustration + body + `<div class="resource-links">${renderLinks(item.links)}</div>`;
    document.querySelector(".topic-pagination").innerHTML = [
      index > 0 ? `<a href="${topicURL(items[index - 1])}"><span>← Previous topic</span>${escapeHTML(items[index - 1].title)}</a>` : '<span></span>',
      index < items.length - 1 ? `<a href="${topicURL(items[index + 1])}"><span>Next topic →</span>${escapeHTML(items[index + 1].title)}</a>` : ""
    ].join("");
  }

  function renderPage() {
    const ui = site.ui[language];
    const page = site.pages[language];
    const currentPage = document.body.dataset.page || "home";
    document.documentElement.lang = "en";
    document.title = `${currentPage === "travel" ? ui.travelTitle : ui.nav[currentPage] || "Interesting Math"} — ${site.profile.name.en}`;

    document.querySelectorAll("[data-profile]").forEach((element) => {
      const field = site.profile[element.dataset.profile];
      element.textContent = typeof field === "object" ? field[language] : field;
    });
    document.querySelectorAll("[data-ui]").forEach((element) => {
      const text = ui[element.dataset.ui];
      if (typeof text === "string") element.textContent = text;
    });
    document.querySelectorAll("[data-nav]").forEach((element) => { element.textContent = ui.nav[element.dataset.nav]; });
    document.querySelectorAll("[data-rich]").forEach((element) => {
      const key = element.dataset.rich;
      element.innerHTML = paragraphs(key === "introduction" ? page.introduction : ui[key]);
    });
    document.querySelectorAll("[data-content]").forEach((element) => {
      const text = valueAt(page, element.dataset.content);
      if (typeof text === "string") element.textContent = text;
    });

    const renderers = {
      researchNotes: () => renderResearchNotes(page.researchNotes),
      publications: () => renderBibliography(page.publications, ui.emptyPublications),
      activities: () => renderActivities(page.activities),
      talks: () => renderTalks(page.talks),
      interesting: () => renderTopicCards(page.interesting),
      personalEntries: () => renderArticles(page.personalEntries),
      travelPhotos: () => renderTravelPhotos(page.travelPhotos)
    };
    document.querySelectorAll("[data-list]").forEach((element) => {
      element.innerHTML = renderers[element.dataset.list]();
    });
    if (currentPage === "topic") renderTopicPage(page.interesting);
    typesetMath([document.querySelector("main")]);
    const photo = document.querySelector(".portrait img");
    if (photo) photo.alt = `Portrait of ${site.profile.name.en}`;
  }

  document.querySelectorAll("[data-link]").forEach((element) => {
    const url = site.links[element.dataset.link];
    if (!url || url === "#") {
      element.classList.add("is-hidden"); element.tabIndex = -1; element.setAttribute("aria-hidden", "true");
    } else {
      element.href = url;
      if (url.startsWith("http")) { element.target = "_blank"; element.rel = "noopener noreferrer me"; }
    }
  });

  const portrait = document.querySelector(".portrait");
  if (portrait) {
    const portraitImage = portrait.querySelector("img");
    portraitImage.addEventListener("error", () => portrait.classList.add("is-missing"));
    if (portraitImage.complete && portraitImage.naturalWidth === 0) portrait.classList.add("is-missing");
  }
  const menuButton = document.querySelector(".menu-button");
  const navigation = document.querySelector(".navigation");
  menuButton.addEventListener("click", () => {
    const open = navigation.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
    navigation.classList.remove("is-open"); menuButton.setAttribute("aria-expanded", "false");
  }));
  document.getElementById("year").textContent = String(new Date().getFullYear());
  renderPage();
})();
