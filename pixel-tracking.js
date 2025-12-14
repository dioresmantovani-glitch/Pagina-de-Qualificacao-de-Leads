/* ============================================
   FACEBOOK PIXEL - TRACKING ADICIONAL
   ============================================ */

// Track quando usuário rola até a seção do formulário
let formSectionViewed = false;

function checkFormSectionView() {
    if (formSectionViewed) return;

    const formSection = document.getElementById('qualify');
    if (!formSection) return;

    const rect = formSection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (isVisible && !formSectionViewed) {
        formSectionViewed = true;

        // Facebook Pixel - Track form section view
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'FormSectionViewed', {
                section: 'Formulário de Qualificação',
                scroll_depth: Math.round((window.scrollY / document.body.scrollHeight) * 100)
            });
        }

        console.log('📊 Facebook Pixel: Seção do formulário visualizada');
    }
}

// Adicionar listener de scroll
window.addEventListener('scroll', checkFormSectionView);
window.addEventListener('load', checkFormSectionView);
