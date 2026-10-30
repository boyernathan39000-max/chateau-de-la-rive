/* Château de la Rive : menu plein écran, en-tête, apparitions, vidéo, chiffres, frise, citations, visionneuse, formulaires */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var corps = document.body;
  var moins = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* En-tête : devient une barre sombre dès qu'on défile (le logo ne change jamais de taille) */
  var entete = $('.entete');
  var majEntete = function () { entete.classList.toggle('est-defile', window.scrollY > 40); };
  majEntete();
  window.addEventListener('scroll', majEntete, { passive: true });

  /* Menu plein écran avec sous-menus en accordéon ------------------------ */
  var burger = $('.burger');
  var menu = $('#menu-plein');
  var basculeMenu = function (ouvrir) {
    var ouvert = typeof ouvrir === 'boolean' ? ouvrir : !corps.classList.contains('menu-ouvert');
    corps.classList.toggle('menu-ouvert', ouvert);
    burger.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    burger.setAttribute('aria-label', ouvert ? 'Fermer le menu' : 'Ouvrir le menu');
    menu.setAttribute('aria-hidden', ouvert ? 'false' : 'true');
    if (ouvert) { var premier = $('a', menu); if (premier) setTimeout(function () { premier.focus({ preventScroll: true }); }, 320); }
  };
  burger.addEventListener('click', function () { basculeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && corps.classList.contains('menu-ouvert')) { basculeMenu(false); burger.focus(); } });
  $$('.menu-plein__bascule', menu).forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.closest('li');
      var ouvert = !li.classList.contains('est-ouvert');
      $$('.menu-plein__liste > li.est-ouvert', menu).forEach(function (autre) {
        if (autre !== li) { autre.classList.remove('est-ouvert'); $('.menu-plein__bascule', autre).setAttribute('aria-expanded', 'false'); }
      });
      li.classList.toggle('est-ouvert', ouvert);
      b.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    });
  });
  $$('.menu-plein__ligne', menu).forEach(function (l) {
    var b = $('.menu-plein__bascule', l), a = $('a', l);
    if (b && a) a.addEventListener('click', function (e) { e.preventDefault(); b.click(); });
  });
  $$('a', menu).forEach(function (a) {
    a.addEventListener('click', function () { var h = a.getAttribute('href') || ''; if (h.indexOf('#') !== -1 && h.split('#')[0] === (location.pathname.split('/').pop() || 'index.html')) basculeMenu(false); });
  });

  /* Apparitions au défilement (même mécanique que les Chabriers) -------- */
  var apparus = $$('.apparait, .porte');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { if (e.isIntersecting || e.boundingClientRect.top < 0) { e.target.classList.add('est-visible'); obs.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    apparus.forEach(function (el) { obs.observe(el); });
    /* Filet de sécurité : un élément déjà dépassé (défilement rapide, retour au même endroit après un rafraîchissement) ne déclenche pas l'observateur */
    var attente = false;
    var rattrape = function () {
      attente = false;
      apparus.forEach(function (el) {
        if (!el.classList.contains('est-visible') && el.getBoundingClientRect().top < window.innerHeight * 0.92) { el.classList.add('est-visible'); obs.unobserve(el); }
      });
    };
    var planifie = function () { if (!attente) { attente = true; window.requestAnimationFrame(rattrape); } };
    window.addEventListener('scroll', planifie, { passive: true });
    window.addEventListener('resize', planifie);
    window.addEventListener('load', planifie);
    window.addEventListener('pageshow', planifie);
  } else {
    apparus.forEach(function (el) { el.classList.add('est-visible'); });
  }

  /* Vidéo du héros -------------------------------------------------------- */
  var video = $('.heros__fond video');
  if (video) {
    if (moins) { video.pause(); video.removeAttribute('autoplay'); }
    else {
      var lance = function () { if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); } };
      lance();
      ['loadeddata', 'canplay', 'canplaythrough', 'pageshow'].forEach(function (n) { (n === 'pageshow' ? window : video).addEventListener(n, lance); });
      setTimeout(lance, 600); setTimeout(lance, 2000);
      document.addEventListener('visibilitychange', lance);
      ['scroll', 'click', 'touchstart', 'keydown'].forEach(function (e) { window.addEventListener(e, lance, { once: true, passive: true }); });
    }
  }

  /* Chiffres qui montent à l'apparition ------------------------------------ */
  var virgule = function (n, dec) { return n.toFixed(dec).replace('.', ','); };
  $$('[data-compte]').forEach(function (el) {
    var cible = parseFloat(el.getAttribute('data-compte')), dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    if (moins || !('IntersectionObserver' in window)) { el.textContent = virgule(cible, dec); return; }
    var o = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      o.disconnect();
      var debut = null;
      var pas = function (t) {
        if (debut === null) debut = t;
        var k = Math.min(1, (t - debut) / 1400);
        el.textContent = virgule(cible * (1 - Math.pow(1 - k, 3)), dec);
        if (k < 1) requestAnimationFrame(pas);
      };
      requestAnimationFrame(pas);
    }, { threshold: 0.6 });
    o.observe(el);
  });

  /* Frise : le trait se dessine et les jalons s'allument ------------------- */
  $$('.frise').forEach(function (frise) {
    var trait = document.createElement('span');
    trait.className = 'frise__trait';
    trait.setAttribute('aria-hidden', 'true');
    frise.appendChild(trait);
    var jalons = $$('li', frise);
    var maj = function () {
      var r = frise.getBoundingClientRect();
      var h = Math.min(r.height, Math.max(0, window.innerHeight * 0.72 - r.top));
      trait.style.height = h + 'px';
      jalons.forEach(function (li) { li.classList.toggle('est-allume', li.offsetTop + 10 <= h); });
    };
    maj();
    window.addEventListener('scroll', maj, { passive: true });
    window.addEventListener('resize', maj);
  });

  /* Citations : un avis à la fois ------------------------------------------ */
  $$('.citations').forEach(function (c) {
    var avis = $$('blockquote', c), points = $$('.citations__points button', c.parentNode), i = 0, minuterie;
    var va = function (n) {
      i = (n + avis.length) % avis.length;
      avis.forEach(function (a, k) { a.classList.toggle('est-actif', k === i); });
      points.forEach(function (p, k) { p.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    };
    var relance = function () { clearInterval(minuterie); if (!moins) minuterie = setInterval(function () { va(i + 1); }, 9000); };
    points.forEach(function (p, k) { p.addEventListener('click', function () { va(k); relance(); }); });
    va(0); relance();
  });

  /* Visite du domaine : l'image change selon la position dans la page ----- */
  $$('[data-visite]').forEach(function (v) {
    var imgs = $$('.visite__image', v), pts = $$('.visite__points span', v), leg = $('[data-visite-legende]', v), cur = -1;
    var maj = function () {
      var r = v.getBoundingClientRect(), total = v.offsetHeight - window.innerHeight;
      var p = Math.min(0.999, Math.max(0, -r.top / total)), i = Math.floor(p * imgs.length);
      if (i === cur) return;
      cur = i;
      imgs.forEach(function (im, k) { im.classList.toggle('est-actif', k === i); if (k === i) { im.loading = 'eager'; } });
      pts.forEach(function (d, k) { d.classList.toggle('est-actif', k === i); });
      if (leg) { leg.style.opacity = 0; setTimeout(function () { leg.textContent = imgs[i].getAttribute('data-legende'); leg.style.opacity = 1; }, 220); }
    };
    maj();
    window.addEventListener('scroll', maj, { passive: true });
    window.addEventListener('resize', maj);
  });

  /* Occasions : la photo suit le mot survolé ou touché ------------------- */
  $$('[data-occasions]').forEach(function (o) {
    var btns = $$('.occasions__liste button', o), fonds = $$('.occasions__fond', o);
    var choisit = function (i) { btns.forEach(function (b, k) { b.classList.toggle('est-actif', k === i); }); fonds.forEach(function (f, k) { f.classList.toggle('est-actif', k === i); }); };
    btns.forEach(function (b, i) { ['mouseenter', 'focus', 'click'].forEach(function (e) { b.addEventListener(e, function () { choisit(i); }); }); });
  });

  /* Colonnes de photos : chacune glisse à sa vitesse ------------------------ */
  $$('[data-colonnes]').forEach(function (c) {
    var cols = $$('.colonne', c);
    if (moins) return;
    var maj = function () {
      var r = c.getBoundingClientRect(), vh = window.innerHeight;
      var p = Math.max(-1, Math.min(1, ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2)));
      cols.forEach(function (col) { col.style.transform = 'translateY(' + (p * parseFloat(col.getAttribute('data-vitesse'))).toFixed(1) + 'px)'; });
    };
    maj();
    window.addEventListener('scroll', maj, { passive: true });
    window.addEventListener('resize', maj);
  });

  /* Éventail : la carte au centre grandit, les autres reculent ; l'en-tête suit ----- */
  $$('[data-coverflow]').forEach(function (c) {
    var piste = $('.coverflow__piste', c), cartes = $$('.coverflow__carte', c), parent = c.closest('[data-salles]');
    var tete = parent ? { num: $('[data-salle-num]', parent), nom: $('[data-salle-nom]', parent), sous: $('[data-salle-sous]', parent) } : null;
    var actif = -1;
    var maj = function () {
      var r = piste.getBoundingClientRect(), centre = r.left + r.width / 2, meilleur = 0, dmin = 1e9;
      cartes.forEach(function (k, i) {
        var b = k.getBoundingClientRect(), dist = Math.abs((b.left + b.width / 2) - centre), d = Math.min(1, dist / (b.width * 0.9));
        k.style.setProperty('--s', (1 - d * 0.16).toFixed(3)); k.style.setProperty('--o', (1 - d * 0.55).toFixed(3)); k.style.setProperty('--sat', (1 - d * 0.5).toFixed(3));
        if (dist < dmin) { dmin = dist; meilleur = i; }
      });
      if (cible < 0) entete(meilleur);
    };
    var cible = -1;
    var entete = function (i) {
      if (!tete || i === actif) return;
      actif = i;
      var k = cartes[i];
      tete.num.textContent = k.getAttribute('data-num'); tete.nom.textContent = k.getAttribute('data-nom'); tete.sous.textContent = k.getAttribute('data-sous');
    };
    var centre = function (k) {
      var b = k.getBoundingClientRect(), r = piste.getBoundingClientRect();
      return piste.scrollLeft + (b.left + b.width / 2) - (r.left + r.width / 2);
    };
    var va = function (sens) {
      var n = cartes.length, courant = cible >= 0 ? cible : (function () { var m = 0, dmin = 1e9; cartes.forEach(function (k, i) { var d = Math.abs(centre(k) - piste.scrollLeft); if (d < dmin) { dmin = d; m = i; } }); return m; })();
      var suivant = (courant + sens + n) % n;
      cible = suivant;
      entete(suivant);
      piste.scrollTo({ left: Math.max(0, centre(cartes[suivant])), behavior: 'smooth' });
      clearTimeout(va.t); va.t = setTimeout(function () { cible = -1; }, 1300);
    };
    $('.carrousel__fleche--prec', c).addEventListener('click', function (e) { e.stopPropagation(); va(-1); });
    $('.carrousel__fleche--suiv', c).addEventListener('click', function (e) { e.stopPropagation(); va(1); });
    piste.addEventListener('scroll', maj, { passive: true });
    window.addEventListener('resize', maj);
    piste.scrollLeft = 0; maj();
  });

  /* Formulaire de contact : les champs suivent le type d'événement --------- */
  $$('select[name="sujet"]').forEach(function (sel) {
    var blocs = $$('[data-pour]', sel.form);
    var maj = function () { blocs.forEach(function (b) { b.hidden = b.getAttribute('data-pour').split(',').indexOf(sel.value) === -1; }); };
    sel.addEventListener('change', maj); maj();
  });

  /* Carrousels des chambres ------------------------------------------------- */
  $$('[data-carrousel]').forEach(function (c) {
    var piste = $('.carrousel__piste', c), pts = $$('.carrousel__points button', c);
    var largeur = function () { return piste.clientWidth; };
    var va = function (n) { var max = pts.length - 1; piste.scrollTo({ left: Math.max(0, Math.min(max, n)) * largeur(), behavior: 'smooth' }); };
    var courant = function () { return Math.round(piste.scrollLeft / largeur()); };
    $('.carrousel__fleche--prec', c).addEventListener('click', function (e) { e.stopPropagation(); va(courant() === 0 ? pts.length - 1 : courant() - 1); });
    $('.carrousel__fleche--suiv', c).addEventListener('click', function (e) { e.stopPropagation(); va(courant() === pts.length - 1 ? 0 : courant() + 1); });
    pts.forEach(function (b, i) { b.addEventListener('click', function (e) { e.stopPropagation(); va(i); }); });
    piste.addEventListener('scroll', function () { var k = courant(); pts.forEach(function (b, i) { b.setAttribute('aria-pressed', i === k ? 'true' : 'false'); }); }, { passive: true });
  });

  /* Galerie : visionneuse -------------------------------------------------- */
  var vis = $('.visionneuse');
  if (vis) {
    var liste = [], idx = 0;
    var montre = function () { var s = liste[idx]; $('img', vis).src = s.src; $('img', vis).alt = s.alt; };
    var ouvre = function (sources, i) { liste = sources; idx = i; montre(); if (vis.showModal) vis.showModal(); else vis.setAttribute('open', ''); };
    $$('[data-zoom]').forEach(function (conteneur) {
      $$('figure', conteneur).forEach(function (fig) {
        fig.addEventListener('click', function () {
          var toutes = $$('figure', conteneur).filter(function (f) { return !f.closest('[aria-hidden="true"]'); }).map(function (f) { return $('img', f); });
          ouvre(toutes, Math.max(0, toutes.indexOf($('img', fig))));
        });
      });
    });
    $('.v-fermer', vis).addEventListener('click', function () { vis.close(); });
    $('.v-prec', vis).addEventListener('click', function () { idx = (idx - 1 + liste.length) % liste.length; montre(); });
    $('.v-suiv', vis).addEventListener('click', function () { idx = (idx + 1) % liste.length; montre(); });
    vis.addEventListener('click', function (e) { if (e.target === vis) vis.close(); });
    document.addEventListener('keydown', function (e) {
      if (!vis.open) return;
      if (e.key === 'ArrowLeft') $('.v-prec', vis).click();
      if (e.key === 'ArrowRight') $('.v-suiv', vis).click();
    });
  }

  /* Formulaires de la maquette : contrôle puis message de confirmation --- */
  $$('form[data-maquette]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.checkValidity()) { f.reportValidity(); return; }
      var merci = f.parentNode.querySelector('.merci');
      if (merci) { merci.classList.add('est-visible'); merci.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      f.reset();
    });
  });
})();
