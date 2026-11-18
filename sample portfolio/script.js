'use strict';

/**
 * Workshop Portfolio Interactivity (Pure Vanilla JS)
 * ---------------------------------------------------------------------------
 * Handles theme switching, mobile navigation, active section highlighting,
 * copy-to-clipboard buttons, dynamic filter pills, expandable timeline cards,
 * live project search, and accessible detail modals.
 */

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  initThemeToggle();
  initMobileMenu();
  initActiveNavHighlight();
  initCopyButtons();
  updateOverviewCounts();

  const modal = initModal();
  initExperienceSection();
  initCertificationsSection(modal);
  initProjectsSection(modal);
});

/* ---------------------------------------------------------------------------
   1. Theme Switching (Light / Dark Mode)
   --------------------------------------------------------------------------- */
function initThemeToggle() {
  const STORAGE_KEY = 'workshop-portfolio-theme';
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const getInitialTheme = () => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // Ignore storage access errors.
    }
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    toggleBtn.setAttribute(
      'aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
    );
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage access errors.
    }
  };

  applyTheme(getInitialTheme());

  toggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

/* ---------------------------------------------------------------------------
   2. Mobile Navigation Drawer & Scroll Active Highlighting
   --------------------------------------------------------------------------- */
function initMobileMenu() {
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');
  if (!toggleBtn || !mobileNav) return;

  const setOpen = (isOpen) => {
    mobileNav.hidden = !isOpen;
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    toggleBtn.setAttribute(
      'aria-label',
      isOpen ? 'Close navigation menu' : 'Open navigation menu',
    );
  };

  toggleBtn.addEventListener('click', () => {
    setOpen(mobileNav.hidden);
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });
}

function initActiveNavHighlight() {
  const sections = Array.from(document.querySelectorAll('main section[id], footer[id]'));
  const navLinks = Array.from(document.querySelectorAll('.nav-link, .nav-mobile-link'));
  if (!sections.length || !navLinks.length || typeof IntersectionObserver === 'undefined') {
    return;
  }

  const setActive = (id) => {
    navLinks.forEach((link) => {
      const isMatch = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', isMatch);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]?.target.id) {
        setActive(visible[0].target.id);
      }
    },
    { rootMargin: '-25% 0px -55% 0px', threshold: [0.1, 0.3, 0.6] },
  );

  sections.forEach((section) => observer.observe(section));
}

/* ---------------------------------------------------------------------------
   3. Copy to Clipboard Helper (Shared by Hero, Footer, and Modal)
   --------------------------------------------------------------------------- */
async function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

function attachCopyHandler(button, getValue, defaultLabel) {
  let resetTimer = null;

  button.addEventListener('click', async () => {
    try {
      await copyText(getValue());
      const labelEl = button.querySelector('.copy-label') || button;
      labelEl.textContent = 'Copied!';
      if (resetTimer) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        labelEl.textContent = defaultLabel;
      }, 2000);
    } catch {
      // Clipboard blocked in restricted browser contexts; ignore silently.
    }
  });
}

function initCopyButtons() {
  document.querySelectorAll('.copy-trigger').forEach((button) => {
    const value = button.dataset.copyText || '';
    const defaultLabel = button.dataset.defaultLabel || value;
    attachCopyHandler(button, () => value, defaultLabel);
  });
}

/* ---------------------------------------------------------------------------
   4. Shared Overview Counters & Dynamic Filter Pill Builder
   --------------------------------------------------------------------------- */
function updateOverviewCounts() {
  const countMap = {
    experience: document.querySelectorAll('#experience-list .timeline-item').length,
    certifications: document.querySelectorAll('#cert-grid .cert-card').length,
    projects: document.querySelectorAll('#project-grid .project-card').length,
  };

  Object.entries(countMap).forEach(([key, count]) => {
    const el = document.querySelector(`[data-count-for="${key}"]`);
    if (el) {
      el.textContent = `${count} ${count === 1 ? 'Example' : 'Examples'}`;
    }
  });
}

