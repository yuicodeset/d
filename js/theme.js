document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const body = document.body;

    // Check for saved user preference, if any, on load of the website
    const savedTheme = localStorage.getItem('theme');
    
    // If a theme was saved, apply it. Otherwise, check system preference
    if (savedTheme) {
        body.classList.toggle('dark', savedTheme === 'dark');
    } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            body.classList.add('dark');
        }
    }

    // Toggle theme on button click
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark');
        
        // Save the current preference to localStorage
        const isDark = body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
});
