(() => {
  const top = (arr, n = 12) => {
    const m = new Map();
    for (const v of arr) {
      if (v === null || v === undefined || v === "") continue;
      m.set(v, (m.get(v) || 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([value, count]) => ({ value, count }));
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
  };
  const els = [...document.querySelectorAll("body *")].filter(visible);
  const colors = [], bgs = [], fonts = [], sizes = [], weights = [], radii = [], shadows = [], gaps = [], lineHeights = [], letterSpacings = [], borders = [];
  for (const el of els) {
    const s = getComputedStyle(el);
    colors.push(s.color);
    bgs.push(s.backgroundColor);
    fonts.push(s.fontFamily);
    sizes.push(s.fontSize);
    weights.push(s.fontWeight);
    radii.push(s.borderRadius);
    gaps.push(s.gap && s.gap !== "normal" ? s.gap : null);
    lineHeights.push(s.lineHeight);
    letterSpacings.push(s.letterSpacing);
    if (s.boxShadow !== "none") shadows.push(s.boxShadow);
    if (s.borderTopWidth !== "0px" && s.borderTopStyle !== "none") borders.push(`${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`);
  }

  const vars = {};
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const r of rules || []) {
      if (r.style && r.selectorText && /(^|,)\s*(:root|html)\s*(,|$)/.test(r.selectorText)) {
        for (const p of r.style) if (p.startsWith("--")) vars[p] = r.style.getPropertyValue(p).trim();
      }
    }
  }

  const typography = [...document.querySelectorAll("h1,h2,h3,h4,p,a,button,span")]
    .filter(visible)
    .slice(0, 400)
    .map((el) => {
      const s = getComputedStyle(el);
      const text = (el.innerText || "").replace(/\s+/g, " ").trim();
      return {
        tag: el.tagName.toLowerCase(),
        text: text.slice(0, 90),
        font: s.fontFamily.split(",")[0].replace(/["']/g, ""),
        size: s.fontSize,
        weight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        color: s.color,
        transform: s.textTransform,
      };
    })
    .filter((t) => t.text.length > 0)
    .slice(0, 120);

  const buttons = [...document.querySelectorAll("button, a[role=button], .button, [class*=btn], [class*=Button]")]
    .filter(visible)
    .slice(0, 200)
    .map((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        text: (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 50),
        tag: el.tagName.toLowerCase(),
        w: Math.round(r.width),
        h: Math.round(r.height),
        bg: s.backgroundColor,
        color: s.color,
        radius: s.borderRadius,
        border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
        font: s.fontFamily.split(",")[0].replace(/["']/g, ""),
        size: s.fontSize,
        weight: s.fontWeight,
        padding: s.padding,
      };
    })
    .filter((b) => b.text.length > 0)
    .slice(0, 60);

  const landmarks = [...document.querySelectorAll("header,nav,main,aside,footer,section,[role=banner],[role=navigation],[role=main],[role=complementary],[role=contentinfo]")]
    .filter(visible)
    .slice(0, 60)
    .map((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role"),
        label: el.getAttribute("aria-label"),
        class: (el.className || "").toString().slice(0, 80),
        top: Math.round(r.top + scrollY),
        w: Math.round(r.width),
        h: Math.round(r.height),
        bg: s.backgroundColor,
        padding: s.padding,
        position: s.position,
        z: s.zIndex,
      };
    });

  const headings = [...document.querySelectorAll("h1,h2,h3")]
    .filter(visible)
    .map((el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 110),
        size: s.fontSize,
        weight: s.fontWeight,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        font: s.fontFamily.split(",")[0].replace(/["']/g, ""),
        color: s.color,
        top: Math.round(r.top + scrollY),
        w: Math.round(r.width),
      };
    })
    .slice(0, 40);

  const cssLinks = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.href).slice(0, 20);
  const scripts = [...document.querySelectorAll("script[src]")].map((s) => s.src).slice(0, 40);

  return {
    url: location.href,
    title: document.title,
    meta: {
      description: document.querySelector('meta[name=description]')?.content || null,
      themeColor: document.querySelector('meta[name=theme-color]')?.content || null,
      viewport: document.querySelector('meta[name=viewport]')?.content || null,
      generator: document.querySelector('meta[name=generator]')?.content || null,
      ogSite: document.querySelector('meta[property="og:site_name"]')?.content || null,
    },
    viewport: { w: innerWidth, h: innerHeight, docH: document.documentElement.scrollHeight },
    counts: { elements: els.length, nodes: document.querySelectorAll("*").length, images: document.images.length },
    palette: {
      text: top(colors, 15),
      background: top(bgs, 15),
      border: top(borders, 10),
      radius: top(radii, 12),
      shadow: top(shadows, 10),
      gap: top(gaps, 12),
      fontSize: top(sizes, 16),
      fontWeight: top(weights, 10),
      lineHeight: top(lineHeights, 10),
      letterSpacing: top(letterSpacings, 10),
      fontFamily: top(fonts, 8),
    },
    cssVariables: vars,
    typography,
    headings,
    buttons,
    landmarks,
    fontsLoaded: [...document.fonts].map((f) => ({ family: f.family, weight: f.weight, style: f.style, status: f.status })).slice(0, 30),
    cssLinks,
    scripts,
  };
})()
