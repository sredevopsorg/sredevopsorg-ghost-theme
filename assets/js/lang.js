        /* Set the language attribute on the HTML element based on the subpath of the URL
        This script will set the language attribute on the HTML element based on the subpath of the URL
        */
        document.addEventListener('DOMContentLoaded', function () {
            var path = window.location.pathname.split('/')[1]; // Get the first subpath
            var lang = '{{@site.locale}}'; // Default language

            // Map subpaths to locales
            var localeMap = {
                'es': 'es',
                'br': 'pt',
                'en': 'en',
                // Add more mappings as needed
            };

            if (localeMap.hasOwnProperty(path)) {
                lang = localeMap[path];
            }

            document.querySelector('html').setAttribute('lang', lang);
        });
