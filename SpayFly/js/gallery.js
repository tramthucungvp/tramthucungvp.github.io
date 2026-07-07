function initSlider(opts) {
  const container = typeof opts.container === 'string' ? document.querySelector(opts.container) : opts.container;
  if (!container) return null;
  const slides = container.querySelectorAll(opts.slideSelector || '*');
  const dots = opts.dotSelector ? document.querySelectorAll(opts.dotSelector) : [];
  const thumbs = opts.thumbSelector ? document.querySelectorAll(opts.thumbSelector) : [];
  let current = 0;
  const total = slides.length;

  function updateSliderState() {
    slides.forEach((s, i) => s.classList.toggle('active', i === current));
    if (dots.length) dots.forEach((d, i) => d.classList.toggle('active', i === current));
    if (thumbs.length) thumbs.forEach((t, i) => t.classList.toggle('active', i === current));
    if (opts.counter) {
      const el = typeof opts.counter === 'string' ? document.querySelector(opts.counter) : opts.counter;
      if (el) el.textContent = (current + 1) + ' / ' + total;
    }
    if (opts.thumbRow && thumbs.length) {
      const row = typeof opts.thumbRow === 'string' ? document.querySelector(opts.thumbRow) : opts.thumbRow;
      if (row) {
        const thumb = thumbs[current];
        row.scrollTo({ left: thumb.offsetLeft - row.offsetWidth / 2 + thumb.offsetWidth / 2, behavior: 'smooth' });
      }
    }
    if (opts.onChange) opts.onChange(current, total);
  }

  function goToSlide(i) {
    if (total === 0) return;
    if (i < 0) i = total - 1;
    else if (i >= total) i = 0;
    current = i;
    updateSliderState();
  }

  function next() { goToSlide(current + 1); }
  function prev() { goToSlide(current - 1); }

  function bindSliderEvents() {
    if (opts.prevBtn) {
      const btn = typeof opts.prevBtn === 'string' ? document.querySelector(opts.prevBtn) : opts.prevBtn;
      if (btn) btn.addEventListener('click', prev);
    }
    if (opts.nextBtn) {
      const btn = typeof opts.nextBtn === 'string' ? document.querySelector(opts.nextBtn) : opts.nextBtn;
      if (btn) btn.addEventListener('click', next);
    }
    if (dots.length) {
      dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));
    }
    if (opts.swipeContainer) {
      const el = typeof opts.swipeContainer === 'string' ? document.querySelector(opts.swipeContainer) : opts.swipeContainer;
      if (!el) return;
      let startX = 0, startY = 0, dx = 0, dy = 0, touching = false;
      el.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dx = dy = 0;
        touching = true;
      }, { passive: true });
      el.addEventListener('touchmove', e => {
        if (!touching || e.touches.length !== 1) return;
        dx = e.touches[0].clientX - startX;
        dy = e.touches[0].clientY - startY;
      }, { passive: true });
      el.addEventListener('touchend', () => {
        if (!touching) return;
        touching = false;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          dx < 0 ? next() : prev();
        }
      });
    }
  }

  return { goToSlide, next, prev, updateSliderState, bindSliderEvents, current: () => current, total };
}

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

var gallerySlider;

ready(() => {
  gallerySlider = initSlider({
    container: '#mainImgs',
    slideSelector: 'img',
    dotSelector: '.scroll-dot',
    thumbSelector: '#thumbRow img',
    thumbRow: '#thumbRow',
    counter: '#galCounter',
    swipeContainer: '#mainImgs'
  });
  if (gallerySlider) gallerySlider.bindSliderEvents();
});

function setImg(i) {
  if (gallerySlider) { gallerySlider.goToSlide(i); currentImg = gallerySlider.current(); }
}
function prevImg() { if (gallerySlider) { gallerySlider.prev(); currentImg = gallerySlider.current(); } }
function nextImg() { if (gallerySlider) { gallerySlider.next(); currentImg = gallerySlider.current(); } }