function buildFilterPills(container, items, getKey, onSelect) {
  if (!container) return () => {};

  const counts = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const options = [
    { value: 'All', label: 'All', count: items.length },
    ...Array.from(counts.entries()).map(([value, count]) => ({
      value,
      label: value,
      count,
    })),
  ];

  container.innerHTML = '';
  const buttons = [];

  const setActivePill = (activeValue) => {
    buttons.forEach((btn) => {
      const isActive = btn.dataset.filterValue === activeValue;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  };

  options.forEach((option) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-pill';
    btn.dataset.filterValue = option.value;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = option.label;

    const countSpan = document.createElement('span');
    countSpan.className = 'filter-pill-count';
    countSpan.textContent = String(option.count);

    btn.append(labelSpan, countSpan);
    btn.addEventListener('click', () => {
      setActivePill(option.value);
      onSelect(option.value);
    });

    container.appendChild(btn);
    buttons.push(btn);
  });

  setActivePill('All');
  return setActivePill;
}

/* ---------------------------------------------------------------------------
   5. Experience Timeline (Type Filter + Expand / Collapse)
   --------------------------------------------------------------------------- */
function initExperienceSection() {
  const items = Array.from(document.querySelectorAll('#experience-list .timeline-item'));
  const filterContainer = document.getElementById('experience-filters');
  const toggleAllBtn = document.getElementById('toggle-all-experiences');
  if (!items.length) return;

  const setItemExpanded = (item, expanded) => {
    const trigger = item.querySelector('.timeline-trigger');
    const content = item.querySelector('.timeline-content');
    const chevron = item.querySelector('.timeline-chevron');
    if (!trigger || !content) return;

    item.classList.toggle('is-expanded', expanded);
    trigger.setAttribute('aria-expanded', String(expanded));
    content.hidden = !expanded;
    if (chevron) chevron.classList.toggle('is-rotated', expanded);
  };

  const getVisibleItems = () => items.filter((item) => !item.hidden);

  const syncToggleAllLabel = () => {
    if (!toggleAllBtn) return;
    const visible = getVisibleItems();
    const allExpanded =
      visible.length > 0 && visible.every((item) => item.classList.contains('is-expanded'));
    toggleAllBtn.textContent = allExpanded ? 'Collapse all' : 'Expand all';
    toggleAllBtn.disabled = visible.length === 0;
  };

  items.forEach((item) => {
    const trigger = item.querySelector('.timeline-trigger');
    if (!trigger) return;
    trigger.addEventListener('click', () => {
      const nextState = !item.classList.contains('is-expanded');
      setItemExpanded(item, nextState);
      syncToggleAllLabel();
    });
  });

  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', () => {
      const visible = getVisibleItems();
      const shouldExpand = !visible.every((item) =>
        item.classList.contains('is-expanded'),
      );
      visible.forEach((item) => setItemExpanded(item, shouldExpand));
      syncToggleAllLabel();
    });
  }

  buildFilterPills(
    filterContainer,
    items,
    (item) => item.dataset.type || 'Other',
    (selectedType) => {
      items.forEach((item) => {
        item.hidden = selectedType !== 'All' && item.dataset.type !== selectedType;
      });
      syncToggleAllLabel();
    },
  );

  syncToggleAllLabel();
}

/* ---------------------------------------------------------------------------
   6. Accessible Reusable Modal
   --------------------------------------------------------------------------- */
function initModal() {
  const backdrop = document.getElementById('detail-modal');
  const titleEl = document.getElementById('modal-title');
  const subtitleEl = document.getElementById('modal-subtitle');
  const bodyEl = document.getElementById('modal-body');
  const closeBtn = document.getElementById('modal-close-btn');

  if (!backdrop || !titleEl || !subtitleEl || !bodyEl || !closeBtn) {
    return { open: () => {}, close: () => {} };
  }

  let lastFocusedEl = null;

  const close = () => {
    if (backdrop.hidden) return;
    backdrop.hidden = true;
    document.body.style.overflow = '';
    bodyEl.innerHTML = '';
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  };

  const open = ({ title, subtitle, buildBody }) => {
    lastFocusedEl = document.activeElement;
    titleEl.textContent = title;
    subtitleEl.textContent = subtitle || '';
    bodyEl.innerHTML = '';
    buildBody(bodyEl);

    backdrop.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) close();
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !backdrop.hidden) close();
  });

  return { open, close };
}

/* ---------------------------------------------------------------------------
   7. Certifications Section (Category Filter + Credential Modal)
   --------------------------------------------------------------------------- */
