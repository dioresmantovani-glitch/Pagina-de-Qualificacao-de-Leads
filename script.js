const state = {
    whatsapp: '', // Moved to Step 1
    email: '', // New optional field Step 1
    interesse: '', // Moved to Step 2
    nome: '',
    cidade: '',
    bairros: '',
    cpf: '',
    restricao_cpf: '',
    possui_imovel: '',
    tipo_imovel: '',
    nascimento: '',
    estado_civil: '',
    filhos: '',
    dependente_sem_renda: '',
    parentesco_dependente: '',
    renda: '',
    juntar_renda: '',
    tempo_fgts: '',
    trabalha_registrado: '',
    tentativa_aprovacao: '',
    valor_entrada: ''
};

let stepHistory = []; // Stack to track navigation history

function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        // Get navbar height to calculate offset
        const navbar = document.querySelector('.navbar');
        const navbarHeight = navbar ? navbar.offsetHeight : 0;

        // Add extra padding for breathing room (20px)
        const offset = navbarHeight + 20;

        // Calculate target position
        const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - offset;

        // Scroll to position with offset
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
}

function nextStep(currentStep, field, value, nextTarget) {
    stepHistory.push(currentStep); // Add to history
    if (field) {
        state[field] = value;
    }
    const target = nextTarget ? nextTarget : (typeof currentStep === 'number' ? currentStep + 1 : parseFloat(currentStep) + 1);

    // Facebook Pixel - Track step completion
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', 'FunnelStep', {
            step: currentStep,
            field: field,
            value: value,
            next_step: target
        });
    }

    transitionToStep(target);
}

function validateAndNext(currentStep, fieldId, nextTarget) {
    const input = document.getElementById(fieldId);
    if (!input.checkValidity() || input.value.trim() === '') {
        input.reportValidity();
        return;
    }
    state[fieldId] = input.value;

    // Capture optional email if on step 1
    if (currentStep === 1) {
        const emailInput = document.getElementById('email');
        if (emailInput && emailInput.value.trim() !== '') {
            state.email = emailInput.value;
        }
    }

    stepHistory.push(currentStep); // Add to history

    // Facebook Pixel - Track field completion
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', 'FormFieldCompleted', {
            step: currentStep,
            field: fieldId,
            has_value: true
        });
    }

    const target = nextTarget ? nextTarget : currentStep + 1;
    transitionToStep(target);
}

function handleEnter(e, step, fieldId) {
    if (e.key === 'Enter') {
        e.preventDefault();
        validateAndNext(step, fieldId);
    }
}

function prevStep() {
    if (stepHistory.length === 0) return;
    const prev = stepHistory.pop();
    transitionToStep(prev);
}

function transitionToStep(stepIdentifier) {
    const currentStepEl = document.querySelector('.form-step.active');
    const nextStepEl = document.querySelector(`.form-step[data-step="${stepIdentifier}"]`);
    const progressFill = document.getElementById('progressFill');

    if (currentStepEl) {
        currentStepEl.classList.remove('active');
    }

    if (nextStepEl) {
        nextStepEl.classList.add('active');
        const input = nextStepEl.querySelector('input');
        if (input) {
            setTimeout(() => input.focus(), 300);
        }
    }

    // Update progress bar (Total steps = 14)
    // Updated step list: 1=WhatsApp/Email, 2=Nome, 3=Interesse, 4=Cidade, 4.1=Bairros, 5=CPF...
    const allSteps = ['1', '2', '3', '4', '4.1', '5', '5.1', '6', '6.1', '7', '8', '8.1', '8.2', '9', '10', '11', '12', '13', '14'];
    const sId = String(stepIdentifier);
    const idx = allSteps.indexOf(sId);

    if (idx !== -1) {
        const progress = ((idx + 1) / allSteps.length) * 100;
        progressFill.style.width = `${progress}%`;

        // Facebook Pixel - Track step view with progress
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', 'StepViewed', {
                step: stepIdentifier,
                step_index: idx + 1,
                total_steps: allSteps.length,
                progress_percent: Math.round(progress)
            });
        }
    } else {
        // Fallback for unexpected steps
        const numericStep = parseFloat(stepIdentifier);
        if (!isNaN(numericStep)) {
            const progress = Math.min((numericStep / 14) * 100, 100);
            progressFill.style.width = `${progress}%`;
        }
    }
}

// Masks
function maskPhone(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 10) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 5) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5}).*/, "($1) $2");
    }
    input.value = value;
}

function maskCPF(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    input.value = value;
}

function maskDate(input) {
    let value = input.value.replace(/\D/g, "");
    if (value.length > 8) value = value.slice(0, 8);

    value = value.replace(/(\d{2})(\d)/, "$1/$2");
    value = value.replace(/(\d{2})(\d)/, "$1/$2");

    input.value = value;
}

function maskMoney(input) {
    let value = input.value.replace(/\D/g, "");
    value = (value / 100).toFixed(2) + "";
    value = value.replace(".", ",");
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    input.value = "R$ " + value;
}

