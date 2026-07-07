function setImg(i) {
    const imgs = document.querySelectorAll('#mainImgs img');
    const thumbs = document.querySelectorAll('#thumbRow img');
    const dots = document.querySelectorAll('.scroll-dot');
    const total = imgs.length;
    if (i < 0) i = total - 1;
    else if (i >= total) i = 0;
    imgs[currentImg].classList.remove('active');
    thumbs[currentImg].classList.remove('active');
    dots[currentImg].classList.remove('active');
    currentImg = i;
    imgs[i].classList.add('active');
    thumbs[i].classList.add('active');
    dots[i].classList.add('active');
    const row = document.getElementById('thumbRow');
    row.scrollTo({ left: thumbs[i].offsetLeft - row.offsetWidth / 2 + thumbs[i].offsetWidth / 2, behavior: 'smooth' });
    const counter = document.getElementById('galCounter');
    if (counter) counter.textContent = (i + 1) + ' / ' + total;
}

function prevImg() { setImg(currentImg - 1); }
function nextImg() { setImg(currentImg + 1); }

(function () {
    const gal = document.getElementById('mainImgs');
    if (!gal) return;
    let startX = 0, startY = 0, dx = 0, dy = 0, touching = false;
    gal.addEventListener('touchstart', e => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dx = dy = 0;
        touching = true;
    }, { passive: true });
    gal.addEventListener('touchmove', e => {
        if (!touching || e.touches.length !== 1) return;
        dx = e.touches[0].clientX - startX;
        dy = e.touches[0].clientY - startY;
    }, { passive: true });
    gal.addEventListener('touchend', () => {
        if (!touching) return;
        touching = false;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
            if (dx < 0) nextImg(); else prevImg();
        }
    });
})();
