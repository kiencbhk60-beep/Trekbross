const SHOP_PRODUCT_MAP = {
  sandstone: "K-01",
  suncrest: "K-03",
  ridgeline: "K-04",
  aurora: "K-05",
  ember: "K-06",
  bluehour: "K-07",
  nightfall: "K-09",
  granite: "K-10",
  wildtrail: "K-11"
};

const products = {
  ridgeline: { code: SHOP_PRODUCT_MAP.ridgeline, name: "RIDGELINE", image: "assets/ridgeline.webp", description: "Gọng bạc · Tròng xanh lam–lục", subtitle: "Theo đường sống núi, mở lối riêng.", category: "trekking" },
  nightfall: { code: SHOP_PRODUCT_MAP.nightfall, name: "NIGHTFALL", image: "assets/nightfall.webp", description: "Gọng đen · Tròng tối", subtitle: "Sắc đen trầm, tinh thần đường mòn.", category: "trekking" },
  aurora: { code: SHOP_PRODUCT_MAP.aurora, name: "AURORA", image: "assets/aurora.webp", description: "Gọng bạc · Tròng chuyển sắc lục–tím", subtitle: "Một sắc trời khác trên mỗi cung đường.", category: "mountain" },
  suncrest: { code: SHOP_PRODUCT_MAP.suncrest, name: "SUNCREST", image: "assets/suncrest.webp", description: "Gọng xám · Tròng vàng–cam", subtitle: "Mang sắc nắng lên từng con dốc.", category: "mountain" },
  ember: { code: SHOP_PRODUCT_MAP.ember, name: "EMBER", image: "assets/ember.webp", description: "Gọng đen · Tròng cam–đỏ", subtitle: "Giữ lửa cho từng bước chạy.", category: "running" },
  sandstone: { code: SHOP_PRODUCT_MAP.sandstone, name: "SANDSTONE", image: "assets/sandstone.webp", description: "Gọng màu cát · Tròng chuyển sắc", subtitle: "Sắc đất ấm, bước chân đi xa.", category: "trekking" },
  bluehour: { code: SHOP_PRODUCT_MAP.bluehour, name: "BLUEHOUR", image: "assets/bluehour.webp", description: "Gọng đen · Tròng xanh dương", subtitle: "Bắt nhịp chạy, đón khoảng trời xanh.", category: "running" }
};

const API_BASE = (typeof window !== "undefined" && window.TREKBROSS_API_BASE) || "https://sobankinh.trekbross.workers.dev";
const vndFormatter = new Intl.NumberFormat("vi-VN");
const formatVnd = (amount) => vndFormatter.format(amount) + " ₫";
const $ = (s) => document.querySelector(s);

let catalogByCode = new Map();
let catalogReady = false;
let catalogError = false;
let activeDialogKey = null;
let currentOrderKey = "";
let submittingOrder = false;

function makeIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "tb-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}

function getCatalogEntry(key) {
  const p = products[key];
  if (!p || !p.code || !catalogReady) return null;
  return catalogByCode.get(p.code) || null;
}

function getProductStatus(key) {
  const p = products[key];
  if (!p || !p.code) {
    return { validPrice: false, price: null, inStock: false, availableQty: 0, orderable: false, priceText: "Liên hệ để biết giá", buttonText: "Liên hệ để biết giá" };
  }
  if (!catalogReady) {
    if (catalogError) {
      return { validPrice: false, price: null, inStock: false, availableQty: 0, orderable: false, priceText: "Liên hệ để biết giá", buttonText: "Tạm ngưng đặt hàng" };
    }
    return { validPrice: false, price: null, inStock: false, availableQty: 0, orderable: false, priceText: "Đang tải giá…", buttonText: "Đang tải…" };
  }
  const entry = catalogByCode.get(p.code);
  if (!entry) {
    return { validPrice: false, price: null, inStock: false, availableQty: 0, orderable: false, priceText: "Liên hệ để biết giá", buttonText: "Liên hệ để biết giá" };
  }
  const validPrice = typeof entry.price === "number" && Number.isFinite(entry.price) && entry.price > 0;
  const availableQty = Math.max(0, Math.floor(Number(entry.availableQty) || 0));
  const inStock = Boolean(entry.inStock) && availableQty > 0;
  const orderable = validPrice && inStock;

  let priceText = validPrice ? formatVnd(entry.price) : "Liên hệ để biết giá";
  if (!inStock) {
    priceText = validPrice ? `${formatVnd(entry.price)} · Hết hàng` : "Hết hàng";
  }

  let buttonText = "Thêm vào túi kính +";
  if (!inStock) buttonText = "Hết hàng";
  else if (!validPrice) buttonText = "Liên hệ để biết giá";

  return {
    validPrice,
    price: validPrice ? entry.price : null,
    inStock,
    availableQty,
    orderable,
    priceText,
    buttonText
  };
}

