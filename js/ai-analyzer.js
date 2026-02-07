
document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('send-btn');
    const userInput = document.getElementById('user-input');
    const chatHistory = document.getElementById('chat-history');
    const errorMessage = document.getElementById('error-message');

    // Initialize System directly
    showSystemInit();

    // Auto-resize textarea
    userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    sendBtn.addEventListener('click', handleSend);

    function showSystemInit() {
        const t = window.t || ((k) => k);
        const initText = `<div style="font-family: 'JetBrains Mono', monospace; font-size: 0.9em;">
            ${t('system_init')}
        </div>`;
        appendMessage('ai', initText, null, true);
    }

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        errorMessage.classList.add('hidden');
        userInput.value = '';
        userInput.style.height = 'auto';

        appendMessage('user', text);
        const typingId = showTypingIndicator();

        try {
            // Simulated processing delay to look "computational"
            await new Promise(r => setTimeout(r, 1500));
            const analysis = analyzeLikelihood(text);

            removeTypingIndicator(typingId);

            // Format as a technical report
            const reportHTML = generateReportHTML(analysis);
            appendMessage('ai', reportHTML, analysis.riskLevel);

        } catch (error) {
            console.error("Analysis failed:", error);
            removeTypingIndicator(typingId);
            const t = window.t || ((k) => k);
            appendMessage('ai', t('system_error'), 'medium');
        }
    }

    /**
     * ADVANCED SCAM DETECTION ENGINE
     */
    function analyzeLikelihood(text) {
        const lowerText = text.toLowerCase();
        let riskScore = 0; // 0 to 100
        let detectedCategories = [];
        let triggers = [];

        // --- DEFINITIONS ---

        const scamPatterns = [
            {
                id: 'phishing',
                label: 'Фишинг (Phishing)',
                keywords: ['http', 'www', '.com', '.ru', '.kz', 'link', 'click', 'login', 'verify', 'update', 'account', 'suspended', 'ссылка', 'перейди', 'вход', 'подтверди', 'аккаунт', 'заблокирован', 'обнови', 'верификация', 'сілтеме', 'кіру', 'rastau', 'account'],
                weight: 30
            },
            {
                id: 'financial',
                label: 'Финансовое мошенничество',
                keywords: ['card', 'cvv', 'bank', 'transfer', 'credit', 'debit', 'wallet', 'crypto', 'bitcoin', 'usdt', 'binance', 'trust wallet', 'карта', 'код', 'срок действия', 'счет', 'перевод', 'кредит', 'кошелек', 'крипта', 'биткоин', 'банк', 'каспи', 'kaspi', 'halyk', 'mastercard', 'visa'],
                weight: 35
            },
            {
                id: 'investment',
                label: 'Лже-инвестиции',
                keywords: ['invest', 'profit', 'guaranteed', 'earnings', 'passive income', 'roi', 'double', 'инвестиции', 'прибыль', 'гарантия', 'доход', 'пассивный', 'заработок', 'удвоить', 'акции', 'газпром', 'брокер', 'трейдинг', 'сигналы'],
                weight: 25
            },
            {
                id: 'romance',
                label: 'Романтический скам',
                keywords: ['love', 'honey', 'beautiful', 'come see you', 'ticket', 'need money', 'accident', 'hospital', 'любимая', 'дорогой', 'приехать', 'билет', 'нужны деньги', 'больница', 'люблю', 'познакомимся', 'военный', 'врач', 'сирия', 'йемен'],
                weight: 20
            },
            {
                id: 'tech_support',
                label: 'Фейковая техподдержка',
                keywords: ['virus', 'infected', 'microsoft', 'windows', 'support', 'call', 'number', 'error', 'hacked', 'вирус', 'заражен', 'майкрософт', 'поддержка', 'позвоните', 'номер', 'ошибка', 'взломан', 'доступ', 'удаленный доступ', 'anydesk', 'teamviewer'],
                weight: 40
            },
            {
                id: 'employment',
                label: 'Мошенничество с работой',
                keywords: ['job', 'hiring', 'salary', 'daily pay', 'manager', 'telegram', 'whatsapp', 'hr', 'vacancy', 'работа', 'вакансия', 'зарплата', 'ежедневно', 'менеджер', 'удаленно', 'без опыта', 'ozon', 'wb', 'wildberries', 'amazon', 'выкуп'],
                weight: 20
            },
            {
                id: 'lottery',
                label: 'Выигрыш / Лотерея',
                keywords: ['winner', 'won', 'lottery', 'prize', 'claim', 'congratulations', 'iphone', 'money', 'победитель', 'выиграли', 'приз', 'лотерея', 'забрать', 'поздравляем', 'розыгрыш', 'айфон', 'бесплатно'],
                weight: 25
            },
            {
                id: 'emergency',
                label: 'Родственник в беде',
                keywords: ['mom', 'dad', 'police', 'arrested', 'jail', 'accident', 'hospital', 'urgent', 'help', 'мама', 'папа', 'полиция', 'арестовали', 'следствие', 'дтп', 'авария', 'больница', 'срочно', 'помоги', 'деньги', 'следователь'],
                weight: 40
            },
            {
                id: 'marketplace',
                label: 'Торговые площадки (OLX/Avito)',
                keywords: ['courier', 'delivery', 'pay link', 'whatsapp', 'olx', 'avito', 'kolesa', 'krisha', 'курьер', 'доставка', 'оплата по ссылке', 'ватсап', 'олх', 'колеса', 'крыша', 'яндекс доставка', 'сдэк', 'накладная'],
                weight: 30
            }
        ];

        // --- ANALYSIS ---

        scamPatterns.forEach(pattern => {
            let matched = pattern.keywords.filter(keyword => lowerText.includes(keyword));
            if (matched.length > 0) {
                // If more than 1 keyword matched, increase weight
                let currentWeight = pattern.weight + (matched.length - 1) * 5;
                riskScore += currentWeight;

                // Use the ID to find the category key (e.g., 'cat_phishing')
                detectedCategories.push(`cat_${pattern.id}`);

                matched.forEach(m => {
                    if (!triggers.includes(m)) triggers.push(m);
                });
            }
        });

        // Heuristics adjustments
        if (text.length < 10) riskScore -= 20; // Too short is hard to judge
        if (text.includes('?')) riskScore -= 5; // Questions might be innocent asking
        if (text.toUpperCase() === text && text.length > 20) riskScore += 10; // ALL CAPS YELLING

        // Cap risk score
        riskScore = Math.min(100, Math.max(0, riskScore));

        // Determination
        let riskLevel = 'low';
        let verdictKey = 'verdict_safe';
        let color = '#10b981'; // Green

        if (riskScore >= 75) {
            riskLevel = 'high';
            verdictKey = 'verdict_critical';
            color = '#ef4444';
        } else if (riskScore >= 40) {
            riskLevel = 'medium';
            verdictKey = 'verdict_suspicious';
            color = '#f59e0b';
        }

        // If no categories but some risk, default to general suspicion logic or reset
        if (detectedCategories.length === 0 && riskScore > 30) {
            detectedCategories.push("cat_suspicious");
        }
        if (detectedCategories.length === 0) {
            detectedCategories.push("cat_none");
        }

        return {
            riskScore: Math.round(riskScore),
            riskLevel: riskLevel,
            verdictKey: verdictKey,
            categories: [...new Set(detectedCategories)], // Array of keys
            triggers: triggers.slice(0, 5), // Top 5 triggers
            color: color
        };
    }

    function generateReportHTML(analysis) {
        // Safe access to t() just in case
        const t = window.t || ((k) => k);

        // Translate Categories
        const categoryNames = analysis.categories.map(catKey => t(catKey)).join(', ');
        const verdictText = t(analysis.verdictKey);

        const triggerList = analysis.triggers.map(t => `<span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace;">${t}</span>`).join(' ');

        return `
<div style="font-family: 'JetBrains Mono', monospace; display: flex; flex-direction: column; gap: 10px;">
    <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold; font-size: 1.1em;">${t('report_title')}</span>
        <span style="font-size: 0.9em; opacity: 0.7;">${t('report_id')}: ${Date.now().toString().slice(-6)}</span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
        <div>
            <div style="font-size: 0.8em; opacity: 0.7;">${t('report_risk_level')}</div>
            <div style="font-size: 1.4em; font-weight: bold; color: ${analysis.color};">${analysis.riskScore}%</div>
        </div>
        <div>
            <div style="font-size: 0.8em; opacity: 0.7;">${t('report_verdict')}</div>
            <div style="font-size: 1em; font-weight: bold; color: ${analysis.color};">${verdictText}</div>
        </div>
    </div>

    <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
        <div style="font-size: 0.8em; opacity: 0.7; margin-bottom: 5px;">${t('report_categories')}:</div>
        <div style="color: var(--text-primary);">${categoryNames}</div>
    </div>

    ${analysis.triggers.length > 0 ? `
    <div>
        <div style="font-size: 0.8em; opacity: 0.7; margin-bottom: 5px;">${t('report_triggers')}:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 5px;">${triggerList}</div>
    </div>
    ` : ''}

    <div style="font-size: 0.85em; opacity: 0.8; margin-top: 5px; border-left: 2px solid ${analysis.color}; padding-left: 10px;">
        ${getAdvice(analysis)}
    </div>
</div>
        `;
    }

    function getAdvice(analysis) {
        const t = window.t || ((k) => k);

        // 1. Try to find specific advice for the detected category
        // E.g., if we have 'cat_phishing', look for 'advice_phishing'
        // analysis.categories contains keys like 'cat_phishing', 'cat_investment'

        for (const catKey of analysis.categories) {
            // Convert 'cat_phishing' -> 'advice_phishing'
            const adviceKey = catKey.replace('cat_', 'advice_');
            const translatedAdvice = t(adviceKey);

            // Check if translation exists and isn't just the key returned back
            if (translatedAdvice && translatedAdvice !== adviceKey) {
                return translatedAdvice;
            }
        }

        // 2. Fallback to general advice based on risk level
        if (analysis.riskLevel === 'high') return t('advice_high_general');
        if (analysis.riskLevel === 'medium') return t('advice_medium_general');
        return t('advice_low_general');
    }

    function appendMessage(sender, html, riskLevel = 'low', isHtml = false) {
        const div = document.createElement('div');
        div.classList.add('message', sender === 'user' ? 'message-user' : 'message-ai');

        if (sender === 'ai' && riskLevel) {
            div.classList.add(`risk-border-${riskLevel}`);
        }

        if (isHtml || sender === 'ai') {
            div.innerHTML = html;
        } else {
            div.textContent = html;
        }

        chatHistory.appendChild(div);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.classList.add('message', 'message-ai', 'typing-indicator');
        div.innerHTML = '<span></span><span></span><span></span>';
        chatHistory.appendChild(div);
        scrollToBottom();
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        });
    }
});


