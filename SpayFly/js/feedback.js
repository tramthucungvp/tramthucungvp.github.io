var feedbackSlider;

ready(() => {
  feedbackSlider = initSlider({
    container: '#feedbackTrack',
    slideSelector: '.feedback-slide',
    dotSelector: '.feedback-dot',
    counter: '#feedbackCounter',
    swipeContainer: '#feedbackSlider',
    prevBtn: '#feedbackSlider .feedback-arrow-prev',
    nextBtn: '#feedbackSlider .feedback-arrow-next'
  });
  if (feedbackSlider) feedbackSlider.bindSliderEvents();
});

function feedbackPrev() { if (feedbackSlider) feedbackSlider.prev(); }
function feedbackNext() { if (feedbackSlider) feedbackSlider.next(); }

function openFbLightbox(src) {
  const box = document.getElementById('fbLightbox');
  const img = document.getElementById('fbLightboxImg');
  if (!box || !img) return;
  img.src = src;
  box.style.display = 'flex';
  requestAnimationFrame(() => box.classList.add('open'));
  document.body.style.overflow = 'hidden';
}
function closeFbLightbox() {
  const box = document.getElementById('fbLightbox');
  if (!box) return;
  box.classList.remove('open');
  setTimeout(() => { box.style.display = 'none'; document.body.style.overflow = ''; }, 300);
}