let bag = [];
try {
  const saved = JSON.parse(localStorage.getItem("trekbross-bag") || localStorage.getItem("pace-bag") || "[]");
  if (Array.isArray(saved)) {
    for (const value of saved) {
      const key = typeof value === "string" ? value : value?.key;
      if (!Object.hasOwn(products, key)) continue;
      const quantity = typeof value === "string" ? 1 : Math.max(1, Math.min(99, Math.floor(Number(value.quantity) || 1)));
      const existing = bag.find((item) => item.key === key);
      if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
      else bag.push({ key, quantity });
    }
  }
} catch {}

let toastTimer, orderItems = [];

function notify(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
}

function updateCatalogDOM() {
  document.querySelectorAll("[data-price]").forEach((node) => {
    const key = node.dataset.price;
    const status = getProductStatus(key);
    node.textContent = status.priceText;
    node.classList.toggle("is-out", catalogReady && !status.inStock);
  });

  document.querySelectorAll("[data-add]").forEach((btn) => {
    const key = btn.dataset.add;
    const status = getProductStatus(key);
    btn.disabled = !status.orderable;
    if (btn.classList.contains("button")) {
      btn.innerHTML = status.orderable
        ? "Thêm vào túi kính <span>+</span>"
        : `${status.buttonText}`;
    } else {
      btn.textContent = status.buttonText;
    }
  });

  if (activeDialogKey && $("#product-dialog")?.open) {
    renderProductDialog(activeDialogKey);
  }
  renderBag();
}

function renderProductDialog(key) {
  const p = products[key];
  if (!p) return;
  activeDialogKey = key;
  const status = getProductStatus(key);
  $("#dialog-image").src = p.image;
  $("#dialog-image").alt = p.description;
  $("#dialog-name").textContent = p.name;
  $("#dialog-description").textContent = p.description;
  $("#dialog-subtitle").textContent = p.subtitle;
  const priceNode = $("#dialog-price");
  if (priceNode) {
    if (!catalogReady) {
      priceNode.textContent = status.priceText;
    } else if (!status.inStock) {
      priceNode.textContent = status.validPrice ? `Giá bán: ${formatVnd(status.price)} · Tình trạng: Hết hàng` : "Tình trạng: Hết hàng";
    } else if (!status.validPrice) {
      priceNode.textContent = "Giá bán: Liên hệ để biết giá";
    } else {
      priceNode.textContent = `Giá bán: ${formatVnd(status.price)} · Còn hàng (${status.availableQty} chiếc)`;
    }
  }
  const addBtn = $("#dialog-add");
  if (addBtn) {
    addBtn.disabled = !status.orderable;
    addBtn.innerHTML = status.orderable ? "Thêm vào túi kính <span>+</span>" : status.buttonText;
    addBtn.onclick = () => add(key);
  }
}

async function loadCatalog() {
  try {
    const response = await fetch(`${API_BASE}/api/catalog`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) throw new Error("Catalog request failed");
    const data = await response.json();
    if (!data || !Array.isArray(data.items)) throw new Error("Invalid catalog response");
    const nextMap = new Map();
    for (const item of data.items) {
      if (item && typeof item.code === "string") {
        nextMap.set(item.code.toUpperCase(), item);
      }
    }
    catalogByCode = nextMap;
    catalogReady = true;
    catalogError = false;
  } catch {
    if (!catalogReady) {
      catalogError = true;
    }
  }
  updateCatalogDOM();
}