function initCertificationsSection(modal) {
  const cards = Array.from(document.querySelectorAll('#cert-grid .cert-card'));
  const filterContainer = document.getElementById('cert-filters');
  if (!cards.length) return;

  buildFilterPills(
    filterContainer,
    cards,
    (card) => card.dataset.category || 'General',
    (selectedCategory) => {
      cards.forEach((card) => {
        card.hidden =
          selectedCategory !== 'All' && card.dataset.category !== selectedCategory;
      });
    },
  );

  cards.forEach((card) => {
    const inspectBtn = card.querySelector('.inspect-cert-btn');
    if (!inspectBtn) return;

    inspectBtn.addEventListener('click', () => {
      const title = card.querySelector('.cert-title')?.textContent?.trim() || '';
      const issuer = card.querySelector('.cert-issuer')?.textContent?.trim() || '';
      const summary = card.querySelector('.cert-summary')?.textContent?.trim() || '';
      const category = card.dataset.category || '';
      const issued = card.dataset.issued || '';
      const expiry = card.dataset.expiry || 'No expiration';
      const credentialId = card.dataset.credentialId || '';
      const verifyUrl = card.dataset.verifyUrl || '';
      const tags = Array.from(card.querySelectorAll('.tag-list .tag')).map((el) =>
        el.textContent.trim(),
      );

      modal.open({
        title,
        subtitle: `${issuer} · ${category}`,
        buildBody: (container) => {
          const stack = document.createElement('div');
          stack.className = 'modal-stack';

          const lead = document.createElement('p');
          lead.className = 'modal-lead';
          lead.textContent = summary;

          const grid = document.createElement('dl');
          grid.className = 'detail-grid';

          const addDetail = (label, value, isWide = false) => {
            const item = document.createElement('div');
            item.className = isWide ? 'detail-item detail-item-wide' : 'detail-item';
            const dt = document.createElement('dt');
            dt.textContent = label;
            const dd = document.createElement('dd');
            if (typeof value === 'string') {
              dd.textContent = value;
            } else {
              dd.appendChild(value);
            }
            item.append(dt, dd);
            grid.appendChild(item);
          };

          addDetail('Issued', issued);
          addDetail('Valid Through', expiry);

          const idRow = document.createElement('div');
          idRow.className = 'credential-id-row';
          const codeEl = document.createElement('code');
          codeEl.textContent = credentialId;
          const copyBtn = document.createElement('button');
          copyBtn.type = 'button';
          copyBtn.className = 'btn btn-ghost btn-xs';
          copyBtn.textContent = 'Copy ID';
          attachCopyHandler(copyBtn, () => credentialId, 'Copy ID');
          idRow.append(codeEl, copyBtn);
          addDetail('Credential ID', idRow, true);

          const skillsSection = document.createElement('div');
          const skillsHeading = document.createElement('h4');
          skillsHeading.className = 'modal-subheading';
          skillsHeading.textContent = 'Validated Skills';
          const tagList = document.createElement('div');
          tagList.className = 'tag-list';
          tags.forEach((tagText) => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tagText;
            tagList.appendChild(span);
          });
          skillsSection.append(skillsHeading, tagList);

          stack.append(lead, grid, skillsSection);

          if (verifyUrl) {
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            const verifyLink = document.createElement('a');
            verifyLink.href = verifyUrl;
            verifyLink.target = '_blank';
            verifyLink.rel = 'noreferrer';
            verifyLink.className = 'btn btn-primary';
            verifyLink.textContent = 'Verify Official Credential';
            actions.appendChild(verifyLink);
            stack.appendChild(actions);
          }

          container.appendChild(stack);
        },
      });
    });
  });
}

/* ---------------------------------------------------------------------------
   8. Projects Section (Category Filter + Live Search + Case Study Modal)
   --------------------------------------------------------------------------- */
