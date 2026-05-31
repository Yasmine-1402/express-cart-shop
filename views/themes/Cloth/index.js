/* eslint-disable prefer-arrow-callback, no-var, no-tabs */
$(document).ready(function (){
    // --- Intersection Observer for fade-in animations ---
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-fade-in-up, .animate-bounce-in').forEach(function(el) {
            el.style.animationPlayState = 'paused';
            observer.observe(el);
        });
    }

    // --- Navbar background on scroll ---
    var mainNav = document.querySelector('.mainNavBar');
    if (mainNav) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 40) {
                mainNav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
                mainNav.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                mainNav.style.boxShadow = '0 2px 12px rgba(0,0,0,0.03)';
                mainNav.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        });
    }

    // --- Smooth scroll for anchor links ---
    $('a[href^="#"]').on('click', function(e) {
        var target = $(this.getAttribute('href'));
        if (target.length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: target.offset().top - 80
            }, 600);
        }
    });
});