function save() {
  try {
    localStorage.setItem("trekbross-bag", JSON.stringify(bag));
  } catch {}
  $("#count").textContent = bag.reduce((n, item) => n + item.quantity, 0);
  renderBag();
}

function add(key) {
  if (!Object.hasOwn(products, key)) return;
  const status = getProductStatus(key);
  if (!status.orderable) {
    notify(!status.inStock && catalogReady ? `${products[key].name} hiện đã hết hàng.` : `${products[key].name}: ${status.priceText}.`);
    return;
  }
  const maxAllowed = Math.min(99, status.availableQty);
  const item = bag.find((entry) => entry.key === key);
  if (item && item.quantity >= maxAllowed) {
    notify(`Mẫu ${products[key].name} hiện chỉ còn tối đa ${maxAllowed} chiếc.`);
    return;
  }
  if (item) item.quantity++;
  else bag.push({ key, quantity: 1 });
  currentOrderKey = "";
  save();
  notify("Đã thêm " + products[key].name + " vào túi kính.");
}

function setQuantity(key, value) {
  const item = bag.find((entry) => entry.key === key);
  if (!item) return;
  const status = getProductStatus(key);
  const maxAllowed = status.orderable ? Math.min(99, status.availableQty) : 99;
  const requested = Math.max(1, Math.min(99, Math.floor(Number(value) || 1)));
  if (status.orderable && requested > maxAllowed) {
    notify(`Mẫu ${products[key].name} chỉ còn ${maxAllowed} chiếc.`);
  }
  item.quantity = Math.max(1, Math.min(maxAllowed, requested));
  currentOrderKey = "";
  save();
}

function validateBagForCheckout() {
  if (!bag.length) return { ok: false, reason: "Túi kính đang trống." };
  if (!catalogReady) {
    return {
      ok: false,
      reason: catalogError
        ? "Chưa kết nối được hệ thống giá. Vui lòng thử lại sau."
        : "Đang đồng bộ giá bán, vui lòng đợi giây lát."
    };
  }
  let totalAmount = 0;
  for (const item of bag) {
    const p = products[item.key];
    const status = getProductStatus(item.key);
    if (!status.inStock) {
      return { ok: false, reason: `Mẫu ${p.name} hiện đã hết hàng. Vui lòng bỏ khỏi túi kính.` };
    }
    if (!status.validPrice) {
      return { ok: false, reason: `Mẫu ${p.name} chưa có giá bán hợp lệ (Liên hệ để biết giá).` };
    }
    if (item.quantity > status.availableQty) {
      return { ok: false, reason: `Mẫu ${p.name} chỉ còn ${status.availableQty} chiếc. Vui lòng giảm số lượng.` };
    }
    totalAmount += status.price * item.quantity;
  }
  return { ok: true, totalAmount };
}

