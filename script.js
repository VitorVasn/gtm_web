const BACKEND_URL = "https://gtm-backend-8mh0.onrender.com/api";

let gtms = [];
let avisos = [];
let comandoLogado = false;
let servicoAtual = null;
let intervalo = null;

const SENHA_COMANDO = "gtm2025";

// ====================== UTIL ======================
async function tratarResposta(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("Resposta inválida:", text);
    return {};
  }
}

// ====================== AUTO UPDATE ======================
function autoAtualizar() {
  carregarGTMs();
  carregarAvisos();
}
setInterval(autoAtualizar, 5000); // a cada 5s

// ====================== GTMS ======================
async function carregarGTMs() {
  try {
    const res = await fetch(`${BACKEND_URL}/gtms`);
    gtms = await tratarResposta(res);
    atualizarRanking();
  } catch (err) {
    console.error("Erro ao carregar GTMs:", err);
  }
}

async function cadastrarGTM() {
  const posto = document.getElementById("posto").value.trim();
  const nome = document.getElementById("nomeGuerra").value.trim();
  const passaporte = document.getElementById("passaporte").value.trim();
  const funcao = document.getElementById("funcao").value.trim();

  if (!posto || !nome || !passaporte || !funcao) {
    alert("Preencha todos os campos!");
    return;
  }

  const payload = { posto, nome, passaporte, funcao };

  try {
    const res = await fetch(`${BACKEND_URL}/gtm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await tratarResposta(res);

    if (data.success) {
      alert("GTM cadastrado com sucesso!");
      document.getElementById("posto").value = "";
      document.getElementById("nomeGuerra").value = "";
      document.getElementById("passaporte").value = "";
      document.getElementById("funcao").value = "";
      carregarGTMs();
    } else {
      alert(data.mensagem || "Erro ao cadastrar (possivelmente já existe)");
      carregarGTMs();
    }

  } catch (err) {
    console.error("Erro cadastro:", err);
  }
}

// ====================== RANKING ======================
function atualizarRanking() {
  const tbody = document.getElementById("ranking");
  tbody.innerHTML = "";

  const ordenado = [...gtms].sort((a, b) => b.horas - a.horas || b.pontos - a.pontos);

  ordenado.forEach(g => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${g.posto}</td>
      <td>${g.nome}</td>
      <td>${g.passaporte}</td>
      <td>${g.horas.toFixed(2)} h</td>
      <td>${g.pontos}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ====================== SERVIÇO ======================
function iniciarServico() {
  const passaporte = document.getElementById("passaporteServico").value.trim();
  const gtm = gtms.find(g => g.passaporte === passaporte);

  if (!gtm) return alert("GTM não encontrado!");
  if (servicoAtual) return alert("Já existe serviço em andamento!");

  servicoAtual = { passaporte, inicio: Date.now() };
  iniciarCronometro();
}

async function finalizarServico() {
  if (!servicoAtual) return alert("Nenhum serviço em andamento!");

  const duracaoHoras = (Date.now() - servicoAtual.inicio) / 3600000;
  const payload = { passaporte: servicoAtual.passaporte, duracaoHoras };

  try {
    const res = await fetch(`${BACKEND_URL}/finalizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await tratarResposta(res);

    if (data.success) {
      alert("Serviço finalizado!");
      servicoAtual = null;
      pararCronometro();
      carregarGTMs();
    } else alert("Erro ao finalizar serviço");

  } catch (err) {
    console.error("Erro finalizar:", err);
  }
}

// ====================== CRONÔMETRO ======================
function iniciarCronometro() {
  const inicio = Date.now();
  intervalo = setInterval(() => {
    const diff = Date.now() - inicio;
    const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    document.getElementById("cronometro").innerText = `${h}:${m}:${s}`;
  }, 1000);
}

function pararCronometro() {
  clearInterval(intervalo);
  document.getElementById("cronometro").innerText = "00:00:00";
}

// ====================== PAINEL COMANDO ======================
function entrarPainel() {
  const senha = document.getElementById("senhaComando").value.trim();
  if (senha === SENHA_COMANDO) {
    comandoLogado = true;
    document.getElementById("painelComando").style.display = "block";
    alert("Acesso liberado!");
    carregarAvisos();
  } else alert("Senha incorreta!");
}

function fecharPainel() {
  comandoLogado = false;
  document.getElementById("painelComando").style.display = "none";
  document.getElementById("senhaComando").value = "";
  carregarAvisos();
}

// ====================== AVISOS ======================
async function enviarAviso() {
  const texto = document.getElementById("avisoTexto").value.trim();
  if (!texto) return alert("Digite o aviso!");

  try {
    const res = await fetch(`${BACKEND_URL}/avisos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, data: new Date().toLocaleString() })
    });

    const data = await tratarResposta(res);

    if (data.success) {
      document.getElementById("avisoTexto").value = "";
      carregarAvisos();
    }

  } catch (err) {
    console.error("Erro aviso:", err);
  }
}

async function carregarAvisos() {
  try {
    const res = await fetch(`${BACKEND_URL}/avisos`);
    avisos = await tratarResposta(res);

    const ul = document.getElementById("listaAvisos");
    ul.innerHTML = "";

    avisos.forEach((a, index) => {
      const li = document.createElement("li");

      let botoes = "";
      if (comandoLogado) {
        botoes = `
          <div style="margin-top:6px;">
            <button onclick="editarAviso(${index})">✏️</button>
            <button onclick="apagarAviso(${index})">🗑️</button>
          </div>
        `;
      }

      li.innerHTML = `
        <strong>${a.data}</strong><br>
        ${a.texto}
        ${botoes}
      `;
      ul.appendChild(li);
    });

  } catch (err) {
    console.error("Erro carregar avisos:", err);
  }
}

async function editarAviso(index) {
  if (!comandoLogado) return;
  const aviso = avisos[index];
  const novoTexto = prompt("Editar aviso:", aviso.texto);
  if (!novoTexto) return;

  try {
    const res = await fetch(`${BACKEND_URL}/avisos/${aviso.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: novoTexto })
    });

    const data = await tratarResposta(res);
    if (data.success) carregarAvisos();

  } catch (err) {
    console.error("Erro editar aviso:", err);
  }
}

async function apagarAviso(index) {
  if (!comandoLogado) return;
  if (!confirm("Excluir este aviso?")) return;

  const aviso = avisos[index];

  try {
    const res = await fetch(`${BACKEND_URL}/avisos/${aviso.id}`, { method: "DELETE" });
    const data = await tratarResposta(res);
    if (data.success) carregarAvisos();
  } catch (err) {
    console.error("Erro apagar aviso:", err);
  }
}

async function apagarTodosAvisos() {
  if (!comandoLogado) return;
  if (!confirm("Excluir TODOS os avisos?")) return;

  try {
    const res = await fetch(`${BACKEND_URL}/avisos`, { method: "DELETE" });
    const data = await tratarResposta(res);
    if (data.success) carregarAvisos();
  } catch (err) {
    console.error("Erro apagar todos avisos:", err);
  }
}

// ====================== ZERAR RANKING ======================
async function zerarRanking() {
  if (!comandoLogado) return;
  if (!confirm("Zerar TODO o ranking?")) return;

  try {
    const res = await fetch(`${BACKEND_URL}/zerar`, { method: "POST" });
    const data = await tratarResposta(res);
    if (data.success) carregarGTMs();
  } catch (err) {
    console.error("Erro zerar ranking:", err);
  }
}

// ====================== INIT ======================
carregarGTMs();
carregarAvisos();
