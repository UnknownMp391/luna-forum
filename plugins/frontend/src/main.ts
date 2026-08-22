import '@fluentui/web-components/web-components.js';
import 'iconify-icon';
import './styles/sidebar.css';
import './styles/lfstyle-v1.css';
import '../public/scripts/sidebar.js';
import { setTheme } from '@fluentui/web-components';
import { webLightTheme, webDarkTheme } from '@fluentui/tokens';

const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
setTheme(isDark ? webDarkTheme : webLightTheme);