function renderBag() {
  const node = $("#bag-items");
  if (!node) return;
  node.replaceChildren();
  const summaryNode = $("#bag-summary");
  const totalNode = $("#bag-total");
  const noteNode = $("#bag-note");
  const checkoutBtn = $("#bag-checkout");

  if (!bag.length) {
    if (summaryNode) summaryNode.hidden = true;
    if (checkoutBtn) checkoutBtn.disabled = true;
    if (noteNode) noteNode.textContent = "Điều chỉnh số lượng rồi nhấn Đặt hàng để gửi thông tin nhận hàng.";
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "Túi kính đang trống. Thêm mẫu bạn thích để bắt đầu đặt hàng.";
    node.append(p);
    return;
  }

  let runningTotal = 0;
  let allValidPrice = true;

  bag.forEach((item) => {
    const p = products[item.key];
    const status = getProductStatus(item.key);
    const row = document.createElement("div");
    row.className = "bag-row";

    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.name;

    const info = document.createElement("div");
    const name = document.createElement("strong");
    const price = document.createElement("p");
    name.textContent = p.name;
    price.className = "bag-price";

    if (!catalogReady) {
      price.textContent = status.priceText;
      allValidPrice = false;
    } else if (!status.inStock) {
      price.textContent = "Hết hàng — vui lòng bỏ mẫu này khỏi túi";
      price.classList.add("is-out");
      allValidPrice = false;
    } else if (!status.validPrice) {
      price.textContent = "Liên hệ để biết giá — chưa mở đặt trực tuyến";
      price.classList.add("is-out");
      allValidPrice = false;
    } else {
      const subTotal = status.price * item.quantity;
      runningTotal += subTotal;
      price.textContent = `${formatVnd(status.price)} × ${item.quantity} = ${formatVnd(subTotal)}`;
      if (item.quantity > status.availableQty) {
        price.textContent += ` (Chỉ còn ${status.availableQty} chiếc)`;
        price.classList.add("is-out");
      }
    }

    const controls = document.createElement("div");
    controls.className = "bag-quantity";
    const down = document.createElement("button");
    const input = document.createElement("input");
    const up = document.createElement("button");
    const maxQty = status.orderable ? Math.min(99, status.availableQty) : 99;

    down.textContent = "−";
    down.setAttribute("aria-label", "Giảm số lượng " + p.name);
    down.disabled = item.quantity === 1;
    down.onclick = () => setQuantity(item.key, item.quantity - 1);

    input.type = "number";
    input.min = "1";
    input.max = String(maxQty);
    input.value = item.quantity;
    input.inputMode = "numeric";
    input.setAttribute("aria-label", "Số lượng " + p.name);
    input.onchange = () => setQuantity(item.key, input.value);

    up.textContent = "+";
    up.setAttribute("aria-label", "Tăng số lượng " + p.name);
    up.disabled = !status.orderable || item.quantity >= maxQty;
    up.onclick = () => setQuantity(item.key, item.quantity + 1);

    controls.append(down, input, up);
    info.append(name, price, controls);

    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.setAttribute("aria-label", "Bỏ " + p.name + " khỏi túi");
    remove.onclick = () => {
      bag = bag.filter((x) => x.key !== item.key);
      currentOrderKey = "";
      save();
    };

    row.append(img, info, remove);
    node.append(row);
  });

  const check = validateBagForCheckout();
  if (summaryNode && totalNode) {
    summaryNode.hidden = false;
    totalNode.textContent = allValidPrice && runningTotal > 0 ? formatVnd(runningTotal) : "Liên hệ để biết giá";
  }
  if (noteNode) {
    noteNode.textContent = check.ok ? "Điều chỉnh số lượng rồi nhấn Đặt hàng để gửi thông tin nhận hàng." : check.reason;
  }
  if (checkoutBtn) {
    checkoutBtn.disabled = !check.ok;
  }
}

document.querySelectorAll("[data-filter]").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll("[data-filter]").forEach((x) => {
      x.classList.toggle("active", x === b);
      x.setAttribute("aria-pressed", x === b ? "true" : "false");
    });
    document.querySelectorAll(".product").forEach((p) => {
      p.hidden = b.dataset.filter !== "all" && p.dataset.category !== b.dataset.filter;
    });
  };
});

document.querySelectorAll("[data-add]").forEach((b) => {
  b.onclick = () => add(b.dataset.add);
});

document.querySelectorAll("[data-open]").forEach((b) => {
  b.onclick = () => {
    renderProductDialog(b.dataset.open);
    $("#product-dialog").showModal();
  };
});

$("#bag-toggle").onclick = () => {
  loadCatalog();
  renderBag();
  $("#bag-dialog").showModal();
};

document.querySelectorAll("[data-close]").forEach((b) => {
  b.onclick = () => {
    if (submittingOrder) return;
    b.closest("dialog").close();
  };
});

document.querySelectorAll("dialog").forEach((d) => {
  d.addEventListener("click", (e) => {
    if (submittingOrder) return;
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    }
  });
});

$("#menu-toggle").onclick = () => {
  const open = $("#menu-toggle").getAttribute("aria-expanded") !== "true";
  $("#menu-toggle").setAttribute("aria-expanded", String(open));
  $("#mobile-nav").hidden = !open;
};

