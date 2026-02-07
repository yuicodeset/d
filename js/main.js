// main.js (ES module)
// - Инициализация темы (localStorage только для темы)
// - i18n: динамическая подмена текстов из locales/*.json
// - Логика интерактивной схемы (tooltip)

import { initThemeToggle } from "./theme.js";
import { initI18n, t } from "./i18n.js";

// --- Tooltip logic ---
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Позиционирование тултипа относительно кнопки hotspot.
 * @param {HTMLElement} tooltip
 * @param {HTMLElement} hotspot
 * @param {HTMLElement} containerEl - рамка панели (позиционирование внутри неё)
 */
function positionTooltip(tooltip, hotspot, containerEl) {
  const cRect = containerEl.getBoundingClientRect();
  const hRect = hotspot.getBoundingClientRect();

  // Центр hotspot в координатах контейнера
  const x = hRect.left - cRect.left + hRect.width / 2;
  const y = hRect.top - cRect.top; // верх hotspot

  // Ставим тултип над hotspot
  const padding = 10;
  const left = clamp(x, padding, cRect.width - padding);
  const top = clamp(y, padding, cRect.height - padding);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

/**
 * Открыть тултип для hotspot (текст берём из i18n).
 * @param {HTMLElement} hotspot
 */
function openTooltip(hotspot) {
  const tooltip = document.getElementById("tooltip");
  const titleEl = document.getElementById("tooltipTitle");
  const bodyEl = document.getElementById("tooltipBody");
  const frame = document.querySelector(".panel__frame");

  if (!tooltip || !titleEl || !bodyEl || !(frame instanceof HTMLElement)) return;

  const titleKey = hotspot.getAttribute("data-tooltip-title") || "";
  const bodyKey = hotspot.getAttribute("data-tooltip-body") || "";

  titleEl.textContent = t(titleKey);
  bodyEl.textContent = t(bodyKey);

  positionTooltip(tooltip, hotspot, frame);
  tooltip.setAttribute("aria-hidden", "false");
  tooltip.setAttribute("data-open", "true");
}

function closeTooltip() {
  const tooltip = document.getElementById("tooltip");
  if (!tooltip) return;
  tooltip.setAttribute("aria-hidden", "true");
  tooltip.removeAttribute("data-open");
}

function initHotspots() {
  const frame = document.querySelector(".panel__frame");
  if (!(frame instanceof HTMLElement)) return;

  // Делегируем события, чтобы было меньше обработчиков
  frame.addEventListener("mouseover", (e) => {
    const el = e.target instanceof HTMLElement ? e.target.closest(".hotspot") : null;
    if (el) openTooltip(el);
  });
  frame.addEventListener("mouseout", (e) => {
    const from = e.target instanceof HTMLElement ? e.target.closest(".hotspot") : null;
    if (!from) return;
    // Если ушли с hotspot — закрываем
    const to = e.relatedTarget instanceof HTMLElement ? e.relatedTarget.closest(".hotspot") : null;
    if (!to) closeTooltip();
  });

  // Клавиатура: фокус/blur
  frame.addEventListener("focusin", (e) => {
    const el = e.target instanceof HTMLElement ? e.target.closest(".hotspot") : null;
    if (el) openTooltip(el);
  });
  frame.addEventListener("focusout", (e) => {
    const from = e.target instanceof HTMLElement ? e.target.closest(".hotspot") : null;
    if (!from) return;
    // Если фокус ушёл с hotspot — закрываем
    const to = e.relatedTarget instanceof HTMLElement ? e.relatedTarget.closest(".hotspot") : null;
    if (!to) closeTooltip();
  });

  // Пере-позиционирование при ресайзе/скролле
  const reposition = () => {
    const tooltip = document.getElementById("tooltip");
    if (!tooltip || tooltip.getAttribute("data-open") !== "true") return;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement.closest(".hotspot") : null;
    if (active) positionTooltip(tooltip, active, frame);
  };
  window.addEventListener("resize", reposition);
  window.addEventListener("scroll", reposition, { passive: true });

  // При смене языка обновляем текст текущего тултипа, если открыт
  window.addEventListener("i18n:changed", () => {
    const tooltip = document.getElementById("tooltip");
    if (!tooltip || tooltip.getAttribute("data-open") !== "true") return;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement.closest(".hotspot") : null;
    if (active) openTooltip(active);
  });
}

// --- App bootstrap ---
(async function bootstrap() {
  initThemeToggle();
  await initI18n("ru");
  initHotspots();
  init3DPanel();
})();

// --- 3D панель (Three.js через CDN) ---
async function init3DPanel() {
  const canvas = document.getElementById("panel3d");
  if (!(canvas instanceof HTMLCanvasElement)) return;

  // Динамический импорт, чтобы не грузить три.js, если секция не нужна
  const [{ Scene, PerspectiveCamera, WebGLRenderer, Color, AmbientLight, DirectionalLight, Mesh, BoxGeometry, MeshStandardMaterial, CylinderGeometry, Vector2, AxesHelper }, { OrbitControls }] =
    await Promise.all([
      import("https://unpkg.com/three@0.160.0/build/three.module.js"),
      import("https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js")
    ]);

  const scene = new Scene();
  scene.background = new Color("#0c120f");

  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(4, 3, 6);

  // Свет
  scene.add(new AmbientLight("#9fffd6", 0.4));
  const dir = new DirectionalLight("#a7ffd6", 0.9);
  dir.position.set(5, 6, 4);
  scene.add(dir);

  // Корпус щита
  const bodyMat = new MeshStandardMaterial({
    color: "#1a2420",
    metalness: 0.2,
    roughness: 0.3,
    emissive: "#052b19",
    emissiveIntensity: 0.2
  });
  const body = new Mesh(new BoxGeometry(4, 3, 1.2), bodyMat);
  scene.add(body);

  // Дверца (тонкий слой спереди)
  const door = new Mesh(new BoxGeometry(4.05, 3.05, 0.1), new MeshStandardMaterial({
    color: "#0f1614",
    metalness: 0.15,
    roughness: 0.35,
    emissive: "#0a1f14",
    emissiveIntensity: 0.15
  }));
  door.position.z = 0.65;
  scene.add(door);

  // Ряд автоматов
  const breakerMat = new MeshStandardMaterial({
    color: "#e6f5ed",
    metalness: 0.05,
    roughness: 0.6
  });
  const handleMat = new MeshStandardMaterial({ color: "#00ff80", emissive: "#00c469", emissiveIntensity: 0.4 });
  const breakerGeo = new BoxGeometry(0.35, 0.7, 0.5);
  const handleGeo = new BoxGeometry(0.08, 0.3, 0.12);

  for (let i = -1.2; i <= 1.2; i += 0.6) {
    const b = new Mesh(breakerGeo, breakerMat);
    b.position.set(i, 0.5, 0.45);
    scene.add(b);

    const h = new Mesh(handleGeo, handleMat);
    h.position.set(i, 0.5, 0.82);
    scene.add(h);
  }

  // Клеммники (нижняя линия)
  const terminalMat = new MeshStandardMaterial({
    color: "#1d8c58",
    emissive: "#0c3d28",
    emissiveIntensity: 0.25,
    metalness: 0.1,
    roughness: 0.45
  });
  const terminalGeo = new BoxGeometry(0.4, 0.35, 0.35);
  for (let i = -1.1; i <= 1.1; i += 0.55) {
    const t = new Mesh(terminalGeo, terminalMat);
    t.position.set(i, -0.6, 0.45);
    scene.add(t);
  }

  // Сигнальные лампы (цилиндры)
  const lampGeo = new CylinderGeometry(0.09, 0.09, 0.16, 20);
  const lampColors = ["#00ff80", "#ffdd55", "#ff5577"];
  lampColors.forEach((col, idx) => {
    const mat = new MeshStandardMaterial({
      color: col,
      emissive: col,
      emissiveIntensity: 0.55,
      metalness: 0.05,
      roughness: 0.3
    });
    const lamp = new Mesh(lampGeo, mat);
    lamp.position.set(-0.25 + idx * 0.3, 0.0, 0.65);
    lamp.rotation.x = Math.PI / 2;
    scene.add(lamp);
  });

  // Основание/монтажная плита
  const plate = new Mesh(
    new BoxGeometry(3.2, 2.4, 0.12),
    new MeshStandardMaterial({ color: "#0e1815", metalness: 0.25, roughness: 0.55 })
  );
  plate.position.z = 0.35;
  scene.add(plate);

  // Оси (можно выключить при желании)
  const axes = new AxesHelper(2.5);
  axes.position.set(0, -1.4, -0.1);
  axes.material.depthTest = false;
  axes.material.transparent = true;
  axes.material.opacity = 0.35;
  scene.add(axes);

  // Контролы
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0.2);
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 0.8;
  controls.panSpeed = 0.4;

  // Ресайз
  const size = new Vector2();
  function onResize() {
    const { clientWidth, clientHeight } = canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    size.set(clientWidth, clientHeight);
    renderer.setSize(size.x, size.y, false);
    camera.aspect = size.x / size.y;
    camera.updateProjectionMatrix();
  }
  onResize();
  window.addEventListener("resize", onResize);

  // Рендер-цикл
  function tick() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}
