document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-lf-drawer-target]').forEach((drawer) => {
        const drawer_id = drawer.getAttribute('data-lf-drawer-target');
        const toggle_button = document.querySelector(`[data-lf-drawer-toggle="${drawer_id}"]`);
        const drawer_menu = document.querySelector(`[data-lf-drawer-menu="${drawer_id}"]`);
        const overlay = document.querySelector('[data-lf-drawer-overlay]') || ((el) => {
            el.className = 'overlay';
            el.setAttribute('data-lf-drawer-overlay', '');
            document.body.appendChild(el);
            return el;
        })(document.createElement('div'));
        const drawer_title = document.querySelector('[data-lf-drawer-title]');
        const is_mobile = () => innerWidth <= 768;
        const sync_state = () => {
            if (is_mobile()) {
                drawer.classList.add('mobile');
                drawer.classList.remove('collapsed');
                if (drawer_menu) {
                    drawer_menu.style.display = 'block';
                }
            } else {
                drawer.classList.remove('mobile', 'open');
                overlay.classList.remove('show');
                if (drawer_menu) {
                    drawer_menu.style.display = 'none';
                }
            }
        };

        if (toggle_button) {
            toggle_button.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                if (!is_mobile()) {
                    drawer.classList.toggle('collapsed');
                }
            };
        }

        if (drawer_menu) {
            drawer_menu.onclick = (event) => {
                event.preventDefault();
                event.stopPropagation();
                drawer.classList.toggle('open');
                overlay.classList.toggle('show');
            };
        }

        overlay.onclick = () => {
            drawer.classList.remove('open');
            overlay.classList.remove('show');
        };

        addEventListener('resize', sync_state);
        addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                drawer.classList.remove('open');
                overlay.classList.remove('show');
            }
        });

        drawer.querySelectorAll('.nav-item').forEach((nav_item) => {
            nav_item.onclick = () => {
                drawer.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
                nav_item.classList.add('active');
                if (drawer_title) {
                    drawer_title.textContent = nav_item.dataset.title || '';
                }
                if (is_mobile()) {
                    drawer.classList.remove('open');
                    overlay.classList.remove('show');
                }
            };
        });

        sync_state();
    });
});

function callDrawerAfterLoading(str) {
    document.querySelectorAll('.nav-item').forEach(n => {
        const title = n.getAttribute('data-title');
        if(title === str) {
            n.classList.add('active');
        }
    });
}