document.querySelectorAll("#mobile-nav a").forEach((a) => {
  a.onclick = () => {
    $("#mobile-nav").hidden = true;
    $("#menu-toggle").setAttribute("aria-expanded", "false");
  };
});

const orderDialog = $("#order-dialog");
const orderForm = $("#order-form");

function orderError(field, message) {
  const input = $("#order-" + field);
  const error = $("#" + field + "-error");
  if (!input || !error) return;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  error.textContent = message;
  error.hidden = !message;
}

function setSubmitError(message) {
  const node = $("#order-submit-error");
  if (!node) return;
  node.textContent = message || "";
  node.hidden = !message;
}

function setSubmittingState(busy) {
  submittingOrder = busy;
  const submitBtn = $("#order-submit-btn");
  const backBtn = $("#order-back");
  if (submitBtn) {
    submitBtn.disabled = busy;
    submitBtn.textContent = busy ? "ĐANG GỬI ĐƠN HÀNG…" : "XÁC NHẬN ĐẶT HÀNG";
  }
  if (backBtn) {
    backBtn.disabled = busy;
  }
}

function openOrder() {
  const check = validateBagForCheckout();
  if (!check.ok) {
    notify(check.reason);
    renderBag();
    return;
  }
  orderItems = bag.map((item) => ({ ...item }));
  if (!currentOrderKey) {
    currentOrderKey = makeIdempotencyKey();
  }
  orderForm.reset();
  ["fullname", "phone", "address"].forEach((field) => orderError(field, ""));
  setSubmitError("");
  setSubmittingState(false);
  $("#order-review").hidden = true;
  $("#order-back").hidden = false;
  orderForm.hidden = false;
  $("#review-details").replaceChildren();

  const list = $("#order-products");
  list.replaceChildren();
  let orderTotal = 0;

  orderItems.forEach((item) => {
    const p = products[item.key];
    const status = getProductStatus(item.key);
    const unitPrice = status.price || 0;
    const lineTotal = unitPrice * item.quantity;
    orderTotal += lineTotal;

    const row = document.createElement("div");
    row.className = "order-product";
    const img = document.createElement("img");
    img.src = p.image;
    img.alt = p.description;

    const info = document.createElement("div");
    const name = document.createElement("h3");
    const description = document.createElement("p");
    const price = document.createElement("strong");
    const quantity = document.createElement("p");

    name.textContent = `${p.name} (${p.code})`;
    description.textContent = `Đơn giá: ${formatVnd(unitPrice)}`;
    price.textContent = `Thành tiền: ${formatVnd(lineTotal)}`;
    quantity.className = "order-item-quantity";
    quantity.textContent = "Số lượng: " + item.quantity;

    info.append(name, description, price, quantity);
    row.append(img, info);
    list.append(row);
  });

  const totalAmountNode = $("#order-total-amount");
  if (totalAmountNode) {
    totalAmountNode.textContent = formatVnd(orderTotal);
  }

  $("#bag-dialog").close();
  orderDialog.showModal();
}

$("#bag-checkout").onclick = openOrder;
$("#order-back").onclick = () => {
  if (submittingOrder) return;
  orderDialog.close();
  renderBag();
  $("#bag-dialog").showModal();
};

["fullname", "phone", "address"].forEach((field) => {
  $("#order-" + field).addEventListener("input", () => {
    orderError(field, "");
    setSubmitError("");
  });
});

orderForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (submittingOrder || !orderItems.length) return;

  const check = validateBagForCheckout();
  if (!check.ok) {
    setSubmitError(check.reason);
    notify(check.reason);
    return;
  }

  const values = {
    fullname: $("#order-fullname").value.trim(),
    phone: $("#order-phone").value.trim(),
    address: $("#order-address").value.trim(),
    notes: $("#order-notes").value.trim(),
    website: ($("#order-website")?.value || "").trim()
  };

  const errors = {
    fullname: values.fullname.length < 2 ? "Vui lòng nhập họ và tên (ít nhất 2 ký tự)." : "",
    phone: /^(?:0[0-9]{9}|\+84[0-9]{9}|84[0-9]{9})$/.test(values.phone.replace(/[\s.()-]/g, ""))
      ? ""
      : "Vui lòng nhập số điện thoại Việt Nam hợp lệ.",
    address: values.address.length < 10 ? "Vui lòng nhập địa chỉ nhận hàng chi tiết (ít nhất 10 ký tự)." : ""
  };

  Object.entries(errors).forEach(([field, message]) => orderError(field, message));
  const first = Object.keys(errors).find((field) => errors[field]);
  if (first) {
    $("#order-" + first).focus();
    return;
  }

  if (!currentOrderKey) {
    currentOrderKey = makeIdempotencyKey();
  }

  setSubmitError("");
  setSubmittingState(true);

  try {
    const response = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Idempotency-Key": currentOrderKey
      },
      body: JSON.stringify({
        idempotencyKey: currentOrderKey,
        customer: values.fullname,
        phone: values.phone,
        address: values.address,
        note: values.notes,
        website: values.website,
        items: orderItems.map((item) => ({
          shopKey: item.key,
          code: products[item.key].code,
          qty: item.quantity
        }))
      })
    });

    let data = null;
    try {
      data = await response.json();
    } catch {}

    if (!response.ok || !data || !data.ok || !data.order) {
      const errMsg = data?.error || "Không thể gửi đơn hàng lúc này. Vui lòng kiểm tra lại và thử lại.";
      setSubmitError(errMsg);
      notify(errMsg);
      setSubmittingState(false);
      await loadCatalog();
      return;
    }

    const confirmedOrder = data.order;
    const totalUnits = Array.isArray(confirmedOrder.lines)
      ? confirmedOrder.lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0)
      : orderItems.reduce((sum, item) => sum + item.quantity, 0);

    const productSummary = Array.isArray(confirmedOrder.lines)
      ? confirmedOrder.lines
          .map((l) => {
            const shopTitle = l.shopKey && products[l.shopKey] ? products[l.shopKey].name : l.name;
            return `${shopTitle} (${l.code}) × ${l.qty} — ${formatVnd(l.price)} = ${formatVnd(l.lineTotal)}`;
          })
          .join("\n")
      : orderItems.map((item) => `${products[item.key].name} × ${item.quantity}`).join("\n");

    const rows = [
      ["Mã đơn hàng", confirmedOrder.number || confirmedOrder.id],
      ["Trạng thái", confirmedOrder.status || "Chờ xác nhận"],
      ["Sản phẩm", productSummary],
      ["Tổng số lượng", String(totalUnits)],
      ["Tổng tiền", formatVnd(Number(confirmedOrder.total) || 0)],
      ["Người nhận", confirmedOrder.customer || values.fullname],
      ["Điện thoại", confirmedOrder.phone || values.phone],
      ["Địa chỉ", confirmedOrder.address || values.address],
      ["Ghi chú", confirmedOrder.note || values.notes || "Không có"],
      ["Thanh toán", "COD — thanh toán khi nhận hàng"]
    ];

    $("#review-details").replaceChildren();
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      $("#review-details").append(row);
    });

    // Clear bag ONLY after server confirms order creation
    bag = [];
    orderItems = [];
    currentOrderKey = "";
    save();
    setSubmittingState(false);

    orderForm.hidden = true;
    $("#order-back").hidden = true;
    $("#order-review").hidden = false;
    $("#order-review").focus();
    notify(`Đặt hàng thành công! Mã đơn: ${confirmedOrder.number}`);
    await loadCatalog();
  } catch {
    const errMsg = "Không kết nối được máy chủ đặt hàng. Giỏ hàng của bạn vẫn được giữ nguyên, vui lòng thử lại.";
    setSubmitError(errMsg);
    notify(errMsg);
    setSubmittingState(false);
  }
});

orderDialog.addEventListener("close", () => {
  if (submittingOrder) return;
  orderForm.reset();
  setSubmitError("");
  $("#review-details").replaceChildren();
  $("#order-review").hidden = true;
  $("#order-back").hidden = false;
  orderForm.hidden = false;
  orderItems = [];
});

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) loadCatalog();
  });
}

save();
loadCatalog();