function initProjectsSection(modal) {
  const cards = Array.from(document.querySelectorAll('#project-grid .project-card'));
  const filterContainer = document.getElementById('project-filters');
  const searchInput = document.getElementById('project-search');
  const clearBtn = document.getElementById('project-search-clear');
  const statusEl = document.getElementById('project-results-status');
  const statusTextEl = document.getElementById('project-results-text');
  const emptyStateEl = document.getElementById('project-empty-state');
  const resetButtons = document.querySelectorAll('.reset-projects-btn');
  if (!cards.length) return;

  let activeCategory = 'All';

  const applyFilters = () => {
    const query = (searchInput?.value || '').trim().toLowerCase();
    if (clearBtn) clearBtn.hidden = query.length === 0;

    let visibleCount = 0;

    cards.forEach((card) => {
      const matchesCategory =
        activeCategory === 'All' || card.dataset.category === activeCategory;
      const searchableText = [
        card.querySelector('.project-title')?.textContent,
        card.querySelector('.project-tagline')?.textContent,
        card.querySelector('.project-summary')?.textContent,
        card.dataset.category,
        ...Array.from(card.querySelectorAll('.tag-list .tag')).map((t) => t.textContent),
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !query || searchableText.includes(query);
      const isVisible = matchesCategory && matchesSearch;
      card.hidden = !isVisible;
      if (isVisible) visibleCount += 1;
    });

    const isFiltered = activeCategory !== 'All' || query.length > 0;
    if (statusEl && statusTextEl) {
      statusEl.hidden = !(isFiltered && visibleCount > 0);
      statusTextEl.innerHTML = `Showing <strong>${visibleCount}</strong> of ${cards.length} projects`;
    }
    if (emptyStateEl) {
      emptyStateEl.hidden = visibleCount > 0;
    }
  };

  const setActivePill = buildFilterPills(
    filterContainer,
    cards,
    (card) => card.dataset.category || 'Other',
    (selectedCategory) => {
      activeCategory = selectedCategory;
      applyFilters();
    },
  );

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (clearBtn && searchInput) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      applyFilters();
      searchInput.focus();
    });
  }

  resetButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      activeCategory = 'All';
      setActivePill('All');
      if (searchInput) searchInput.value = '';
      applyFilters();
    });
  });

  cards.forEach((card) => {
    const viewBtn = card.querySelector('.view-project-btn');
    if (!viewBtn) return;

    viewBtn.addEventListener('click', () => {
      const title = card.querySelector('.project-title')?.textContent?.trim() || '';
      const tagline = card.querySelector('.project-tagline')?.textContent?.trim() || '';
      const category = card.dataset.category || '';
      const status = card.dataset.status || '';
      const year = card.dataset.year || '';
      const liveUrl = card.dataset.liveUrl || '';
      const repoUrl = card.dataset.repoUrl || '';
      const problem = card.querySelector('.extra-problem')?.textContent?.trim() || '';
      const solution = card.querySelector('.extra-solution')?.textContent?.trim() || '';
      const highlights = Array.from(
        card.querySelectorAll('.extra-highlights li'),
      ).map((li) => li.textContent.trim());
      const tags = Array.from(card.querySelectorAll('.tag-list .tag')).map((el) =>
        el.textContent.trim(),
      );

      modal.open({
        title,
        subtitle: [category, status, year].filter(Boolean).join(' · '),
        buildBody: (container) => {
          const stack = document.createElement('div');
          stack.className = 'modal-stack';

          const lead = document.createElement('p');
          lead.className = 'modal-lead';
          lead.textContent = tagline;
          stack.appendChild(lead);

          if (problem || solution) {
            const grid = document.createElement('div');
            grid.className = 'case-study-grid';

            const makeBox = (heading, text) => {
              const box = document.createElement('div');
              box.className = 'case-study-box';
              const h4 = document.createElement('h4');
              h4.className = 'modal-subheading';
              h4.textContent = heading;
              const p = document.createElement('p');
              p.textContent = text;
              box.append(h4, p);
              return box;
            };

            if (problem) grid.appendChild(makeBox('The Challenge', problem));
            if (solution) grid.appendChild(makeBox('The Approach', solution));
            stack.appendChild(grid);
          }

          if (highlights.length) {
            const hlWrap = document.createElement('div');
            const h4 = document.createElement('h4');
            h4.className = 'modal-subheading';
            h4.textContent = 'Key Highlights';
            const ul = document.createElement('ul');
            ul.className = 'achievement-list';
            highlights.forEach((item) => {
              const li = document.createElement('li');
              li.textContent = item;
              ul.appendChild(li);
            });
            hlWrap.append(h4, ul);
            stack.appendChild(hlWrap);
          }

          const techWrap = document.createElement('div');
          const techHeading = document.createElement('h4');
          techHeading.className = 'modal-subheading';
          techHeading.textContent = 'Tech Stack';
          const tagList = document.createElement('div');
          tagList.className = 'tag-list';
          tags.forEach((tech) => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tech;
            tagList.appendChild(span);
          });
          techWrap.append(techHeading, tagList);
          stack.appendChild(techWrap);

          if (liveUrl || repoUrl) {
            const actions = document.createElement('div');
            actions.className = 'modal-actions';
            if (liveUrl) {
              const liveLink = document.createElement('a');
              liveLink.href = liveUrl;
              liveLink.target = '_blank';
              liveLink.rel = 'noreferrer';
              liveLink.className = 'btn btn-primary';
              liveLink.textContent = 'Visit Live Project';
              actions.appendChild(liveLink);
            }
            if (repoUrl) {
              const repoLink = document.createElement('a');
              repoLink.href = repoUrl;
              repoLink.target = '_blank';
              repoLink.rel = 'noreferrer';
              repoLink.className = 'btn btn-secondary';
              repoLink.textContent = 'View Source Code';
              actions.appendChild(repoLink);
            }
            stack.appendChild(actions);
          }

          container.appendChild(stack);
        },
      });
    });
  });
}
