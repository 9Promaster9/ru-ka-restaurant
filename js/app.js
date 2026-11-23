(function () {
  'use strict';

  async function loadData() {
    try {
      const response = await fetch('data/data.json', { cache: 'no-store' });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      // Локальное открытие через file:// — используем резервную копию из js/data.js
    }
    return window.RESTAURANT_DATA || null;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderAnnouncement(announcement) {
    const bar = document.getElementById('announcementBar');
    if (!bar || !announcement || !announcement.enabled || !announcement.text) return;
    bar.textContent = announcement.text;
    bar.classList.toggle('is-important', announcement.style === 'important');
    bar.hidden = false;
  }

  function renderAbout(about) {
    if (!about) return;
    const titleEl = document.getElementById('aboutTitle');
    if (titleEl && about.title) titleEl.textContent = about.title;

    const paragraphsEl = document.getElementById('aboutParagraphs');
    if (paragraphsEl && Array.isArray(about.paragraphs)) {
      paragraphsEl.innerHTML = about.paragraphs
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('');
    }

    const highlightsEl = document.getElementById('aboutHighlights');
    if (highlightsEl && Array.isArray(about.highlights)) {
      highlightsEl.innerHTML = about.highlights
        .map(
          (item) => `
          <div class="highlight-box">
            <span class="highlight-label">${escapeHtml(item.label)}</span>
            <span class="highlight-value">${escapeHtml(item.value)}</span>
          </div>`
        )
        .join('');
    }

    const galleryEl = document.getElementById('aboutGallery');
    if (galleryEl && Array.isArray(about.gallery)) {
      galleryEl.innerHTML = about.gallery
        .map(
          (photo) => `
          <figure class="gallery-item">
            <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" loading="lazy">
            <figcaption>${escapeHtml(photo.caption)}</figcaption>
          </figure>`
        )
        .join('');
    }
  }

  function renderMenu(menu) {
    const container = document.getElementById('menuContainer');
    if (!container || !menu) return;

    if (!menu.available || !Array.isArray(menu.items) || menu.items.length === 0) {
      const code = menu.unavailableCode || 'Н/Д';
      const title = menu.unavailableTitle || 'Меню сейчас недоступно';
      const note = menu.unavailableNote || '';

      container.innerHTML = `
        <div class="menu-unavailable-card" role="status" aria-live="polite">
          <p class="menu-unavailable-code">${escapeHtml(code)}</p>
          <p class="menu-unavailable-title">${escapeHtml(title)}</p>
          ${note ? `<p class="menu-unavailable-note">${escapeHtml(note)}</p>` : ''}
        </div>
      `;
    }
  }

  function renderReviews(reviews) {
    const tabsEl = document.getElementById('reviewTabs');
    const panelEl = document.getElementById('reviewPanel');
    if (!tabsEl || !panelEl || !reviews || !Array.isArray(reviews.sources)) return;

    let activeIndex = 0;

    function drawPanel(index) {
      const source = reviews.sources[index];
      if (!source) return;

      const metricsHtml =
        Array.isArray(source.metrics) && source.metrics.length > 0
          ? `<div class="reviews-metrics">${source.metrics
              .map(
                (m) =>
                  `<span class="metric-chip">${escapeHtml(m.label)} · ${escapeHtml(m.value)}</span>`
              )
              .join('')}</div>`
          : '';

      const linkHtml = source.url
        ? `<a class="btn btn-secondary btn-sm" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">Открыть ${escapeHtml(source.label)}</a>`
        : '';

      const itemsHtml =
        Array.isArray(source.items) && source.items.length > 0
          ? `<div class="reviews-items-grid">${source.items
              .map(
                (item) => `
                <article class="review-item">
                  <div class="review-item-head">
                    <span class="review-author">${escapeHtml(item.author)}</span>
                    <span class="review-date">${escapeHtml(item.date)}</span>
                  </div>
                  <p class="review-text">${escapeHtml(item.text)}</p>
                </article>`
              )
              .join('')}</div>`
          : `<div class="reviews-empty">${escapeHtml(source.emptyNote || 'Н/Д')}</div>`;

      panelEl.innerHTML = `
        <div class="reviews-summary-bar">
          <div class="reviews-score-wrap">
            <span class="reviews-score">${escapeHtml(source.rating)}</span>
            <span class="reviews-count">${escapeHtml(source.countText)}</span>
          </div>
          ${linkHtml}
        </div>
        ${metricsHtml}
        ${itemsHtml}
      `;
    }

    function drawTabs() {
      tabsEl.innerHTML = reviews.sources
        .map(
          (src, idx) => `
          <button
            type="button"
            class="tab-btn ${idx === activeIndex ? 'is-active' : ''}"
            role="tab"
            aria-selected="${idx === activeIndex ? 'true' : 'false'}"
            data-tab-index="${idx}"
          >
            ${escapeHtml(src.label)}
          </button>`
        )
        .join('');

      tabsEl.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeIndex = Number(btn.getAttribute('data-tab-index'));
          drawTabs();
          drawPanel(activeIndex);
        });
      });
    }

    drawTabs();
    drawPanel(activeIndex);
  }

  function renderContacts(contacts) {
    if (!contacts) return;
    const addrEl = document.getElementById('contactAddress');
    const addrNoteEl = document.getElementById('contactAddressNote');
    const phoneEl = document.getElementById('contactPhone');
    const heroPhoneEl = document.getElementById('heroPhone');
    const bookingPhoneEl = document.getElementById('bookingPhone');
    const hoursEl = document.getElementById('contactHours');
    const heroHoursEl = document.getElementById('heroHours');
    const emailEl = document.getElementById('contactEmail');
    const linksEl = document.getElementById('contactMapLinks');

    if (addrEl) addrEl.textContent = contacts.address || 'Н/Д';
    if (addrNoteEl) addrNoteEl.textContent = contacts.addressNote || '';
    if (hoursEl) hoursEl.textContent = contacts.hours || 'Н/Д';
    if (heroHoursEl) heroHoursEl.textContent = contacts.hours || 'Н/Д';
    if (emailEl) emailEl.textContent = contacts.email || 'Н/Д';

    [phoneEl, heroPhoneEl, bookingPhoneEl].forEach((el) => {
      if (!el) return;
      el.textContent = contacts.phone || 'Н/Д';
      if (contacts.phoneRaw) {
        el.setAttribute('href', `tel:${contacts.phoneRaw}`);
      }
    });

    if (linksEl && Array.isArray(contacts.mapLinks)) {
      linksEl.innerHTML = contacts.mapLinks
        .map(
          (link) =>
            `<a class="btn btn-secondary" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.label)}</a>`
        )
        .join('');
    }
  }

  function initMobileMenu() {
    const btn = document.getElementById('burgerBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;

    btn.addEventListener('click', () => {
      const isOpen = !menu.hidden;
      menu.hidden = isOpen;
      btn.setAttribute('aria-expanded', String(!isOpen));
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initBookingForm(bookingConfig) {
    const form = document.getElementById('bookingForm');
    const errorEl = document.getElementById('bookingError');
    const modal = document.getElementById('bookingModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalText = document.getElementById('modalText');
    const modalSummary = document.getElementById('modalSummary');
    const closeBtn = document.getElementById('modalCloseBtn');
    const dateInput = document.getElementById('bookingDate');

    if (!form || !modal) return;

    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.setAttribute('min', today);
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (errorEl) errorEl.textContent = '';

      const date = form.date.value.trim();
      const time = form.time.value.trim();
      const guests = form.guests.value.trim();
      const name = form.name.value.trim();
      const comment = form.comment.value.trim();

      if (!date || !time || !guests || !name) {
        if (errorEl) {
          errorEl.textContent = 'Пожалуйста, заполните дату, время, количество гостей и ваше имя.';
        }
        return;
      }

      if (modalTitle && bookingConfig && bookingConfig.demoModalTitle) {
        modalTitle.textContent = bookingConfig.demoModalTitle;
      }
      if (modalText && bookingConfig && bookingConfig.demoModalText) {
        modalText.textContent = bookingConfig.demoModalText;
      }

      if (modalSummary) {
        modalSummary.innerHTML = `
          <div><strong>Имя:</strong> ${escapeHtml(name)}</div>
          <div><strong>Дата и время:</strong> ${escapeHtml(date)} в ${escapeHtml(time)}</div>
          <div><strong>Гости:</strong> ${escapeHtml(guests)}</div>
          ${comment ? `<div><strong>Комментарий:</strong> ${escapeHtml(comment)}</div>` : ''}
        `;
      }

      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      form.reset();
    });
  }

  function initRevealAnimations() {
    const items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    items.forEach((el) => observer.observe(el));
  }

  async function init() {
    const data = await loadData();
    if (!data) return;

    if (data.meta) {
      const demoBanner = document.getElementById('demoBanner');
      const footerDemo = document.getElementById('footerDemoNote');
      if (demoBanner && data.meta.demoBannerText) {
        demoBanner.textContent = data.meta.demoBannerText;
      }
      if (footerDemo && data.meta.demoBannerText) {
        footerDemo.textContent = data.meta.demoBannerText;
      }
    }

    renderAnnouncement(data.announcement);
    renderAbout(data.about);
    renderMenu(data.menu);
    renderReviews(data.reviews);
    renderContacts(data.contacts);
    initMobileMenu();
    initBookingForm(data.booking);
    initRevealAnimations();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
