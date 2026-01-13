const BACKEND_URL = "https://gtm-backend-8mh0.onrender.com/api";

let gtms = [];
let servicoAtual = null;
let intervalo = null;
let comandoLogado = false;
let avisos = [];

// ====================== UTIL ======================
function tratarResposta(res) {
  return res.text().then(text => {
    try {
      return JSON.parse(text);
    } catch {
      console.error("Resposta do backend não é JSON válido:", text);
      throw new Error("Resposta do backend não é JSON válido");
    }
  });
}

// ====================== CARREGAR GTMS ======================
async function carregarGTMs() {
  try {
    const res = await fetch(`${BACKEND_URL}/gtms`);
    if (!res.ok) throw new Error(`Erro ao buscar GTMs: ${res.status}`);
    gtms = await tratarResposta(res);
    atualizarRanking();
  } catch (err) {
    console.error("Erro ao carregar GTMs:", err);
  }
}

// ====================== CADASTRO ======================
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
  console.log("Enviando para backend:", payload);

  try {
    const res = await fetch(`${BACKEND_URL}/gtm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await tratarResposta(res);
    if (data.success) {
      alert("GTM cadastrado com sucesso!");
      ["posto", "nomeGuerra", "passaporte", "funcao"].forEach(id => document.getElementById(id).value = "");
      carregarGTMs();
    } else {
      alert(data.error || "Erro ao cadastrar GTM");
    }
  } catch (err) {
    console.error("Erro ao cadastrar GTM:", err);
    alert("Erro ao cadastrar GTM. Veja o console.");
  }
}

// ====================== INICIAR / FINALIZAR SERVIÇO ======================
function iniciarServico() {
  const passaporte = document.getElementById("passaporteServico").value.trim();
  const gtm = gtms.find(g => g.passaporte === passaporte);
  if (!gtm) return alert("GTM não encontrado!");
  if (servicoAtual) return alert("Já existe um serviço em andamento!");

  servicoAtual = { passaporte, inicio: Date.now() };
  iniciarCronometro();
}

async function finalizarServico() {
  if (!servicoAtual) return alert("Nenhum serviço em andamento!");
  const duracaoHoras = (Date.now() - servicoAtual.inicio) / (1000 * 60 * 60);

  try {
    const res = await fetch(`${BACKEND_URL}/finalizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passaporte: servicoAtual.passaporte, duracaoHoras })
    });

    const data = await tratarResposta(res);
    if (data.success) {
      alert("Serviço finalizado!");
      servicoAtual = null;
      pararCronometro();
      carregarGTMs();
    } else {
      alert(data.error || "Erro ao finalizar serviço");
    }
  } catch (err) {
    console.error("Erro ao finalizar serviço:", err);
  }
}

// ====================== CRONÔMETRO ======================
function iniciarCronometro() {
  const inicio = Date.now();
  intervalo = setInterval(() => {
    const diff = Date.now() - inicio;
    const horas = String(Math.floor(diff / 3600000)).padStart(2, "0");
    const minutos = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
    const segundos = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
    document.getElementById("cronometro").innerText = `${horas}:${minutos}:${segundos}`;
  }, 1000);
}

function pararCronometro() {
  clearInterval(intervalo);
  document.getElementById("cronometro").innerText = "00:00:00";
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
      <td>${g.horas.toFixed(2)} h</td>
      <td>${g.pontos}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ====================== PONTUAÇÃO / QRT / ACOMPANHAMENTO / PRISÃO ======================
async function registrarQRT() {
  const passaporte = document.getElementById("qrtPassaporte").value.trim();
  const quantidade = parseInt(document.getElementById("qrtQuantidade").value);
  if (!passaporte || !quantidade) return alert("Preencha os campos corretamente!");

  try {
    const res = await fetch(`${BACKEND_URL}/pontuar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passaporte, pontos: quantidade })
    });
    const data = await tratarResposta(res);
    if (data.success) {
      alert("QRT registrado!");
      carregarGTMs();
    }
  } catch (err) {
    console.error("Erro ao registrar QRT:", err);
  }
}

async function registrarAcompanhamento() {
  const passaporte = document.getElementById("acompPassaporte").value.trim();
  const status = document.getElementById("acompStatus").value.trim();
  if (!passaporte || !status) return alert("Preencha os campos corretamente!");

  try {
    const res = await fetch(`${BACKEND_URL}/registrar-acomp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passaporte, status })
    });
    const data = await tratarResposta(res);
    if (data.success) {
      alert("Acompanhamento registrado!");
      carregarGTMs();
    }
  } catch (err) {
    console.error("Erro ao registrar acompanhamento:", err);
  }
}

