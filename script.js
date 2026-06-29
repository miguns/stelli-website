// ===========================
// STELLI RAGDOLL - SCRIPT.JS
// ===========================

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    // Close menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
        });
    });
});

// Form Handling (optional - you can add your own backend later)
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('.contact-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(this);
            const data = {
                name: formData.get('name'),
                email: formData.get('email'),
                message: formData.get('message')
            };
            
            // For now, just show a confirmation
            // You can later integrate this with a backend service like Formspree, EmailJS, etc.
            alert('Děkujeme za vaši zprávu! Brzy se vám ozveme.');
            
            // Reset form
            this.reset();
            
            // If you want to use a service, uncomment and modify below:
            // fetch('YOUR_BACKEND_ENDPOINT', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(data)
            // })
            // .then(response => response.json())
            // .then(data => {
            //     alert('Zpráva byla odeslána!');
            //     form.reset();
            // })
            // .catch(error => {
            //     console.error('Error:', error);
            //     alert('Došlo k chybě. Zkuste prosím později.');
            // });
        });
    });
});

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
            }
        });
    });
});

// Add animation to elements on scroll (optional enhancement)
function observeElements() {
    const options = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, options);

    // Optional: add fade-in effect to cards
    const cards = document.querySelectorAll('.partner-box, .cat-card, .news-box, .litter-box');
    cards.forEach(card => {
        card.style.opacity = '0.8';
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    observeElements();
});
