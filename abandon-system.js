
/* ============================================
   SISTEMA DE CAPTURA DE ABANDONO DE FUNIL
   ============================================ */

let formCompleted = false; // Flag para saber se o formulário foi completado
let abandonEmailSent = false; // Flag para evitar envios duplicados
let inactivityTimer = null; // Timer de inatividade
const INACTIVITY_TIME = 180000; // 3 minutos de inatividade (em milissegundos)

// Função para verificar se há dados suficientes para enviar
function hasMinimumData() {
    // Só envia se tiver pelo menos WhatsApp OU Nome preenchido
    return (state.whatsapp && state.whatsapp.trim() !== '') ||
        (state.nome && state.nome.trim() !== '');
}

// Função para enviar email de abandono
async function sendAbandonEmail() {
    // Não envia se:
    // 1. Já enviou antes
    // 2. Formulário foi completado
    // 3. Não tem dados mínimos
    if (abandonEmailSent || formCompleted || !hasMinimumData()) {
        console.log('❌ Não enviando email de abandono:', {
            abandonEmailSent,
            formCompleted,
            hasMinimumData: hasMinimumData()
        });
        return;
    }

    console.log('📧 Enviando email de abandono...');
    abandonEmailSent = true; // Marca como enviado

    const yn = (val) => val === 'sim' ? 'Sim' : (val === 'nao' ? 'Não' : (val === 'nao_sei' ? 'Não Sei Dizer' : val));
    const accessKey = (typeof CONFIG !== 'undefined' && CONFIG.accessKey) ? CONFIG.accessKey : 'a688c5db-0a1e-4945-be7d-c3589ab91da8';

    // Monta lista de campos preenchidos
    const filledFields = [];

    if (state.whatsapp) filledFields.push(`📱 WhatsApp: ${state.whatsapp}`);
    if (state.email) filledFields.push(`📧 E-mail: ${state.email}`);
    if (state.nome) filledFields.push(`👤 Nome: ${state.nome}`);
    if (state.interesse) filledFields.push(`🎯 Interesse: ${state.interesse}`);
    if (state.cidade) filledFields.push(`🏙️ Cidade: ${state.cidade}`);
    if (state.bairros) filledFields.push(`📍 Bairros: ${state.bairros}`);
    if (state.cpf) filledFields.push(`📄 CPF: ${state.cpf}`);
    if (state.restricao_cpf) filledFields.push(`🚫 Restrição CPF: ${yn(state.restricao_cpf)}`);
    if (state.nascimento) filledFields.push(`🎂 Nascimento: ${state.nascimento}`);
    if (state.estado_civil) filledFields.push(`💍 Estado Civil: ${state.estado_civil}`);
    if (state.filhos) filledFields.push(`👶 Filhos: ${yn(state.filhos)}`);
    if (state.dependente_sem_renda) filledFields.push(`👨‍👩‍👦 Parente s/ Renda: ${yn(state.dependente_sem_renda)}`);
    if (state.parentesco_dependente) filledFields.push(`   Parentesco: ${state.parentesco_dependente}`);
    if (state.renda) filledFields.push(`💰 Renda: ${state.renda}`);
    if (state.juntar_renda) filledFields.push(`🤝 Juntar Renda: ${yn(state.juntar_renda)}`);
    if (state.tempo_fgts) filledFields.push(`📅 3 Anos FGTS: ${yn(state.tempo_fgts)}`);
    if (state.trabalha_registrado) filledFields.push(`💼 Trabalha Registrado: ${yn(state.trabalha_registrado)}`);
    if (state.tentativa_aprovacao) filledFields.push(`🏦 Tentou Financiamento: ${formatTentativa(state.tentativa_aprovacao)}`);
    if (state.valor_entrada) filledFields.push(`💵 Valor Entrada: ${state.valor_entrada}`);
    if (state.possui_imovel) filledFields.push(`🏠 Possui Imóvel: ${yn(state.possui_imovel)}`);
    if (state.tipo_imovel) filledFields.push(`   Tipo: ${state.tipo_imovel}`);

    const emailBody = `
⚠️ FORMULÁRIO ABANDONADO - LEAD PARCIAL
========================================

🚨 ATENÇÃO: Este lead abandonou o formulário antes de completar!

📊 DADOS PREENCHIDOS ATÉ O MOMENTO:

${filledFields.join('\n')}

========================================
⏰ Data/Hora do Abandono: ${new Date().toLocaleString('pt-BR')}
📍 Última Etapa Acessada: ${stepHistory.length > 0 ? stepHistory[stepHistory.length - 1] : '1'}

💡 DICA: Entre em contato rapidamente! Este lead demonstrou interesse mas não completou o cadastro.
    `;

    const formData = {
        access_key: accessKey,
        subject: `⚠️ LEAD ABANDONOU FORMULÁRIO - ${state.nome || state.whatsapp || 'Lead Parcial'}`,
        from_name: 'Sistema Anti-Abandono - Quero Meu Primeiro Imovel',
        message: emailBody,
        nome: state.nome || 'Não informado',
        whatsapp: state.whatsapp || 'Não informado',
        status: 'ABANDONADO'
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
            console.log('✅ Email de abandono enviado com sucesso');
        } else {
            console.error('❌ Erro ao enviar email de abandono:', result.message);
        }
    } catch (error) {
        console.error('❌ Erro na requisição de abandono:', error);
    }
}