async function registrarPrisao() {
  const passaporteGTM = document.getElementById("prisaoPassaporteGTM").value.trim();
  const nomePreso = document.getElementById("nomePreso").value.trim();
  const passaportePreso = document.getElementById("passaportePreso").value.trim();
  const qtd = parseInt(document.getElementById("qtdPresos").value);
  if (!passaporteGTM || !nomePreso || !passaportePreso || !qtd) return alert("Preencha todos os campos!");

  try {
    const res = await fetch(`${BACKEND_URL}/registrar-prisao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passaporteGTM, nomePreso, passaportePreso, qtd })
    });
    const data = await tratarResposta(res);
    if (data.success) {
      alert("Prisão registrada!");
      carregarGTMs();
    }
  } catch (err) {
    console.error("Erro ao registrar prisão:", err);
  }
}

// ====================== PAINEL COMANDO ======================
const SENHA_COMANDO = "gtm2025";

async function entrarPainel() {
  const senha = document.getElementById("senhaComando").value.trim();
  if (senha === SENHA_COMANDO) {
    document.getElementById("painelComando").style.display = "block";
    comandoLogado = true;
    alert("Acesso liberado ao Painel do Comando!");
    carregarAvisos();
  } else alert("Senha incorreta!");
}

function fecharPainel() {
  document.getElementById("painelComando").style.display = "none";
  document.getElementById("senhaComando").value = "";
  comandoLogado = false;
  carregarAvisos();
}

async function exonerarGTM() {
  const passaporte = document.getElementById("passaporteExonerar").value.trim();
  if (!passaporte) return alert("Digite o passaporte!");
  try {
    const res = await fetch(`${BACKEND_URL}/gtm/${passaporte}`, { method: "DELETE" });
    const data = await tratarResposta(res);
    if (data.success) {
      alert("GTM exonerado!");
      carregarGTMs();
    }
  } catch (err) {
    console.error("Erro ao exonerar GTM:", err);
  }
}

// ====================== AVISOS ======================
async function enviarAviso() {
  const texto = document.getElementById("avisoTexto").value.trim();
  if (!texto) return alert("Digite o aviso!");

  const payload = { texto, data: new Date().toLocaleString() };
  try {
    const res = await fetch(`${BACKEND_URL}/avisos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await tratarResposta(res);
    if (data.success) {
      document.getElementById("avisoTexto").value = "";
      carregarAvisos();
      alert("Aviso enviado!");
    }
  } catch (err) {
    console.error("Erro ao enviar aviso:", err);
  }
}

async function carregarAvisos() {
  try {
    const res = await fetch(`${BACKEND_URL}/avisos`);
    avisos = await tratarResposta(res);

    const ul = document.getElementById("listaAvisos");
    ul.innerHTML = "";
    avisos.forEach((a, index) => {
      const botoes = comandoLogado ? `<br><button onclick="apagarAviso(${index})">Apagar</button>` : "";
      const li = document.createElement("li");
      li.innerHTML = `<strong>${a.data}</strong><br>${a.texto}${botoes}`;
      ul.appendChild(li);
    });
  } catch (err) {
    console.error("Erro ao carregar avisos:", err);
  }
}

async function apagarAviso(index) {
  if (!comandoLogado) return alert("Acesso negado!");
  const aviso = avisos[index];
  try {
    const res = await fetch(`${BACKEND_URL}/avisos/${aviso.id}`, { method: "DELETE" });
    const data = await tratarResposta(res);
    if (data.success) carregarAvisos();
  } catch (err) {
    console.error("Erro ao apagar aviso:", err);
  }
}

// ====================== ZERAR RANKING ======================
async function zerarRanking() {
  if (!comandoLogado) return alert("Acesso negado!");
  try {
    const res = await fetch(`${BACKEND_URL}/zerar`, { method: "POST" });
    const data = await tratarResposta(res);
    if (data.success) {
      alert("Ranking zerado!");
      carregarGTMs();
    }
  } catch (err) {
    console.error("Erro ao zerar ranking:", err);
  }
}

// ====================== INICIALIZAÇÃO ======================
carregarGTMs();
carregarAvisos();
