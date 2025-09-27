(function(){
  // Minimal mobile menu toggle for Canvas/primary-menu
  function ready(fn){
    if(document.readyState!=='loading'){ fn(); } else { document.addEventListener('DOMContentLoaded', fn); }
  }
  ready(function(){
    var trigger = document.querySelector('.primary-menu-trigger');
    var menuContainer = document.querySelector('.primary-menu .menu-container');
    if(!trigger || !menuContainer){ return; }

    function setOpen(isOpen){
      document.body.classList.toggle('primary-menu-open', !!isOpen);
      trigger.classList.toggle('primary-menu-trigger-active', !!isOpen);
      menuContainer.classList.toggle('d-block', !!isOpen);
    }

    trigger.addEventListener('click', function(e){
      e.preventDefault();
      setOpen(!document.body.classList.contains('primary-menu-open'));
    });

    // Close on link click
    Array.prototype.forEach.call(document.querySelectorAll('.primary-menu .menu-link'), function(a){
      a.addEventListener('click', function(){ setOpen(false); });
    });

    // Close on ESC
    document.addEventListener('keydown', function(e){ if(e.key==='Escape'){ setOpen(false); }});
  });
})();

