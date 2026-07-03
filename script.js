// Mobile menu toggle
document.getElementById('navToggle')?.addEventListener('click', function() {
    document.getElementById('navMenu').classList.toggle('active');
});

// Close menu when link clicked
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('navMenu').classList.remove('active');
    });
});

// Form submission
document.querySelectorAll('.contact-form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Děkujeme za vaši zprávu! Brzy se vám ozveme.');
        this.reset();
    });
});
