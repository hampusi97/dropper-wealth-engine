/* TerraPaw Co. — standalone storefront: cart, tiers, subscribe, digital bump, milestones, Stripe checkout. */
(function () {
  "use strict";
  var S = window.__STORE__ || {};
  var KEY = "dropper-cart-" + S.storeId;
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { cart = []; }
  var fmt = function (n) { return "$" + (Math.round(n * 100) / 100).toFixed(2); };
  var find = function (sku) { return (S.products || []).find(function (p) { return p.sku === sku; }); };
  var q = function (s) { return document.querySelector(s); };
  var qa = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {}
    render();
  }
  function add(line) {
    var hit = cart.find(function (l) { return l.sku === line.sku && !!l.subscribe === !!line.subscribe; });
    if (hit) hit.qty += line.qty; else cart.push(line);
    save();
    openDrawer();
  }
  function remove(i) { cart.splice(i, 1); save(); }
  function subtotal() {
    return cart.reduce(function (a, l) {
      var p = find(l.sku) || (S.digital && l.sku === S.digital.sku ? S.digital : null);
      if (!p) return a;
      var unit = p.price;
      if (l.subscribe && S.subscription) unit = Math.round(S.subscription.price * 100) / 100;
      if (l.qty === 2 && p.tier2) unit = p.tier2 / 2;
      if (l.qty === 3 && p.tier3) unit = p.tier3 / 3;
      return a + unit * l.qty;
    }, 0);
  }
  function openDrawer() { var d = q("[data-drawer]"); if (d) { d.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; } }
  function closeDrawer() { var d = q("[data-drawer]"); if (d) { d.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; } }

  function render() {
    var sub = subtotal();
    var count = cart.reduce(function (a, l) { return a + l.qty; }, 0);
    qa("[data-cart-count]").forEach(function (n) { n.textContent = String(count); });
    var items = q("[data-items]");
    if (items) {
      items.innerHTML = cart.map(function (l, i) {
        var p = find(l.sku) || (S.digital && l.sku === S.digital.sku ? S.digital : null);
        var label = p ? p.title : l.sku;
        return '<div class="ci"><span>' + label + (l.subscribe ? " · club" : "") + ' × ' + l.qty +
          '</span><span>' + fmt((p ? p.price : 0) * l.qty) + '</span><button type="button" data-rm="' + i + '" aria-label="Remove">×</button></div>';
      }).join("");
      qa("[data-rm]").forEach(function (b) { b.addEventListener("click", function () { remove(Number(b.getAttribute("data-rm"))); }); });
    }
    qa("[data-subtotal]").forEach(function (n) { n.textContent = fmt(sub); });
    qa("[data-points]").forEach(function (n) { n.textContent = String(Math.floor(sub) * 10); });
    var ms = S.milestones || [];
    var next = null;
    qa(".progress__ms li").forEach(function (li) {
      var t = Number(li.getAttribute("data-threshold"));
      var done = sub >= t;
      li.classList.toggle("done", done);
      if (!done && !next) next = { threshold: t, reward: li.textContent.replace(/^\$\d+\s*/, "") };
    });
    var fill = q("[data-progress-fill]");
    var label = q("[data-progress-label]");
    if (fill) fill.style.width = (next ? Math.min(100, (sub / next.threshold) * 100) : 100).toFixed(1) + "%";
    if (label) label.textContent = next ? "Add " + fmt(next.threshold - sub) + " for " + next.reward : "All milestones unlocked — free gift added ✓";
  }

  qa("[data-cart-open]").forEach(function (b) { b.addEventListener("click", openDrawer); });
  qa("[data-cart-close]").forEach(function (b) { b.addEventListener("click", closeDrawer); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });

  qa("[data-buy]").forEach(function (b) {
    b.addEventListener("click", function () {
      add({ sku: b.getAttribute("data-buy"), qty: Number(b.getAttribute("data-qty") || 1), subscribe: b.getAttribute("data-subscribe") === "1" });
    });
  });
  qa("[data-open]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var handle = a.getAttribute("data-open");
      var p = (S.products || []).find(function (x) { return x.handle === handle; });
      if (p) add({ sku: p.sku, qty: 1, subscribe: false });
    });
  });
  var bump = q("[data-bump]");
  if (bump) bump.addEventListener("click", function () {
    if (S.digital) add({ sku: S.digital.sku, qty: 1, subscribe: false });
  });

  var checkout = q("[data-checkout]");
  if (checkout) checkout.addEventListener("click", function () {
    var note = q("[data-checkout-note]");
    if (!cart.length) { if (note) note.textContent = "Your cart is empty."; return; }
    var lines = cart.map(function (l) {
      var p = find(l.sku) || (S.digital ? S.digital : null);
      return (p ? p.title : l.sku) + " x" + l.qty + (l.subscribe ? " (club)" : "");
    });
    var link = (S.checkout || {})[cart[0].sku];
    if (link) { window.location.href = link; return; }
    // no Stripe Payment Link configured yet: fall back to an email order so nothing is silently lost
    var body = encodeURIComponent("Order for " + S.storeName + "\n\n" + lines.join("\n") + "\n\nSubtotal: " + fmt(subtotal()));
    if (note) note.innerHTML = 'Stripe checkout is not linked yet. <a href="mailto:orders@' + S.domain + '?subject=Order%20' + encodeURIComponent(S.storeName) + '&body=' + body + '">Send this order by email</a> and we will invoice you.';
  });

  qa("[data-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector("[data-form-note]");
      var data = Object.fromEntries(new FormData(form).entries());
      var kind = form.getAttribute("data-form");
      if (note) note.textContent = "Thanks — sending…";
      var endpoint = (S.forms || {})[kind];
      if (!endpoint) {
        // no backend configured: open the visitor's mail client with a pre-filled message
        var subject = kind === "b2b" ? "Bulk quote request — " + S.storeName : kind === "creator" ? "Creator application — " + S.storeName : "Club signup — " + S.storeName;
        var body = encodeURIComponent(Object.keys(data).map(function (k) { return k + ": " + data[k]; }).join("\n"));
        window.location.href = "mailto:" + (kind === "b2b" ? "wholesale" : "hello") + "@" + S.domain + "?subject=" + encodeURIComponent(subject) + "&body=" + body;
        if (note) note.textContent = "Opened your email app — send it and we reply within one business day.";
        return;
      }
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
        .then(function () { if (note) note.textContent = "Got it — we reply within one business day."; form.reset(); })
        .catch(function () { if (note) note.textContent = "Could not send — email us instead."; });
    });
  });

  var vaultBtn = q("[data-vault-toggle]");
  var vaultPanel = q("[data-vault-panel]");
  if (vaultBtn && vaultPanel) vaultBtn.addEventListener("click", function () {
    var open = vaultPanel.hasAttribute("hidden");
    if (open) vaultPanel.removeAttribute("hidden"); else vaultPanel.setAttribute("hidden", "");
    vaultBtn.setAttribute("aria-expanded", String(open));
  });

  var iso = q("[data-iso]");
  if (iso) {
    var layers = [].slice.call(iso.querySelectorAll(".layer"));
    var tick = false;
    window.addEventListener("scroll", function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        var p = Math.min(1, window.scrollY / (window.innerHeight || 800));
        iso.style.transform = "rotateX(" + (18 - p * 12) + "deg) rotateZ(" + (-22 + p * 12) + "deg)";
        layers.forEach(function (el, i) {
          el.style.transform = "translateZ(" + (i * 30 + p * (40 + i * 26)) + "px)";
        });
        tick = false;
      });
    }, { passive: true });
  }

  render();
})();
