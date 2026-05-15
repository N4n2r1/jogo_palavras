// Seleção dos elementos do DOM
const setupContainer = document.getElementById('setup-container');
const gameContainer = document.getElementById('game-container');
const wordDisplay = document.getElementById('word-display');
const gameMessage = document.getElementById('game-message');
const errorCount = document.getElementById('error-count');
const resetBtn = document.getElementById('reset-btn');
const hintToast = document.getElementById('hint-toast');
const hintTextContent = document.getElementById('hint-text-content');

const URL_API = "https://api-palavras-8ptt.onrender.com";

// Efeitos sonoros
const somAcerto = new Audio('corr.mp3');
const somErro = new Audio('err.mp3');

somAcerto.volume = 0.5;
somErro.volume = 0.5;

// =========================================================
// DICIONÁRIO SECRETO (Para descriptografar a palavra pela dica)
// Mapeie aqui as dicas da sua API e as respectivas respostas!
// =========================================================
const BANCO_DE_PALAVRAS_REVELADAS = {
    "DEPOSITO DE BEBIDA": "ADEGA",
    "INSTITUICAO FINANCEIRA OU ASSENTO LONGO": "BANCO",
    "ANIMAL LATIDO": "CACHORRO",
    "FRUTA AMARELA": "BANANA",
    "OBJETO PARA ESCREVER": "CANETA"
    // Adicione mais aqui se lembrar de outras dicas da sua API!
};

// Função para remover acentos e facilitar a comparação das dicas
function limparTexto(texto) {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

// Função para iniciar o jogo
async function iniciarJogo(event) {
    if (event && event.key !== "Enter") return;

    const nickname = document.getElementById('nickname-input').value;

    if (!nickname) {
        alert('Preencha o nickname!');
        return;
    }

    try {
        const response = await fetch(`${URL_API}/iniciar`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: nickname })
        });

        const data = await response.json();

        if (data.erro) {
            alert(data.erro);
            return;
        }

        setupContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        document.getElementById('player-display').innerText = data.mensagem;

        buscarPalavra();
    } catch (error) {
        console.error("Erro ao iniciar o jogo:", error);
    }
}

// Função para buscar o status da palavra secreta e exibir a dica
async function buscarPalavra() {
    try {
        const response = await fetch(`${URL_API}/status`, {
            credentials: 'include',
            method: 'GET'
        });

        const data = await response.json();

        wordDisplay.innerHTML = '';

        for (let i = 0; i < data.qtde_caracteres; i++) {
            const span = document.createElement('span');
            span.className = 'letter-slot';
            span.id = `slot-${i}`;
            wordDisplay.appendChild(span);
        }

        if (data.dica) {
            hintTextContent.innerText = data.dica.toUpperCase();
            hintToast.classList.add('show');
        }

    } catch (error) {
        console.error("Erro ao buscar a palavra:", error);
    }
}

// Função para processar a tentativa de letra
// Função para processar a tentativa de letra e descobrir a palavra certa na marra!
// Função para processar a tentativa de letra e descobrir a palavra por cruzamento inteligente
// Função para processar a tentativa de letra e desvendar o tabuleiro via alfabeto se perder
// Função para processar a tentativa de letra
async function tentarLetra(event) {
    if (event.key === "Enter") {
        const input = document.getElementById('letter-input');
        const caractere = input.value;
        input.value = '';
        input.focus();

        if (!caractere) {
            alert("Digite uma letra!");
            return;
        }

        try {
            // Guarda o número de erros antes da nova tentativa para comparar depois
            const errosAntes = parseInt(errorCount.innerText) || 0;

            const response = await fetch(`${URL_API}/tentativa`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ caractere: caractere })
            });

            const data = await response.json();

            // Preenche as letras encontradas nas posições corretas
            if (data.posicoes && data.posicoes.length > 0) {
                data.posicoes.forEach(pos => {
                    const slot = document.getElementById(`slot-${pos}`);
                    if (slot) slot.innerText = caractere.toUpperCase();
                });
            }

            // --- LÓGICA DOS EFEITOS SONOROS ---
            if (data.erros_atuais > errosAntes) {
                somErro.currentTime = 0; 
                somErro.play();
            } else if (data.posicoes && data.posicoes.length > 0) {
                somAcerto.currentTime = 0;
                somAcerto.play();
            }

            // Atualiza os contadores de erro na tela
            errorCount.innerText = data.erros_atuais;
            gameMessage.innerText = data.mensagem;

            // Atualiza visualmente os corações do HTML com base nos erros
            atualizarCoracoes(data.erros_atuais);

            // Verifica o fim do jogo
            if (data.status_jogo !== 'Jogando') {
                resetBtn.classList.remove('hidden');
                input.disabled = true; // Bloqueia o campo de digitação

                document.body.classList.remove('retro-win', 'retro-lose');

                if (data.status_jogo === 'Derrota') {
                    gameMessage.style.color = '#ef4444'; 
                    document.body.classList.add('retro-lose');
                    
                    // Lê o dado enviado pelo seu novo ajuste no back-end
                    const palavraCerta = data.palavra_correta || data.palavra || '';

                    if (palavraCerta) {
                        // Exibe a resposta correta no letreiro de forma estilizada
                        gameMessage.innerHTML = `GAME OVER!<br>A PALAVRA ERA: <span style="color: #fff; background-color: #ef4444; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 5px;">${palavraCerta.toUpperCase()}</span>`;
                        
                        // Preenche visualmente os slots vazios para revelar o tabuleiro completo
                        const slots = document.querySelectorAll('.letter-slot');
                        for (let i = 0; i < slots.length; i++) {
                            if (!slots[i].innerText || slots[i].innerText.trim() === "") {
                                slots[i].innerText = palavraCerta[i].toUpperCase();
                                slots[i].style.color = "#ef4444"; // Letras reveladas ficam em destaque vermelho
                                slots[i].style.borderColor = "#ef4444";
                            }
                        }
                    } else {
                        // Fallback de segurança caso o deploy do back-end ainda não tenha rodado
                        gameMessage.innerHTML = `GAME OVER!<br><span style="color: #fff; background-color: #ef4444; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-top: 5px;">SISTEMA INDISPONÍVEL</span>`;
                    }

                } else {
                    gameMessage.innerText = "PARABÉNS! VOCÊ VENCEU!";
                    gameMessage.style.color = '#22c55e'; 
                    document.body.classList.add('retro-win');
                }
                
                setTimeout(() => {
                    document.body.classList.remove('retro-win', 'retro-lose');
                }, 2000);
            }
        } catch (error) {
            console.error("Erro ao processar a letra:", error);
        }
    }
}

// Função auxiliar para apagar os corações conforme os erros aumentam
function atualizarCoracoes(erros) {
    const hearts = document.querySelectorAll('#hearts-display .heart-icon');
    hearts.forEach((heart, index) => {
        if (index < erros) {
            heart.style.opacity = '0.2';
            heart.style.filter = 'grayscale(100%)';
        } else {
            heart.style.opacity = '1';
            heart.style.filter = 'none';
        }
    });
}

function reiniciarJogo() {
    location.reload();
}