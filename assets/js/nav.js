/* ==========================================================
   CRaWL — shared site behaviour (every page loads this file)
   Header dropdowns, mobile menu, footer year.
   ========================================================== */
(function(){
  function closeMenus(){
    document.querySelectorAll(".nav .has-menu.open").forEach(function(li){
      li.classList.remove("open");
      var btn = li.querySelector("button.top");
      if(btn) btn.setAttribute("aria-expanded","false");
    });
  }

  document.querySelectorAll(".nav .has-menu").forEach(function(li){
    var btn = li.querySelector("button.top");
    if(!btn) return;
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var open = li.classList.contains("open");
      closeMenus();
      li.classList.toggle("open", !open);
      btn.setAttribute("aria-expanded", String(!open));
    });
  });
  document.addEventListener("click", closeMenus);
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") closeMenus(); });

  var burger = document.getElementById("burger");
  var header = document.getElementById("header");
  if(burger && header){
    burger.addEventListener("click", function(e){
      e.stopPropagation();
      var open = header.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  var yr = document.getElementById("yr");
  if(yr) yr.textContent = new Date().getFullYear();
})();
