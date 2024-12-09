class GeminiChatbot {
    constructor() {
        this.API_KEY = 'AIzaSyDn27wJ_mKhE-eB1XV89IKEddA74MokCHo';
        this.destinations = [
            {
                name: "Batu Night Spectacular (BNS)",
                lat: -7.8753,
                lon: 112.5286,
                category: "hiburan",
                description: "Tempat wisata malam dengan berbagai wahana dan hiburan"
            },
            {
                name: "Gunung Bromo",
                lat: -7.9425,
                lon: 112.9530,
                category: "alam",
                description: "Gunung berapi terkenal dengan keindahan panoramanya"
            },
            {
                name: "Jatim Park 2",
                lat: -7.8831,
                lon: 112.5286,
                category: "hiburan",
                description: "Taman bermain dan kebun binatang modern"
            },
            {
                name: "Coban Rondo",
                lat: -7.7303,
                lon: 112.4638,
                category: "alam",
                description: "Air terjun indah di lereng Gunung Panderman"
            },
            {
                name: "Museum Angkut",
                lat: -7.8831,
                lon: 112.5286,
                category: "budaya",
                description: "Museum transportasi terbesar di Indonesia"
            },
            {
                name: "Alun-alun Kota Malang",
                lat: -7.9825,
                lon: 112.6326,
                category: "budaya",
                description: "Pusat kota dengan suasana yang ramai dan menarik"
            },
            {
                name: "Kebun Teh Wonosari",
                lat: -7.9192,
                lon: 112.9473,
                category: "alam",
                description: "Perkebunan teh dengan pemandangan hijau menakjubkan"
            }
        ];
        this.createChatbotUI();
        this.setupEventListeners();
        this.conversationHistory = [];
    }

    createChatbotUI() {
        const chatbotHTML = `
            <div id="chatbot-container">
                <button id="chatbot-toggle">💬</button>
                <div id="chatbot-window">
                    <div id="chatbot-messages"></div>
                    <div id="chatbot-input-area">
                        <input type="text" id="chatbot-input" placeholder="Tanya tentang destinasi...">
                        <button id="chatbot-send">Kirim</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    }

    setupEventListeners() {
        const toggle = document.getElementById('chatbot-toggle');
        const chatWindow = document.getElementById('chatbot-window');
        const send = document.getElementById('chatbot-send');
        const input = document.getElementById('chatbot-input');

        toggle.addEventListener('click', () => {
            const isVisible = chatWindow.style.display === 'block';
            chatWindow.style.display = isVisible ? 'none' : 'block';
            if (!isVisible && this.conversationHistory.length === 0) {
                this.addBotMessage("Hai! Saya adalah asisten perjalanan. Ingin rekomendasi wisata di Malang?");
            }
        });

        send.addEventListener('click', () => this.handleMessage());
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleMessage();
        });
    }

    async handleMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();
        if (!message) return;

        this.addUserMessage(message);
        input.value = '';

        const lowercaseMsg = message.toLowerCase();
        if (lowercaseMsg.includes('rekomendasi') || lowercaseMsg.includes('wisata')) {
            this.recommendDestinations();
        } else if (lowercaseMsg.includes('alam')) {
            this.recommendDestinationsByCategory('alam');
        } else if (lowercaseMsg.includes('budaya')) {
            this.recommendDestinationsByCategory('budaya');
        } else if (lowercaseMsg.includes('hiburan')) {
            this.recommendDestinationsByCategory('hiburan');
        } else {
            try {
                const response = await this.getGeminiResponse(message);
                this.processResponse(response);
            } catch (error) {
                console.error('Error:', error);
                this.addBotMessage("Maaf, terjadi kesalahan. Silakan coba lagi.");
            }
        }
    }

    async getGeminiResponse(message) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    role: 'user',
                    parts: [{ text: `Context: I am a travel assistant for Malang tourism. Available destinations: ${this.destinations.map(d => d.name).join(', ')}. User message: ${message}` }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 256
                }
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    processResponse(response) {
        this.addBotMessage(response);
        const mentionedDest = this.destinations.find(dest => 
            response.toLowerCase().includes(dest.name.toLowerCase())
        );
        if (mentionedDest) {
            this.suggestReservation(mentionedDest);
        }
    }

    recommendDestinations() {
        const randomDests = [...this.destinations]
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);

        this.addBotMessage("Berikut rekomendasi destinasi wisata di Malang:");
        randomDests.forEach(dest => {
            this.addBotMessage(`${dest.name} (${dest.category}): ${dest.description}`);
        });
        this.suggestReservation(randomDests[0]);
    }

    recommendDestinationsByCategory(category) {
        const filteredDests = this.destinations.filter(d => d.category === category);
        
        if (filteredDests.length === 0) {
            this.addBotMessage(`Maaf, tidak ada destinasi dalam kategori ${category}.`);
            return;
        }

        this.addBotMessage(`Destinasi wisata kategori ${category}:`);
        filteredDests.forEach(dest => {
            this.addBotMessage(`${dest.name}: ${dest.description}`);
        });
        if (filteredDests.length > 0) {
            this.suggestReservation(filteredDests[0]);
        }
    }

    addUserMessage(text) {
        const div = document.createElement('div');
        div.className = 'chatbot-message user-message';
        div.textContent = text;
        document.getElementById('chatbot-messages').appendChild(div);
        this.scrollToBottom();
    }

    addBotMessage(text) {
        const div = document.createElement('div');
        div.className = 'chatbot-message bot-message';
        div.textContent = text;
        document.getElementById('chatbot-messages').appendChild(div);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messages = document.getElementById('chatbot-messages');
        messages.scrollTop = messages.scrollHeight;
    }

    suggestReservation(destination) {
        const div = document.createElement('div');
        div.className = 'destination-card';
        div.innerHTML = `
            <h4>${destination.name}</h4>
            <p>${destination.description}</p>
            <a href="reserve.html?destination=${encodeURIComponent(destination.name)}" 
               class="button button--flex">
                Reservasi <i class="ri-arrow-right-line"></i>
            </a>
        `;
        document.getElementById('chatbot-messages').appendChild(div);
        localStorage.setItem('selectedDestination', JSON.stringify(destination));
        this.scrollToBottom();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GeminiChatbot();
});