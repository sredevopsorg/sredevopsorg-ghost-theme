/**
 * reframe — make embedded iframes/objects responsive.
 *
 * Extracted from the UMD build that used to live inline in assets/js/main.js.
 * Bundlers detect UMD as CommonJS (it tests `typeof module`), which made the
 * global assignment never happen and the call site throw `reframe is not
 * defined`. A plain ES module removes the ambiguity.
 *
 * @param {string|NodeList|Element} target  selector, list or element
 * @param {string} className                wrapper class, also the "already done" marker
 */
export default function reframe(target, className = "js-reframe") {
  const nodes =
    typeof target === "string" ? document.querySelectorAll(target) : "length" in target ? target : [target];

  Array.from(nodes).forEach((node) => {
    if (node.className.split(" ").indexOf(className) !== -1) return;
    // Already fluid, leave it alone.
    if (node.style.width.indexOf("%") > -1) return;

    const height = node.getAttribute("height") || node.offsetHeight;
    const width = node.getAttribute("width") || node.offsetWidth;
    const ratio = (typeof height === "string" ? parseInt(height) : height) /
      (typeof width === "string" ? parseInt(width) : width);

    const wrapper = document.createElement("div");
    wrapper.className = className;
    Object.assign(wrapper.style, { position: "relative", width: "100%", paddingTop: `${ratio * 100}%` });
    Object.assign(node.style, { position: "absolute", width: "100%", height: "100%", left: "0", top: "0" });

    node.parentNode?.insertBefore(wrapper, node);
    node.parentNode?.removeChild(node);
    wrapper.appendChild(node);
  });
}
