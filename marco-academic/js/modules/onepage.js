(function(){
  // Minimal one-page smooth scroll for anchor links used in menu
  function ready(fn){ if(document.readyState!=='loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn);} }
  ready(function(){
    Array.prototype.forEach.call(document.querySelectorAll('a.menu-link[href^="#"]'), function(a){
      a.addEventListener('click', function(e){
        var href = a.getAttribute('href');
        if(!href || href === '#') return;
        var target = document.querySelector(href);
        if(target){
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  });
})();

