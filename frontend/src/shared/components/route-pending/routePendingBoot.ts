/** Shows the top progress bar before React hydrates. */
export const ROUTE_PENDING_BOOT = `
(function () {
  var bar = document.getElementById("app-top-progress");
  if (!bar) return;
  bar.hidden = false;
  window.__topLoading = true;

  window.__hideTopLoader = function () {
    window.__topLoading = false;
    if (window.__syncLoadingIndicator) window.__syncLoadingIndicator();
    else bar.hidden = true;
  };

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var link = target.closest("a[href]");
    if (!link) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    var href = link.getAttribute("href") || "";
    if (!href || href.charAt(0) === "#") return;
    var url;
    try { url = new URL(href, location.origin); } catch (e) { return; }
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    bar.hidden = false;
    window.__topLoading = true;
    if (window.__syncLoadingIndicator) window.__syncLoadingIndicator();
  }, true);
})();
`;
