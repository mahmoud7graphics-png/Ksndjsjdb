(function() {
    'use strict';
    let mp = false, cli = 0, gd = [], eo = false, go = false, mt = 0, cv = null;
    let musicRetryInterval = null;

    window.addEventListener('load', initApp);

    function initApp() {
        hideLoadingScreen();
        fillAllTexts();
        buildAllSections();
        setupAllInteractions();
        setupScrollAnimations();
        createHeroParticles();
        setupAutoPlayMusic();
        preloadVisibleContent();
    }

    function preloadVisibleContent() {
        const imageObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset && img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.remove('gallery-img-placeholder');
                    }
                    imageObserver.unobserve(img);
                }
            });
        }, { rootMargin: '400px' });

        const videoObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    const video = entry.target;
                    if (video.dataset && video.dataset.src && !video.src) {
                        video.src = video.dataset.src;
                        video.load();
                    }
                    videoObserver.unobserve(video);
                }
            });
        }, { rootMargin: '300px' });

        document.querySelectorAll('img[data-src]').forEach(function(img) {
            imageObserver.observe(img);
        });

        document.querySelectorAll('.video-player[data-src]').forEach(function(video) {
            videoObserver.observe(video);
        });

        const firstVideo = document.querySelector('.video-player[data-src]');
        if (firstVideo) {
            firstVideo.src = firstVideo.dataset.src;
            firstVideo.load();
        }
    }

    function setupAutoPlayMusic() {
        const bm = document.getElementById('bgMusic'), mtg = document.getElementById('musicToggle');
        if (!bm) return;
        bm.src = SITE_CONFIG.music.src;
        bm.loop = true;
        bm.volume = 0.5;
        bm.preload = "none";

        function tryPlay() {
            if (mp) return;
            bm.load();
            bm.play().then(function() {
                mp = true;
                if (mtg) mtg.classList.add('playing');
                if (musicRetryInterval) { clearInterval(musicRetryInterval); musicRetryInterval = null; }
            }).catch(function() {});
        }

        tryPlay();
        musicRetryInterval = setInterval(tryPlay, 1000);

        function playOnInteraction() {
            if (mp) return;
            bm.load();
            tryPlay();
        }

        document.addEventListener('click', playOnInteraction, { once: true });
        document.addEventListener('scroll', playOnInteraction, { once: true });
        document.addEventListener('touchstart', playOnInteraction, { once: true });

        setTimeout(function() {
            if (musicRetryInterval) { clearInterval(musicRetryInterval); musicRetryInterval = null; }
        }, 60000);
    }

    function stopMusic() {
        const bm = document.getElementById('bgMusic'), mtg = document.getElementById('musicToggle');
        if (bm && !bm.paused) { mt = bm.currentTime; bm.pause(); mp = false; if (mtg) mtg.classList.remove('playing'); }
    }

    function resumeMusic() {
        const bm = document.getElementById('bgMusic'), mtg = document.getElementById('musicToggle');
        if (bm && bm.paused) { bm.currentTime = mt; bm.play().then(function() { mp = true; if (mtg) mtg.classList.add('playing'); }).catch(function() {}); }
    }

    function pauseAllVideos() {
        document.querySelectorAll('.video-player').forEach(function(v) {
            if (!v.paused) {
                v.pause(); v.classList.remove('active'); v.style.display = 'none';
                const t = v.closest('.video-thumbnail'), c = v.closest('.video-card');
                if (t) {
                    const pw = t.querySelector('.video-play-icon-wrapper');
                    if (pw) pw.classList.remove('hidden');
                    const th = t.querySelector('.video-tap-hint');
                    if (th) th.classList.remove('hidden');
                }
                if (c) c.classList.remove('playing');
            }
        });
        cv = null;
    }

    function playVideoAndPauseMusic(video, thumb) {
        stopMusic();
        pauseAllVideos();

        const pw = thumb.querySelector('.video-play-icon-wrapper'), thHint = thumb.querySelector('.video-tap-hint');
        const pb = thumb.querySelector('.video-progress-bar'), gl = thumb.querySelector('.video-glow');
        const card = thumb.closest('.video-card');

        if (!video.src && video.dataset && video.dataset.src) {
            video.src = video.dataset.src;
            video.load();
        }

        video.style.display = 'block';
        video.classList.add('active');
        video.muted = false;
        video.volume = 1.0;
        cv = video;

        function startPlayback() {
            video.play().then(function() {
                pw.classList.add('hidden'); thHint.classList.add('hidden');
                if (card) card.classList.add('playing'); if (gl) gl.classList.add('active');
                video.addEventListener('timeupdate', function() { if (video.duration && pb) pb.style.width = (video.currentTime / video.duration) * 100 + '%'; });
                video.addEventListener('ended', function() {
                    pw.classList.remove('hidden'); thHint.classList.remove('hidden');
                    if (card) card.classList.remove('playing'); if (gl) gl.classList.remove('active');
                    if (pb) pb.style.width = '0%'; video.style.display = 'none';
                    video.classList.remove('active'); cv = null;
                    resumeMusic();
                });
            }).catch(function() {
                video.muted = true;
                video.play().then(function() {
                    pw.classList.add('hidden'); thHint.classList.add('hidden');
                    if (card) card.classList.add('playing'); if (gl) gl.classList.add('active');
                }).catch(function() {});
            });
        }

        if (video.readyState >= 2) { startPlayback(); }
        else { video.addEventListener('canplay', function onReady() { startPlayback(); video.removeEventListener('canplay', onReady); }, { once: true }); }
    }

    function hideLoadingScreen() {
        const ls = document.getElementById('loadingScreen');
        if (ls) setTimeout(() => { ls.classList.add('hidden'); document.body.classList.remove('loading'); }, 600);
    }

    function fillAllTexts() {
        const C = SITE_CONFIG;
        st('heroTitle', C.hero.mainTitle); st('heroSubtitle', C.hero.subTitle); sh('heroDescription', C.hero.description);
        st('heroButtonText', C.hero.buttonText); st('videosTitle', C.videos.sectionTitle); st('galleryTitle', C.gallery.sectionTitle);
        st('messagesTitle', C.unsaidThings.sectionTitle); st('timelineTitle', C.timeline.sectionTitle);
        st('letterPrompt', C.letter.envelopeText); st('surpriseIntro', C.surpriseBox.introText);
        st('finalTitle', C.finalPage.title); sh('finalDescription', C.finalPage.description);
        st('yesButtonText', C.finalPage.yesButton); st('noButtonText', C.finalPage.noButton);
        st('finalReadMoreText', C.finalPage.finalButton); sh('endingMessage', C.ending.message);
        st('endingApology', C.ending.apology); st('endingSignature', C.ending.signature);
    }

    function st(id, t) { const e = document.getElementById(id); if (e && t) e.textContent = t; }
    function sh(id, h) { const e = document.getElementById(id); if (e && h) e.innerHTML = h.replace(/\n/g, '<br>'); }

    function buildAllSections() { buildVideos(); buildGallery(); buildMessages(); buildTimeline(); }

    function buildVideos() {
        const grid = document.getElementById('videosGrid');
        if (!grid) return;
        const grads = [
            'linear-gradient(160deg, #1a0812 0%, #2d0f1f 30%, #1a0f15 60%, #0d060a 100%)',
            'linear-gradient(160deg, #0f081a 0%, #1c0f2d 30%, #140f1a 60%, #0a060d 100%)',
            'linear-gradient(160deg, #1a0a08 0%, #2d130f 30%, #1a100f 60%, #0d0806 100%)',
            'linear-gradient(160deg, #08101a 0%, #0f1a2d 30%, #0f141a 60%, #060a0d 100%)'
        ];
        SITE_CONFIG.videos.items.forEach(function(v, i) {
            const card = document.createElement('div');
            card.className = 'video-card reveal';
            card.style.animationDelay = (i * 0.2) + 's';
            card.setAttribute('data-video-index', i);
            card.innerHTML = `<div class="video-number-badge">${String(i + 1).padStart(2, '0')}</div><div class="video-thumbnail" style="background: ${grads[i % 4]};"><div class="video-bg-particles"></div><div class="video-play-icon-wrapper"><div class="video-play-ripple"></div><div class="video-play-circle"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div></div><p class="video-tap-hint">اضغطي للمشاهدة 🎬</p><video class="video-player" preload="none" playsinline webkit-playsinline data-src="${v.src}" muted></video><div class="video-progress"><div class="video-progress-bar"></div></div><div class="video-glow"></div></div><div class="video-info"><h3 class="video-title">${v.title}</h3><p class="video-love-quote">${v.loveQuote}</p><div class="video-info-divider"></div></div>`;
            grid.appendChild(card);
        });
        document.querySelectorAll('.video-bg-particles').forEach(function(c) { for (let i = 0; i < 6; i++) { const p = document.createElement('div'); p.className = 'video-particle'; p.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*4}s;animation-duration:${Math.random()*3+3}s;width:${Math.random()*2+1}px;height:${Math.random()*2+1}px;`; c.appendChild(p); } });
        document.querySelectorAll('.video-thumbnail').forEach(function(thumb) {
            thumb.addEventListener('click', function() {
                const video = this.querySelector('.video-player');
                if (!video) return;
                if (video.paused || video.ended) { playVideoAndPauseMusic(video, this); }
                else {
                    video.pause(); video.style.display = 'none'; video.classList.remove('active'); cv = null;
                    const pw = this.querySelector('.video-play-icon-wrapper'), thHint = this.querySelector('.video-tap-hint');
                    const card = this.closest('.video-card'), gl = this.querySelector('.video-glow');
                    if (pw) pw.classList.remove('hidden'); if (thHint) thHint.classList.remove('hidden');
                    if (card) card.classList.remove('playing'); if (gl) gl.classList.remove('active');
                    resumeMusic();
                }
            });
        });
    }

    function buildGallery() {
        const grid = document.getElementById('galleryGrid');
        if (!grid) return;
        gd = SITE_CONFIG.gallery.items; grid.innerHTML = '';
        gd.forEach(function(item, i) {
            const div = document.createElement('div');
            div.className = 'gallery-item reveal';
            div.setAttribute('data-index', i);
            div.style.animationDelay = (i * 0.1) + 's';
            div.innerHTML = `<div class="gallery-image-wrapper"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%231a1415' width='400' height='400' rx='16'/%3E%3Ctext fill='%23a09484' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='16'%3E🤍%3C/text%3E%3C/svg%3E" data-src="${item.src}" alt="${item.caption}" loading="lazy" decoding="async" class="gallery-img-placeholder"><div class="gallery-shine"></div></div><div class="gallery-caption-container"><p class="gallery-caption">${item.caption}</p></div><div class="gallery-hover-glow"></div>`;
            div.addEventListener('click', function() { openLightbox(i); });
            grid.appendChild(div);
        });
    }

    function openLightbox(index) {
        if (!gd.length) return; cli = index;
        const lb = document.getElementById('lightbox'), img = document.getElementById('lightboxImage'), cap = document.getElementById('lightboxCaption');
        if (!lb || !img) return;
        const item = gd[index];
        img.style.opacity = '0'; img.src = item.src;
        img.onload = function() { img.style.opacity = '1'; };
        cap.textContent = item.caption;
        lb.classList.add('open'); document.body.style.overflow = 'hidden'; updateLbNav();
    }

    function updateLbImage() {
        const img = document.getElementById('lightboxImage'), cap = document.getElementById('lightboxCaption'), item = gd[cli];
        if (img && item) { img.style.opacity = '0'; img.src = item.src; img.onload = function() { img.style.opacity = '1'; }; }
        if (cap && item) cap.textContent = item.caption;
        updateLbNav();
    }

    function updateLbNav() {
        const pb = document.getElementById('lightboxPrev'), nb = document.getElementById('lightboxNext');
        if (pb) pb.style.opacity = cli > 0 ? '1' : '0.3';
        if (nb) nb.style.opacity = cli < gd.length - 1 ? '1' : '0.3';
    }

    function closeLb() { const lb = document.getElementById('lightbox'); if (lb) { lb.classList.remove('open'); document.body.style.overflow = ''; } }
    function nextLb() { if (cli < gd.length - 1) { cli++; updateLbImage(); } }
    function prevLb() { if (cli > 0) { cli--; updateLbImage(); } }

    function buildMessages() {
        const c = document.getElementById('messagesContainer'); if (!c) return;
        SITE_CONFIG.unsaidThings.messages.forEach(function(m, i) {
            const d = document.createElement('div');
            d.className = 'message-item reveal' + (i === 0 ? ' active current' : '');
            d.style.animationDelay = (i * 0.15) + 's';
            d.innerHTML = `<div class="message-number">${String(i + 1).padStart(2, '0')}</div><p class="message-text">${m}</p><div class="message-progress"><div class="message-dot${i === 0 ? ' filled' : ''}"></div></div>`;
            d.addEventListener('click', function() {
                document.querySelectorAll('.message-item').forEach(function(item, j) { item.classList.remove('active', 'current'); const dot = item.querySelector('.message-dot'); if (dot) dot.classList.remove('filled'); if (j <= i) { item.classList.add('active'); const d2 = item.querySelector('.message-dot'); if (d2) d2.classList.add('filled'); } });
                d.classList.add('current');
            });
            c.appendChild(d);
        });
    }

    function buildTimeline() {
        const c = document.getElementById('timelineContainer'); if (!c) return;
        SITE_CONFIG.timeline.items.forEach(function(item, i) {
            const d = document.createElement('div');
            d.className = 'timeline-item reveal'; d.style.animationDelay = (i * 0.2) + 's';
            d.innerHTML = `<div class="timeline-card"><div class="timeline-card-inner"><div class="timeline-icon"><span>${i + 1}</span></div><div class="timeline-card-content"><span class="timeline-date">${item.date}</span><h3 class="timeline-memory-title">${item.title}</h3><p class="timeline-description">${item.description}</p></div></div></div><div class="timeline-dot"></div>`;
            c.appendChild(d);
        });
    }

    function setupLetter() {
        const env = document.getElementById('envelope'), modal = document.getElementById('letterModal');
        if (!env) return;
        env.addEventListener('click', function() {
            if (!eo) { env.classList.add('open'); rebuildLetter(); setTimeout(function() { if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; } animateLetter(); }, 600); eo = true; }
            else { rebuildLetter(); if (modal) { modal.classList.add('open'); document.body.style.overflow = 'hidden'; } animateLetter(); }
        });
        if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) { modal.classList.remove('open'); document.body.style.overflow = ''; } });
    }

    function rebuildLetter() {
        const modal = document.getElementById('letterModal'); if (!modal) return;
        modal.innerHTML = `<div class="letter-romantic-container"><div class="letter-hearts-bg" id="letterHeartsBg"></div><div class="letter-particles-bg" id="letterParticlesBg"></div><div class="letter-romantic-card"><button class="letter-romantic-close" id="letterRomanticClose"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6L6 18M6 6l12 12"/></svg></button><div class="letter-crown"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><h2 class="letter-romantic-title">رسالة من القلب 🤍</h2><div class="letter-divider"><span class="letter-divider-line"></span><span class="letter-divider-icon">❀</span><span class="letter-divider-line"></span></div><div class="letter-romantic-content"><p class="letter-text-line">إيرينى...</p><p class="letter-text-line">أنا آسف بجد على أي لحظة زعلتك فيها.</p><p class="letter-text-line">مش هبرر اللي حصل، ومش هقول إن الظروف كانت السبب.</p><p class="letter-text-line">أنا بس عايز أقول إني ندمان...</p><p class="letter-text-line">إنتِ شخص مهم جدًا في حياتي، ومش عايز الزعل ياخدنا من بعض.</p><p class="letter-text-line">كل اللي بطلبه... فرصة واحدة.</p><p class="letter-text-line">أصلح فيها اللي فات، وأخلي الجاي أحسن.</p></div><div class="letter-divider"><span class="letter-divider-line"></span><span class="letter-divider-icon">🤍</span><span class="letter-divider-line"></span></div><p class="letter-romantic-signature">آسف يا إيرينى</p><p class="letter-romantic-signature-sub">— من قلب ندمان</p></div><div class="letter-corner-hearts"><span class="corner-heart corner-tl">🤍</span><span class="corner-heart corner-tr">🤍</span><span class="corner-heart corner-bl">🤍</span><span class="corner-heart corner-br">🤍</span></div></div>`;
        const cb = document.getElementById('letterRomanticClose');
        if (cb) cb.addEventListener('click', function() { const m = document.getElementById('letterModal'); if (m) { m.classList.remove('open'); document.body.style.overflow = ''; } });
        createHearts(); createParticles();
    }

    function animateLetter() {
        document.querySelectorAll('.letter-text-line').forEach(function(l, i) { l.style.opacity = '0'; l.style.transform = 'translateY(20px)'; setTimeout(function() { l.style.transition = 'all 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)'; l.style.opacity = '1'; l.style.transform = 'translateY(0)'; }, 300 + (i * 200)); });
    }

    function createHearts() {
        const c = document.getElementById('letterHeartsBg'); if (!c) return;
        const h = ['🤍','❤️','💕','💗','💖'];
        for (let i = 0; i < 12; i++) { const s = document.createElement('span'); s.className = 'flying-heart'; s.textContent = h[Math.floor(Math.random()*h.length)]; s.style.cssText = `position:absolute;left:${Math.random()*100}%;top:${Math.random()*100}%;font-size:${Math.random()*14+8}px;animation:heartFloat ${Math.random()*4+3}s ease-in-out infinite;animation-delay:${Math.random()*3}s;opacity:${Math.random()*0.3+0.1};pointer-events:none;`; c.appendChild(s); }
    }

    function createParticles() {
        const c = document.getElementById('letterParticlesBg'); if (!c) return;
        for (let i = 0; i < 10; i++) { const p = document.createElement('div'); p.className = 'golden-particle'; p.style.cssText = `position:absolute;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;background:#c9a96e;border-radius:50%;left:${Math.random()*100}%;top:${Math.random()*100}%;animation:particleGlow ${Math.random()*3+2}s ease-in-out infinite;animation-delay:${Math.random()*2}s;box-shadow:0 0 ${Math.random()*4+2}px rgba(201,169,110,0.6);pointer-events:none;`; c.appendChild(p); }
    }

    function setupSurpriseBox() {
        const gb = document.getElementById('giftBox'), sr = document.getElementById('surpriseReveal'), sm = document.getElementById('surpriseMessage'), fi = document.getElementById('floatingItems');
        if (!gb) return;
        gb.addEventListener('click', function() {
            if (!go) {
                gb.classList.add('open'); createSparkles(gb);
                setTimeout(function() { if (sr) sr.classList.add('active'); if (sm) sm.textContent = SITE_CONFIG.surpriseBox.message; if (fi) { fi.innerHTML = ''; SITE_CONFIG.surpriseBox.items.forEach(function(t, i) { const s = document.createElement('span'); s.className = 'floating-item'; s.textContent = t; s.style.animationDelay = (i*0.3)+'s'; fi.appendChild(s); }); } }, 700);
                go = true;
            }
        });
    }

    function createSparkles(el) {
        const r = el.getBoundingClientRect(), cx = r.left + r.width/2, cy = r.top + r.height/2;
        for (let i = 0; i < 8; i++) { const s = document.createElement('div'); s.className = 'sparkle'; s.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${Math.random()*4+2}px;height:${Math.random()*4+2}px;background:#c9a96e;border-radius:50%;pointer-events:none;z-index:9999;animation:sparkleFly ${Math.random()*1+0.5}s ease-out forwards;animation-delay:${Math.random()*0.3}s;`; document.body.appendChild(s); setTimeout(function() { s.remove(); }, 2000); }
    }

    function setupFinalButtons() {
        const yb = document.getElementById('yesButton'), nb = document.getElementById('noButton'), fr = document.getElementById('finalResponse'), rt = document.getElementById('responseText'), fb = document.getElementById('finalButtons'), frm = document.getElementById('finalReadMore');
        if (yb) yb.addEventListener('click', function() { if (fr) fr.classList.add('active'); if (rt) rt.textContent = SITE_CONFIG.finalPage.yesResponse; if (fb) fb.style.display = 'none'; if (frm) frm.style.display = 'none'; createConfetti(); });
        if (nb) nb.addEventListener('click', function() { if (fr) fr.classList.add('active'); if (rt) rt.textContent = SITE_CONFIG.finalPage.noResponse; if (fb) fb.style.display = 'none'; if (frm) { frm.style.display = 'inline-block'; frm.onclick = function() { const end = document.getElementById('ending'); if (end) end.scrollIntoView({ behavior: 'smooth' }); }; } });
    }

    function createConfetti() {
        const colors = ['#c9a96e','#c4808a','#6b1d2a','#e8e0d5'];
        const c = document.createElement('div'); c.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
        for (let i = 0; i < 30; i++) { const f = document.createElement('div'); const s = Math.random()*5+3; f.style.cssText = `position:absolute;width:${s}px;height:${s*(Math.random()*0.6+0.4)}px;background:${colors[Math.floor(Math.random()*colors.length)]};left:${Math.random()*100}%;top:-30px;border-radius:${Math.random()>0.5?'50%':'2px'};animation:confettiFall ${Math.random()*3+2.5}s ease-in forwards;animation-delay:${Math.random()*1.5}s;opacity:0.9;transform:rotate(${Math.random()*360}deg);`; c.appendChild(f); }
        document.body.appendChild(c); setTimeout(function() { c.remove(); }, 6000);
    }

    function setupMusicPlayer() {
        const bm = document.getElementById('bgMusic'), mtg = document.getElementById('musicToggle'), vtg = document.getElementById('volumeToggle'), vs = document.getElementById('volumeSlider'), vsc = document.getElementById('volumeSliderContainer');
        if (!bm || !mtg) return;
        mtg.addEventListener('click', function() { if (mp) { bm.pause(); mtg.classList.remove('playing'); mp = false; } else { pauseAllVideos(); bm.currentTime = mt; bm.play().then(function() { mtg.classList.add('playing'); mp = true; }).catch(function() {}); } });
        if (vtg) vtg.addEventListener('click', function() { bm.muted = !bm.muted; vtg.classList.toggle('muted'); if (vsc) vsc.classList.toggle('visible'); });
        if (vs) vs.addEventListener('input', function() { bm.volume = vs.value / 100; });
    }

    function setupLightboxEvents() {
        const lb = document.getElementById('lightbox'), cb = document.getElementById('lightboxClose'), pb = document.getElementById('lightboxPrev'), nb = document.getElementById('lightboxNext');
        if (cb) cb.addEventListener('click', closeLb);
        if (lb) lb.addEventListener('click', function(e) { if (e.target === lb) closeLb(); });
        if (pb) pb.addEventListener('click', prevLb); if (nb) nb.addEventListener('click', nextLb);
        document.addEventListener('keydown', function(e) { if (!lb || !lb.classList.contains('open')) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowRight') nextLb(); if (e.key === 'ArrowLeft') prevLb(); });
        let tsx = 0;
        if (lb) { lb.addEventListener('touchstart', function(e) { tsx = e.changedTouches[0].screenX; }); lb.addEventListener('touchend', function(e) { const d = tsx - e.changedTouches[0].screenX; if (Math.abs(d) > 50) { if (d > 0) nextLb(); else prevLb(); } }); }
    }

    function setupAllInteractions() { setupMusicPlayer(); setupStartButton(); setupLetter(); setupSurpriseBox(); setupFinalButtons(); setupLightboxEvents(); }

    function setupStartButton() { const btn = document.getElementById('startButton'); if (btn) btn.addEventListener('click', function() { const v = document.getElementById('videos'); if (v) v.scrollIntoView({ behavior: 'smooth' }); }); }

    function setupScrollAnimations() {
        const obs = new IntersectionObserver(function(entries) { entries.forEach(function(entry) { if (entry.isIntersecting) { entry.target.classList.add('visible'); } }); }, { threshold: 0.1 });
        document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });
    }

    function createHeroParticles() {
        const c = document.getElementById('heroParticles'); if (!c) return;
        for (let i = 0; i < 10; i++) { const p = document.createElement('div'); p.className = 'hero-particle'; const s = Math.random()*2+1; p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;top:${Math.random()*100}%;animation-delay:${Math.random()*10}s;animation-duration:${Math.random()*10+8}s;opacity:${Math.random()*0.3+0.1};`; c.appendChild(p); }
    }
})();