// Resetar timer de inatividade
function resetInactivityTimer() {
    if (inactivityTimer) {
        clearTimeout(inactivityTimer);
    }

    // Só inicia timer se não completou o formulário e tem dados mínimos
    if (!formCompleted && hasMinimumData()) {
        inactivityTimer = setTimeout(() => {
            console.log('⏰ Usuário inativo por 3 minutos - enviando email de abandono');
            sendAbandonEmail();
        }, INACTIVITY_TIME);
    }
}

// Detectar quando usuário está saindo da página
window.addEventListener('beforeunload', function (e) {
    // Só envia se não completou e tem dados mínimos
    if (!formCompleted && hasMinimumData() && !abandonEmailSent) {
        console.log('🚨 Detectado abandono - enviando email...');

        const yn = (val) => val === 'sim' ? 'Sim' : (val === 'nao' ? 'Não' : (val === 'nao_sei' ? 'Não Sei Dizer' : val));
        const accessKey = (typeof CONFIG !== 'undefined' && CONFIG.accessKey) ? CONFIG.accessKey : 'a688c5db-0a1e-4945-be7d-c3589ab91da8';

        // Monta lista de campos preenchidos
        const filledFields = [];
        if (state.whatsapp) filledFields.push(`📱 WhatsApp: ${state.whatsapp}`);
        if (state.email) filledFields.push(`📧 E-mail: ${state.email}`);
        if (state.nome) filledFields.push(`👤 Nome: ${state.nome}`);
        if (state.interesse) filledFields.push(`🎯 Interesse: ${state.interesse}`);
        if (state.cidade) filledFields.push(`🏙️ Cidade: ${state.cidade}`);
        if (state.bairros) filledFields.push(`📍 Bairros: ${state.bairros}`);
        if (state.cpf) filledFields.push(`📄 CPF: ${state.cpf}`);
        if (state.restricao_cpf) filledFields.push(`🚫 Restrição CPF: ${yn(state.restricao_cpf)}`);
        if (state.nascimento) filledFields.push(`🎂 Nascimento: ${state.nascimento}`);
        if (state.estado_civil) filledFields.push(`💍 Estado Civil: ${state.estado_civil}`);
        if (state.renda) filledFields.push(`💰 Renda: ${state.renda}`);

        const emailBody = `⚠️ FORMULÁRIO ABANDONADO - LEAD PARCIAL

🚨 ATENÇÃO: Este lead abandonou o formulário antes de completar!

📊 DADOS PREENCHIDOS:

${filledFields.join('\n')}

========================================
⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}
📍 Última Etapa: ${stepHistory.length > 0 ? stepHistory[stepHistory.length - 1] : '1'}

💡 Entre em contato rapidamente!`;

        // Usa FormData para sendBeacon (mais confiável que JSON)
        const formData = new FormData();
        formData.append('access_key', accessKey);
        formData.append('subject', `⚠️ ABANDONO - ${state.nome || state.whatsapp || 'Lead'}`);
        formData.append('from_name', 'Anti-Abandono - Quero Meu Primeiro Imovel');
        formData.append('message', emailBody);
        formData.append('nome', state.nome || 'Não informado');
        formData.append('whatsapp', state.whatsapp || 'Não informado');

        // Usa sendBeacon com FormData
        const sent = navigator.sendBeacon('https://api.web3forms.com/submit', formData);
        console.log('📧 Email de abandono enviado:', sent ? 'Sucesso' : 'Falhou');
        abandonEmailSent = true;
    }
});

// Detectar atividade do usuário
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Sistema anti-abandono inicializado');

    // Eventos que indicam atividade
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    activityEvents.forEach(event => {
        document.addEventListener(event, resetInactivityTimer, true);
    });

    // Inicia o timer quando a página carrega
    resetInactivityTimer();

    // Interceptar finishForm para marcar como completado
    const originalFinishForm = window.finishForm;
    if (originalFinishForm) {
        window.finishForm = function () {
            console.log('✅ Formulário completado - cancelando sistema anti-abandono');
            formCompleted = true; // Marca como completado
            if (inactivityTimer) {
                clearTimeout(inactivityTimer); // Cancela timer de inatividade
            }
            originalFinishForm(); // Chama função original
        };
    }
});
