// ============================
// ELEMENTOS DA TELA
// ============================

const setupContainer = document.getElementById('setup-container')
const gameContainer = document.getElementById('game-container')

const wordDisplay = document.getElementById('word-display')

const gameMessage = document.getElementById('game-message')

const errorCount = document.getElementById('error-count')

const resetBtn = document.getElementById('reset-btn')

const hintText = document.getElementById('hint-text-content')

// ============================
// DIFICULDADE
// ============================

let dificuldadeSelecionada = 'facil'

// ============================
// AUDIOS
// ============================

const somAcerto = new Audio('corr.mp3')
const somErro = new Audio('err.mp3')

somAcerto.volume = 0.6
somErro.volume = 0.6

// ============================
// API
// ============================

const URL_API = 'https://api-palavras-8ptt.onrender.com'

// ============================
// SELECIONAR DIFICULDADE
// ============================

function selecionarDificuldade(nivel, botao) {

    dificuldadeSelecionada = nivel

    document.querySelectorAll('.difficulty-btn')
        .forEach(btn => {
            btn.classList.remove('selected')
        })

    botao.classList.add('selected')
}

// ============================
// INICIAR JOGO
// ============================

async function iniciarJogo(event) {

    if (event.key == 'Enter') {

        const nickname = document.getElementById('nickname-input').value

        if (!nickname) {

            alert('Preencha o nickname para prosseguir')
            return
        }

        try {

            const response = await fetch(`${URL_API}/iniciar`, {

                method: 'POST',

                credentials: 'include',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({

                    nickname: nickname,

                    nivel: dificuldadeSelecionada
                })
            })

            const data = await response.json()

            if (data.erro) {

                alert(data.erro)
                return
            }

            setupContainer.classList.add('hidden')

            gameContainer.classList.remove('hidden')

            document.getElementById('player-display').innerText =
                `${data.mensagem} | ${dificuldadeSelecionada.toUpperCase()}`

            buscarPalavra()

        } catch (erro) {

            alert('Erro ao iniciar o jogo')

            console.error(erro)
        }
    }
}

// ============================
// BUSCAR PALAVRA
// ============================

async function buscarPalavra() {

    try {

        const response = await fetch(`${URL_API}/status`, {

            credentials: 'include',

            method: 'GET'
        })

        const data = await response.json()

        wordDisplay.innerHTML = ''

        hintText.innerText = `DICA: ${data.dica}`

        // ============================
        // CRIAR ESPAÇOS
        // ============================

        for (let i = 0; i < data.qtde_caracteres; i++) {

            const span = document.createElement('span')

            span.className = 'letter-slot'

            span.id = `slot-${i}`

            wordDisplay.appendChild(span)
        }

    } catch (erro) {

        alert('Erro ao buscar palavra')

        console.error(erro)
    }
}

// ============================
// TENTAR LETRA
// ============================

async function tentarLetra(event) {

    if (event.key == "Enter") {

        const input = document.getElementById('letter-input')

        const caractere = input.value.toLowerCase()

        input.value = ''

        input.focus()

        if (!caractere) {

            alert('Digite um caractere para jogar!')

            return
        }

        try {

            const response = await fetch(`${URL_API}/tentativa`, {

                method: 'POST',

                credentials: 'include',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    caractere: caractere
                })
            })

            const data = await response.json()

            // ============================
            // SOM
            // ============================

            if (data.posicoes.length > 0) {

                somAcerto.currentTime = 0

                somAcerto.play()

            } else {

                somErro.currentTime = 0

                somErro.play()
            }

            // ============================
            // MOSTRAR LETRAS
            // ============================

            data.posicoes.forEach(pos => {

                document.getElementById(`slot-${pos}`).innerText =
                    caractere.toUpperCase()
            })

            // ============================
            // STATUS
            // ============================

            errorCount.innerText = data.erros_atuais

            gameMessage.innerText = data.mensagem

            // ============================
            // FIM DE JOGO
            // ============================

            if (data.status_jogo != 'Jogando') {

                resetBtn.classList.remove('hidden')

                input.disabled = true

                // ============================
                // DERROTA
                // ============================

                if (data.status_jogo == 'Derrota') {

                    gameMessage.style.color = '#ff6b6b'

                    document.body.classList.add('lose')

                    // MOSTRAR PALAVRA

                    if (data.palavra) {

                        wordDisplay.innerHTML = ''

                        data.palavra.split('').forEach(letra => {

                            const span = document.createElement('span')

                            span.className = 'letter-slot'

                            span.innerText = letra.toUpperCase()

                            wordDisplay.appendChild(span)
                        })
                    }

                    gameMessage.innerText +=
                        ` | Palavra: ${data.palavra}`
                }

                // ============================
                // VITÓRIA
                // ============================

                else {

                    gameMessage.style.color = '#7dff98'

                    document.body.classList.add('win')
                }
            }

        } catch (erro) {

            alert('Erro ao enviar tentativa')

            console.error(erro)
        }
    }
}

// ============================
// REINICIAR
// ============================

function reiniciarJogo() {

    location.reload()
}