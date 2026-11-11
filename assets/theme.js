/* SpineAlign Studio — storefront behaviour: cart drawer, 3-tier add-to-cart, subscribe, order bump, milestones, hero scroll. */
(function () {
  "use strict";
  var root = document.documentElement;
  var data = window.__DROPPER__ || {};
  var milestones = [{"threshold":55,"reward":"Free Shipping","value":0},{"threshold":95,"reward":"Extra 12% Off","value":12},{"threshold":140,"reward":"Free Heat & Ice Neck Wrap","value":27}];
  var digitalPrice = 11;
  var money = function (c) { return "$" + (c / 100).toFixed(2); };

  /* ---------------- cart drawer ---------------- */
  var drawer = document.querySelector("[data-cart-drawer]");
  function openCart() {
    if (!drawer) return;
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    refreshCart();
  }
  function closeCart() {
    if (!drawer) return;
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-cart-toggle]").forEach(function (b) {
    b.addEventListener("click", function (e) { e.preventDefault(); openCart(); });
  });
  document.querySelectorAll("[data-cart-close]").forEach(function (b) {
    b.addEventListener("click", closeCart);
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });

  function renderProgress(subtotal) {
    var fill = document.querySelector("[data-progress-fill]");
    var label = document.querySelector("[data-progress-label]");
    var items = document.querySelectorAll(".ms");
    var next = null;
    for (var i = 0; i < milestones.length; i++) {
      var done = subtotal >= milestones[i].threshold * 100;
      if (items[i]) items[i].classList.toggle("ms--done", done);
      if (!done && !next) next = milestones[i];
    }
    if (fill) {
      var pct = next ? Math.min(100, (subtotal / (next.threshold * 100)) * 100) : 100;
      fill.style.width = pct.toFixed(1) + "%";
    }
    if (label) {
      label.textContent = next
        ? "Add " + money(next.threshold * 100 - subtotal) + " for " + next.reward
        : "All three milestones unlocked — free gift added ✓";
    }
    var pts = document.querySelector("[data-vip-points]");
    if (pts) pts.textContent = String(Math.floor(subtotal / 100) * 10);
  }

  function renderItems(cart) {
    var wrap = document.querySelector("[data-cart-items]");
    if (!wrap) return;
    wrap.innerHTML = "";
    (cart.items || []).forEach(function (item) {
      var row = document.createElement("div");
      row.className = "ci";
      row.innerHTML =
        '<span><b>' + item.product_title + '</b><br><span class="ci__qty">' +
        (item.variant_title || "") + ' × ' + item.quantity + "</span></span><span>" +
        money(item.final_line_price) + "</span>";
      wrap.appendChild(row);
    });
  }

  function refreshCart() {
    fetch("/cart.js", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        renderItems(cart);
        renderProgress(cart.total_price || 0);
        var sub = document.querySelector("[data-cart-subtotal]");
        if (sub) sub.textContent = money(cart.total_price || 0);
        document.querySelectorAll("[data-cart-count]").forEach(function (c) { c.textContent = cart.item_count; });
        var bump = document.querySelector("[data-bump]");
        if (bump) {
          var hasDigital = (cart.items || []).some(function (i) {
            return i.product_type === "Digital" || /digital|printable|protocol|blueprint|guide|template/i.test(i.product_title);
          });
          var btn = bump.querySelector("[data-bump-add]");
          var done = bump.querySelector("[data-bump-done]");
          if (btn) btn.hidden = hasDigital;
          if (done) done.hidden = !hasDigital;
        }
      })
      .catch(function () {});
  }

  /* ---------------- add to cart ---------------- */
  function addItem(id, quantity, sellingPlan) {
    var body = { id: id, quantity: quantity };
    if (sellingPlan) body.selling_plan = sellingPlan;
    return fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (e) { throw new Error(e.description || "Cart error"); });
      return r.json();
    });
  }

  var pdpForm = document.querySelector("[data-pdp-form]");
  if (pdpForm) {
    pdpForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = document.querySelector("[data-pdp-status]");
      var fd = new FormData(pdpForm);
      var tier = parseInt(fd.get("tier") || "1", 10);
      var plan = fd.get("plan");
      var variantId = data.variantId || null;
      var planId = plan === "subscribe" ? data.sellingPlanId : null;
      if (!variantId) {
        if (status) status.textContent = "Pick a variant on this product to add it to the bag.";
        return;
      }
      if (status) status.textContent = "Adding…";
      addItem(variantId, tier, planId)
        .then(function () { if (status) status.textContent = "Added to your bag ✓"; openCart(); })
        .catch(function (err) { if (status) status.textContent = err.message; });
    });
  }

  var bumpBtn = document.querySelector("[data-bump-add]");
  if (bumpBtn) {
    bumpBtn.addEventListener("click", function () {
      var id = bumpBtn.getAttribute("data-bump-variant");
      if (!id) {
        bumpBtn.textContent = "Digital add-on not configured yet";
        return;
      }
      bumpBtn.disabled = true;
      addItem(id, 1)
        .then(function () { bumpBtn.disabled = false; refreshCart(); })
        .catch(function () { bumpBtn.disabled = false; });
    });
  }

  /* ---------------- loyalty vault ---------------- */
  var vaultToggle = document.querySelector("[data-vault-toggle]");
  var vaultPanel = document.querySelector("[data-vault-panel]");
  if (vaultToggle && vaultPanel) {
    vaultToggle.addEventListener("click", function () {
      var open = vaultPanel.hasAttribute("hidden");
      if (open) vaultPanel.removeAttribute("hidden"); else vaultPanel.setAttribute("hidden", "");
      vaultToggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* ---------------- hero scrollytelling ---------------- */
  var hero = document.querySelector("[data-hero]");
  var iso = document.querySelector("[data-isometric]");
  if (hero && iso) {
    var layers = Array.prototype.slice.call(iso.querySelectorAll(".layer"));
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var rect = hero.getBoundingClientRect();
        var total = rect.height + window.innerHeight;
        var p = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / total));
        // stage 1 (0-.33) hero float -> stage 2 (.33-.72) exploded anatomy -> stage 3 (.72-1) complete set
        var explode = p < 0.33 ? p / 0.33 * 0.35 : p < 0.72 ? 0.35 + ((p - 0.33) / 0.39) * 0.65 : 1;
        var assemble = p > 0.72 ? (p - 0.72) / 0.28 : 0;
        iso.style.transform =
          "rotateX(" + (18 - explode * 10 + assemble * 6) + "deg) rotateZ(" + (-24 + explode * 10 - assemble * 6) + "deg)";
        layers.forEach(function (el, i) {
          var base = parseFloat(el.style.getPropertyValue("--i")) || i;
          var spread = explode * (26 + base * 34);
          var collapse = assemble * (spread);
          el.style.transform = "translateZ(" + (base * 34 + spread - collapse).toFixed(1) + "px) translateY(" + (explode * -8 + assemble * 8).toFixed(1) + "px)";
          el.style.opacity = String(0.72 + explode * 0.28);
        });
        ticking = false;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------------- boot ---------------- */
  refreshCart();
})();