// Final Step: Finish Form manually to avoid "hidden required inputs" error
function finishForm() {
    // WhatsApp is now captured in step 1, so we just need to proceed

    // Facebook Pixel - Track Lead (Conversion)
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_name: 'Formulário Completo - Análise de Crédito',
            content_category: 'Lead Qualification',
            value: 1,
            currency: 'BRL',
            status: 'completed'
        });

        // Evento customizado com mais detalhes
        fbq('trackCustom', 'FormCompleted', {
            whatsapp: state.whatsapp,
            nome: state.nome,
            cidade: state.cidade,
            interesse: state.interesse,
            total_steps: 14,
            completion_rate: 100
        });
    }

    // Send form data to email
    sendFormDataToEmail();

    // Hide form, show result screen
    document.getElementById('leadForm').style.display = 'none';
    const resultScreen = document.getElementById('resultScreen');
    resultScreen.style.display = 'block';

    // Setup the result button to send the FULL FORM DATA via WhatsApp when clicked
    document.getElementById('resultBtn').onclick = function () {
        sendFormDataToWhatsApp();
    };
}

// Send complete form data to WhatsApp (called when "Enviar Respostas" is clicked)
function sendFormDataToWhatsApp() {
    const phoneNumber = (typeof CONFIG !== 'undefined' && CONFIG.whatsapp) ? CONFIG.whatsapp.numero : '5514988185721';

    const yn = (val) => val === 'sim' ? 'Sim' : (val === 'nao' ? 'Não' : (val === 'nao_sei' ? 'Não Sei Dizer' : val));

    let imovelDetails = `*Possui Imóvel:* ${yn(state.possui_imovel)}`;
    if (state.possui_imovel === 'sim' && state.tipo_imovel) {
        imovelDetails += ` (${state.tipo_imovel})`;
    }

    const introMessage = "Olá, seguem as informações para análise do meu crédito. Por favor, peço que me envie o resultado assim que estiver disponível. Agradeço desde já e fico no aguardo.";

    const fullText = `${introMessage}\n\n` +
        `*INFORMAÇÕES PARA ANALISE DE CREDITO*\n\n` +
        `*WhatsApp:* ${state.whatsapp}\n` +
        (state.email ? `*E-mail:* ${state.email}\n` : '') +
        `*Interesse:* ${state.interesse}\n` +
        `*Nome:* ${state.nome}\n` +
        `*Cidade:* ${state.cidade}\n` +
        `*Bairros:* ${state.bairros}\n` +
        `*CPF:* ${state.cpf}\n` +
        `*Restrição CPF:* ${yn(state.restricao_cpf)}\n` +
        `*Nasc:* ${state.nascimento}\n` +
        `*Estado Civil:* ${state.estado_civil}\n` +
        `*Filhos:* ${yn(state.filhos)}\n` +
        `*Parente s/ Renda:* ${yn(state.dependente_sem_renda)} ${state.dependente_sem_renda === 'sim' ? '(' + state.parentesco_dependente + ')' : ''}\n` +
        `*Renda:* ${state.renda}\n` +
        `*Juntar Renda:* ${yn(state.juntar_renda)}\n` +
        `*3 Anos FGTS:* ${yn(state.tempo_fgts)}\n` +
        `*Trabalha Registrado:* ${yn(state.trabalha_registrado)}\n` +
        `*Tentou Financiamento:* ${formatTentativa(state.tentativa_aprovacao)}\n` +
        `*Valor Entrada:* ${state.valor_entrada}\n` +
        `${imovelDetails}`;

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(fullText)}`;

    // Open WhatsApp with full form data
    window.open(url, '_blank');
}

// Send form data to email using Web3Forms
async function sendFormDataToEmail() {
    const yn = (val) => val === 'sim' ? 'Sim' : (val === 'nao' ? 'Não' : (val === 'nao_sei' ? 'Não Sei Dizer' : val));

    // Access Key from Web3Forms
    const accessKey = (typeof CONFIG !== 'undefined' && CONFIG.accessKey) ? CONFIG.accessKey : 'a688c5db-0a1e-4945-be7d-c3589ab91da8';

    // Prepare email body with all form data
    const emailBody = `
🏠 NOVA SOLICITAÇÃO DE ANÁLISE DE CRÉDITO IMOBILIÁRIO
========================================

📋 DADOS DO CLIENTE:

📱 WhatsApp: https://wa.me/55${state.whatsapp.replace(/\D/g, '')}
${state.email ? `📧 E-mail: ${state.email}` : ''}
🎯 Interesse: ${state.interesse}
👤 Nome: ${state.nome}
🏙️ Cidade: ${state.cidade}
📍 Bairros de Interesse: ${state.bairros}
📄 CPF: ${state.cpf}
🚫 Restrição no CPF: ${yn(state.restricao_cpf)}
🎂 Data de Nascimento: ${state.nascimento}
💍 Estado Civil: ${state.estado_civil}
👶 Filhos Menores: ${yn(state.filhos)}
👨‍👩‍👦 Parente sem Renda: ${yn(state.dependente_sem_renda)} ${state.dependente_sem_renda === 'sim' ? '(' + state.parentesco_dependente + ')' : ''}
💰 Renda Familiar Mensal: ${state.renda}
🤝 Deseja Juntar Renda: ${yn(state.juntar_renda)}
📅 3 Anos ou Mais de FGTS: ${yn(state.tempo_fgts)}
💼 Trabalha Registrado: ${yn(state.trabalha_registrado)}
🏦 Tentou Financiamento: ${formatTentativa(state.tentativa_aprovacao)}
💵 Valor para Entrada: ${state.valor_entrada}
🏠 Possui Imóvel: ${yn(state.possui_imovel)} ${state.possui_imovel === 'sim' && state.tipo_imovel ? '(' + state.tipo_imovel + ')' : ''}

========================================
Data/Hora: ${new Date().toLocaleString('pt-BR')}
    `;

    // Prepare the data to send
    const formData = {
        access_key: accessKey,
        subject: `🏠 Nova Solicitação de Análise de Crédito - ${state.nome}`,
        from_name: 'Pagina Quero Meu Primeiro Imovel',
        message: emailBody,
        // Additional fields for better organization
        nome: state.nome,
        whatsapp: state.whatsapp,
        cidade: state.cidade
    };

    try {
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            console.log('✅ Email enviado com sucesso para dioresmantovani@gmail.com');
        } else {
            console.error('❌ Erro ao enviar email:', result.message);
        }
    } catch (error) {
        console.error('❌ Erro na requisição:', error);
    }
}

// Setup simple greeting message for result screen button
function setupSimpleWhatsAppLink() {
    const phoneNumber = (typeof CONFIG !== 'undefined' && CONFIG.whatsapp) ? CONFIG.whatsapp.numero : '5514988185721';

    // Simple greeting message for the client
    const message = (typeof CONFIG !== 'undefined' && CONFIG.whatsapp) ? CONFIG.whatsapp.mensagem : 'Olá, quero ver como ficou minha simulação de financiamento imobiliário, por favor.';

    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    document.getElementById('resultBtn').onclick = function () {
        window.open(url, '_blank');
    };
}



function formatRenda(val) {
    return val; // Validation happens in input
}

function formatTentativa(val) {
    if (val === 'nunca') return 'Nunca';
    if (val === 'menos-6-meses') return '< 6 meses';
    if (val === 'mais-6-meses') return '> 6 meses';
    return val;
}

// Mouse Parallax
document.addEventListener('mousemove', (e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    const orbs = document.querySelectorAll('.glow-orb');
    orbs.forEach((orb, index) => {
        const speed = (index + 1) * 20;
        orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
});

/* Constellation Effect Removed */
/*
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
// ... (code removed/commented out)
*/
function resize() {
    // Canvas resizing removed
}
function initParticles() {}
function animateParticles() {}

window.addEventListener('resize', () => { resize(); });
resize();
// initParticles();
// animateParticles();

// Prevent form submission on Enter key
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('leadForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            return false;
        });

        // Also prevent Enter key from submitting the form
        form.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                e.preventDefault();
                return false;
            }
        });
    }
});

/* Funnel Modal Logic */
function openFunnel() {
    document.getElementById('funnelModal').style.display = 'flex';
    nextFunnelStep(1); // Reset to step 1
    // Disable main page scrolling
    document.body.style.overflow = 'hidden';

    // Facebook Pixel - Track modal open
    if (typeof fbq !== 'undefined') {
        fbq('trackCustom', 'EducationalModalOpened', {
            modal_name: '3 Passos para Comprar Imóvel'
        });
    }
}

function closeFunnel() {
    document.getElementById('funnelModal').style.display = 'none';
    // Enable main page scrolling
    document.body.style.overflow = 'auto';
}

function nextFunnelStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.funnel-step').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });

    // Show target step
    const target = document.getElementById('funnelStep' + stepNumber);
    if (target) {
        target.style.display = 'block';
        // Small delay for fade effect if we added CSS transitions, but block is fine for now
        requestAnimationFrame(() => target.classList.add('active'));
    }

    // Scroll to top of modal content
    const modalContent = document.querySelector('.glass-modal');
    if (modalContent) {
        modalContent.scrollTop = 0;
    }
}

function closeFunnelAndScroll() {
    closeFunnel();
    scrollToSection('qualify');
}

// Close modal if clicked outside content
document.getElementById('funnelModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeFunnel();
    }
});


/* Direct WhatsApp Contact Button in Navbar */
function openWhatsAppDirect() {
    const phoneNumber = (typeof CONFIG !== 'undefined' && CONFIG.whatsapp) ? CONFIG.whatsapp.numero : '5514988185721';
    const message = 'Olá, gostaria de tirar algumas dúvidas com um corretor.';
    const url = 'https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message);
    window.open(url, '_blank');
}
