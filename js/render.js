function $(id) {
  return document.getElementById(id);
}

function el(tag, { className, text, attrs } = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      if (value != null && value !== "") {
        node.setAttribute(key, value);
      }
    }
  }
  return node;
}

function clearChildren(node) {
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function toAbsoluteUrl(path, base = document.baseURI) {
  return new URL(path, base).toString();
}

function resolvePath(path, base = document.baseURI) {
  if (!isNonEmptyString(path)) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("./") || path.startsWith("../")) {
    return toAbsoluteUrl(path, base);
  }
  return toAbsoluteUrl(path, document.baseURI);
}

async function loadJSON(path, base = document.baseURI) {
  const url = toAbsoluteUrl(path, base);
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toSafeUrl(url) {
  if (!isNonEmptyString(url)) return "";
  const trimmed = url.trim();
  if (/^(https?:|mailto:|#|\/)/i.test(trimmed)) return trimmed;
  return "";
}

function toSafeExternalUrl(url) {
  if (!isNonEmptyString(url)) return "";
  try {
    const parsed = new URL(url, document.baseURI);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch (err) {
    return "";
  }
  return "";
}

function parseInlineMarkdown(raw) {
  let text = escapeHtml(raw);
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const safeUrl = toSafeUrl(url);
    if (!safeUrl) return label;
    const isExternal = /^https?:/i.test(safeUrl);
    const rel = isExternal ? ' rel="noopener noreferrer" target="_blank"' : "";
    return `<a href="${escapeHtml(safeUrl)}"${rel}>${label}</a>`;
  });
  return text;
}

function markdownToHtml(markdown) {
  if (!isNonEmptyString(markdown)) return "";

  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let inUnorderedList = false;
  let inOrderedList = false;
  let paragraph = [];

  const closeParagraph = () => {
    if (paragraph.length === 0) return;
    html.push(`<p>${parseInlineMarkdown(paragraph.join(" "))}</p>`);
    paragraph = [];
  };

  const closeLists = () => {
    if (inUnorderedList) {
      html.push("</ul>");
      inUnorderedList = false;
    }
    if (inOrderedList) {
      html.push("</ol>");
      inOrderedList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "") {
      closeParagraph();
      closeLists();
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeParagraph();
      closeLists();
      const level = heading[1].length;
      html.push(`<h${level}>${parseInlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const ulItem = trimmed.match(/^[-*]\s+(.+)$/);
    if (ulItem) {
      closeParagraph();
      if (inOrderedList) {
        html.push("</ol>");
        inOrderedList = false;
      }
      if (!inUnorderedList) {
        html.push("<ul>");
        inUnorderedList = true;
      }
      html.push(`<li>${parseInlineMarkdown(ulItem[1])}</li>`);
      continue;
    }

    const olItem = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olItem) {
      closeParagraph();
      if (inUnorderedList) {
        html.push("</ul>");
        inUnorderedList = false;
      }
      if (!inOrderedList) {
        html.push("<ol>");
        inOrderedList = true;
      }
      html.push(`<li>${parseInlineMarkdown(olItem[1])}</li>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  closeParagraph();
  closeLists();
  return html.join("\n");
}

function appendMarkdown(container, markdown, className) {
  if (!container || !isNonEmptyString(markdown)) return;
  const wrapper = el("div", { className });
  wrapper.innerHTML = markdownToHtml(markdown);
  if (wrapper.textContent?.trim()) {
    container.appendChild(wrapper);
  }
}

function renderMeta(siteData) {
  if (isNonEmptyString(siteData.meta?.title)) {
    document.title = siteData.meta.title;
  }
  const desc = document.querySelector('meta[name="description"]');
  if (desc && isNonEmptyString(siteData.meta?.description)) {
    desc.setAttribute("content", siteData.meta.description);
  }
}

function renderFavicon(siteData) {
  const favicon = $("favicon");
  const faviconPath = siteData.head?.favicon;
  if (!favicon || !isNonEmptyString(faviconPath)) return;
  favicon.setAttribute("rel", "icon");
  favicon.setAttribute("href", resolvePath(faviconPath));
}

function renderHeader(siteData) {
  const brand = $("brand-name");
  if (!brand) return;
  brand.textContent = siteData.head?.labName ?? "Lab Website";
}

function renderHero(siteData) {
  const hero = siteData.hero ?? {};
  const t1 = $("hero-tagline-1");
  const t2 = $("hero-tagline-2");
  if (t1) t1.textContent = hero.tagline1 ?? "";
  if (t2) t2.textContent = hero.tagline2 ?? "";

  const animation = $("hero-animation");
  if (animation) {
    if (isNonEmptyString(hero.animation?.src)) {
      animation.setAttribute("src", resolvePath(hero.animation.src));
      animation.setAttribute("alt", hero.animation.alt ?? "Hero visual");
    } else {
      animation.removeAttribute("src");
    }
  }

  const logo = $("hero-cc-logo");
  if (logo) {
    if (isNonEmptyString(hero.ccLogo?.src)) {
      logo.setAttribute("src", resolvePath(hero.ccLogo.src));
      logo.setAttribute("alt", hero.ccLogo.alt ?? "Affiliation logo");
    } else {
      logo.removeAttribute("src");
    }
  }
}

function renderMainBackground(siteData) {
  const path = siteData.main?.background;
  if (!isNonEmptyString(path)) return;
  document
    .querySelector(".page")
    ?.style.setProperty("--main-bg", `url("${resolvePath(path)}")`);
}

function renderFooter(siteData) {
  const year = $("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const footerSocial = $("footer-social");
  if (footerSocial) {
    clearChildren(footerSocial);
    for (const link of normalizeSocialLinks(siteData)) {
      const anchor = el("a", {
        className: "footer-social-link",
        attrs: {
          href: link.url,
          target: "_blank",
          rel: "noopener noreferrer",
          "aria-label": link.label,
          title: link.label,
        },
      });
      anchor.appendChild(
        el("img", {
          className: "footer-social-icon",
          attrs: {
            src: resolvePath(link.iconPath),
            alt: "",
            "aria-hidden": "true",
            loading: "lazy",
          },
        }),
      );
      footerSocial.appendChild(anchor);
    }
  }

  const footer = siteData.footer ?? {};
  const owner = $("footer-owner");
  const disclaimer = $("footer-disclaimer");
  const location = $("footer-location");
  if (owner) owner.textContent = footer.owner ?? "";
  if (disclaimer) disclaimer.textContent = footer.disclaimer ?? "";
  if (location) location.textContent = footer.location ?? "";

  const licenseEl = $("footer-license");
  if (!licenseEl) return;
  clearChildren(licenseEl);

  if (!isNonEmptyString(footer.licenseText)) return;
  const linkText = "Website source code";
  if (
    isNonEmptyString(footer.sourceCode) &&
    footer.licenseText.includes(linkText)
  ) {
    const [before, after] = footer.licenseText.split(linkText);
    licenseEl.appendChild(document.createTextNode(before));
    licenseEl.appendChild(
      el("a", {
        text: linkText,
        attrs: {
          href: footer.sourceCode,
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
    );
    licenseEl.appendChild(document.createTextNode(after));
    return;
  }
  licenseEl.textContent = footer.licenseText;
}

function normalizeSocialLinks(siteData) {
  const rawLinks = siteData?.social?.links;
  if (!Array.isArray(rawLinks)) return [];

  const normalized = [];
  for (const link of rawLinks) {
    if (!link || typeof link !== "object") continue;

    const url = toSafeExternalUrl(link.url);
    if (!isNonEmptyString(url)) continue;

    const iconPath = isNonEmptyString(link.icon)
      ? link.icon
      : isNonEmptyString(link.icon?.src)
        ? link.icon.src
        : "";
    if (!isNonEmptyString(iconPath)) continue;

    const label =
      (isNonEmptyString(link.label) && link.label.trim()) ||
      (isNonEmptyString(link.id) && link.id.trim()) ||
      "Social link";

    normalized.push({
      id: isNonEmptyString(link.id) ? link.id.trim() : "social",
      url,
      iconPath,
      label,
    });
  }

  return normalized;
}

function renderNav(data) {
  const nav = $("nav-links");
  if (!nav) return;
  clearChildren(nav);

  const sections = [
    "about",
    "research",
    "people",
    "publications",
    "photos",
    "contact",
  ];
  for (const id of sections) {
    const content = data[id];
    if (!content) continue;
    const label = content.title || id.charAt(0).toUpperCase() + id.slice(1);
    const li = el("li");
    li.appendChild(el("a", { text: label, attrs: { href: `#${id}` } }));
    nav.appendChild(li);
  }

  const socialLinks = normalizeSocialLinks(data.site);
  for (const link of socialLinks) {
    const li = el("li", { className: "nav-social-item" });
    const anchor = el("a", {
      className: "nav-social-link",
      attrs: {
        href: link.url,
        target: "_blank",
        rel: "noopener noreferrer",
        "aria-label": link.label,
        title: link.label,
      },
    });
    anchor.appendChild(
      el("img", {
        className: "nav-social-icon",
        attrs: {
          src: resolvePath(link.iconPath),
          alt: "",
          "aria-hidden": "true",
          loading: "lazy",
        },
      }),
    );
    li.appendChild(anchor);
    nav.appendChild(li);
  }
}

function renderAboutSection(content) {
  const node = el("section", { attrs: { id: "about" } });
  node.appendChild(el("h2", { text: content.title ?? "About" }));
  appendMarkdown(node, content.body, "rich-text");
  return node;
}

function renderResearchSection(content) {
  const node = el("section", { attrs: { id: "research" } });
  node.appendChild(el("h2", { text: content.title ?? "Research" }));

  const list = el("ul", { attrs: { id: "research-list" } });
  const items = Array.isArray(content.items) ? content.items : [];

  items.forEach((item, index) => {
    const li = el("li", { className: "research-item" });

    if (isNonEmptyString(item.image)) {
      li.appendChild(
        el("img", {
          className: "research-image",
          attrs: {
            src: resolvePath(item.image),
            alt: item.alt ?? `Research image ${index + 1}`,
            loading: "lazy",
          },
        }),
      );
    }

    const textWrap = el("div", { className: "research-text" });
    if (isNonEmptyString(item.name)) {
      textWrap.appendChild(
        el("h3", { className: "research-name", text: item.name }),
      );
    }
    appendMarkdown(textWrap, item.description, "research-description");
    li.appendChild(textWrap);
    list.appendChild(li);
  });

  node.appendChild(list);
  return node;
}

function renderPeopleSection(content) {
  const node = el("section", { attrs: { id: "people" } });
  node.appendChild(el("h2", { text: content.title ?? "People" }));
  const container = el("div", { attrs: { id: "people-list" } });

  const iconMap = [
    { key: "website", label: "Website", src: "assets/icons/website.svg" },
    { key: "linkedin", label: "LinkedIn", src: "assets/icons/linkedin.svg" },
    { key: "orcid", label: "ORCID", src: "assets/icons/orcid.svg" },
    {
      key: "scholar",
      label: "Google Scholar",
      src: "assets/icons/google-scholar.svg",
    },
    { key: "github", label: "GitHub", src: "assets/icons/github.svg" },
    { key: "x", label: "X", src: "assets/icons/x.svg" },
  ];

  for (const group of content.groups ?? []) {
    const groupWrap = el("section", { className: "people-group" });
    if (isNonEmptyString(group.groupTitle)) {
      groupWrap.appendChild(
        el("h3", { className: "people-group-title", text: group.groupTitle }),
      );
    }

    const ul = el("ul", { className: "people-cards" });

    for (const member of group.members ?? []) {
      const card = el("li", { className: "person-card" });
      const headerRow = el("div", { className: "person-header" });
      if (isNonEmptyString(member.name)) {
        headerRow.appendChild(
          el("h4", { className: "person-name", text: member.name }),
        );
      }

      const iconWrap = el("div", { className: "person-links" });
      for (const { key, label, src } of iconMap) {
        const url = member.links?.[key];
        if (!isNonEmptyString(url)) continue;

        const a = el("a", {
          className: "person-link",
          attrs: {
            href: url,
            target: "_blank",
            rel: "noopener noreferrer",
            title: label,
            "aria-label": label,
          },
        });
        a.appendChild(
          el("img", {
            className: "person-link-icon",
            attrs: {
              src: resolvePath(src),
              alt: label,
              loading: "lazy",
            },
          }),
        );
        iconWrap.appendChild(a);
      }

      if (iconWrap.childElementCount > 0) {
        headerRow.appendChild(iconWrap);
      }
      card.appendChild(headerRow);

      if (isNonEmptyString(member.photo)) {
        if (isNonEmptyString(member.photoChill)) {
          const flipper = el("div", { className: "person-photo-flipper" });
          const inner = el("div", { className: "person-photo-inner" });

          inner.appendChild(
            el("img", {
              className: "person-photo-front",
              attrs: {
                src: resolvePath(member.photo),
                alt: `${member.name ?? "Lab member"} photo`,
                loading: "lazy",
              },
            }),
          );
          inner.appendChild(
            el("img", {
              className: "person-photo-back",
              attrs: {
                src: resolvePath(member.photoChill),
                alt: `${member.name ?? "Lab member"} chill photo`,
                loading: "lazy",
              },
            }),
          );

          flipper.appendChild(inner);
          card.appendChild(flipper);
        } else {
          card.appendChild(
            el("img", {
              className: "person-photo",
              attrs: {
                src: resolvePath(member.photo),
                alt: `${member.name ?? "Lab member"} photo`,
                loading: "lazy",
              },
            }),
          );
        }
      }
      if (isNonEmptyString(member.role)) {
        card.appendChild(
          el("p", { className: "person-role", text: member.role }),
        );
      }
      if (isNonEmptyString(member.email)) {
        const emailP = el("p", { className: "person-email" });
        emailP.appendChild(
          el("a", {
            text: member.email,
            attrs: { href: `mailto:${member.email}` },
          }),
        );
        card.appendChild(emailP);
      }
      if (isNonEmptyString(member.affiliation)) {
        card.appendChild(
          el("p", {
            className: "person-affiliation",
            text: member.affiliation,
          }),
        );
      }
      appendMarkdown(card, member.description, "person-description");
      ul.appendChild(card);
    }

    groupWrap.appendChild(ul);
    container.appendChild(groupWrap);
  }

  node.appendChild(container);
  return node;
}

function renderPublicationsSection(content) {
  const node = el("section", { attrs: { id: "publications" } });
  node.appendChild(el("h2", { text: content.title ?? "Publications" }));
  const container = el("div", { attrs: { id: "publications-list" } });

  for (const group of content.groups ?? []) {
    const yearWrap = el("section", { className: "pub-year" });
    if (group.year != null && group.year !== "") {
      yearWrap.appendChild(
        el("h3", { className: "pub-year-title", text: String(group.year) }),
      );
    }

    const ul = el("ul", { className: "pub-list" });
    for (const item of group.items ?? []) {
      const li = el("li", { className: "pub-item" });
      if (isNonEmptyString(item.url)) {
        li.appendChild(
          el("a", {
            className: "pub-link",
            text: item.text ?? "",
            attrs: {
              href: item.url,
              target: "_blank",
              rel: "noopener noreferrer",
            },
          }),
        );
      } else if (isNonEmptyString(item.text)) {
        li.innerHTML = markdownToHtml(item.text);
      }
      ul.appendChild(li);
    }

    yearWrap.appendChild(ul);
    container.appendChild(yearWrap);
  }

  node.appendChild(container);
  return node;
}

function renderPhotosSection(content) {
  const node = el("section", {
    attrs: {
      id: "photos",
      "aria-label": "Lab photos",
    },
  });
  node.appendChild(el("h2", { text: content.title ?? "Photos" }));
  const grid = el("div", { attrs: { id: "photos-grid" } });

  const items = Array.isArray(content.items) ? content.items : [];
  items.forEach((item, index) => {
    const figure = el("figure", { className: "photo-card" });
    if (isNonEmptyString(item.image)) {
      figure.appendChild(
        el("img", {
          className: "photo-image",
          attrs: {
            src: resolvePath(item.image),
            alt: item.alt ?? `Photo ${index + 1}`,
            loading: "lazy",
          },
        }),
      );
    }
    grid.appendChild(figure);
  });

  node.appendChild(grid);
  return node;
}

function renderContactSection(content) {
  const node = el("section", { attrs: { id: "contact" } });
  node.appendChild(el("h2", { text: content.title ?? "Contact" }));

  const body = content.body ?? content.text ?? "";
  appendMarkdown(node, body, "rich-text");

  if (isNonEmptyString(content.labEmail)) {
    const list = el("ul", { className: "contact-list" });
    const item = el("li", {
      className: "contact-email-row",
      text: "•\u00A0\u00A0Lab Email: ",
    });
    item.appendChild(
      el("a", {
        className: "contact-email",
        text: content.labEmail,
        attrs: { href: `mailto:${content.labEmail}` },
      }),
    );
    list.appendChild(item);
    node.appendChild(list);
  }

  return node;
}

function renderSections(data) {
  const root = $("sections-root");
  clearChildren(root);

  const renderers = [
    ["about", renderAboutSection],
    ["research", renderResearchSection],
    ["people", renderPeopleSection],
    ["publications", renderPublicationsSection],
    ["photos", renderPhotosSection],
    ["contact", renderContactSection],
  ];

  for (const [key, renderer] of renderers) {
    const content = data[key];
    if (!content) continue;
    const node = renderer(content);
    if (node) root.appendChild(node);
  }
}

async function main() {
  try {
    const data = await loadJSON("contents.json");
    renderFavicon(data.site);
    renderMeta(data.site);
    renderHeader(data.site);
    renderHero(data.site);
    renderMainBackground(data.site);
    renderNav(data);
    renderSections(data);
    renderFooter(data.site);
  } catch (err) {
    console.error(err);
    document.body.insertAdjacentHTML(
      "afterbegin",
      '<p style="padding:1rem;color:#b00020;">Content failed to load. Check contents.json and refresh.</p>',
    );
  }
}

document.addEventListener("DOMContentLoaded", main);
