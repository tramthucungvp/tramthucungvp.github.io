(function() {
    const scroll = document.getElementById('feedbackScroll');
    const dots = document.querySelectorAll('#feedbackDots .feedback-dot');
    if (!scroll || !dots.length) return;
    
    let currentIndex = 0;
    const cards = scroll.querySelectorAll('.feedback-card');
    const total = cards.length;
    
    function updateDots(index) {
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }
    
    window.scrollFeedback = function(direction) {
        currentIndex += direction;
        if (currentIndex < 0) currentIndex = total - 1;
        if (currentIndex >= total) currentIndex = 0;
        
        const cardWidth = cards[0].offsetWidth + 12;
        scroll.scrollTo({ left: currentIndex * cardWidth, behavior: 'smooth' });
        updateDots(currentIndex);
    };
    
    scroll.addEventListener('scroll', () => {
        const cardWidth = cards[0].offsetWidth + 12;
        const newIndex = Math.round(scroll.scrollLeft / cardWidth);
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < total) {
            currentIndex = newIndex;
            updateDots(currentIndex);
        }
    }, { passive: true });
    
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            currentIndex = i;
            const cardWidth = cards[0].offsetWidth + 12;
            scroll.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
            updateDots(i);
        });
    });
})();

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
