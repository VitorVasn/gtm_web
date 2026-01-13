const BACKEND_URL = "https://gtm-backend-8mh0.onrender.com/api";

let gtms = [];
let servicoAtual = null;
let intervalo = null;
let comandoLogado = false;
let avisos = [];

// ====================== CARREGAR GTMS ======================
async function carregarGTMs() {
  try {
    const res = await fetch(`${BACKEND_URL}/gtms`);
    if (!res.ok) throw new Error("Erro ao buscar GTMs");
    gtms = await res.json();
    atualizarRanking();
  } catch (err) {
    console.error("Erro ao carregar GTMs:", err);
  }
}

// ====================== CADASTRO ======================
async function cadastrarGTM() {
  const posto = document.getElementById("posto").value;
  const nome = document.getElementById("nomeGuerra").value;
  const passaporte = document.getElementById("passaporte").value;
  const funcao = document.getElementById("funcao").value;

  if (!posto || !nome || !passaporte || !funcao) {
    alert("Preencha todos os campos!");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/gtm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posto, nome, passaporte, funcao })
    });
    const data = await res.json();
    if (data.success) {
      alert("GTM cadastrado com sucesso!");
      document.getElementById("posto").value = "";
      document.getElementById("nomeGuerra").value = "";
      document.getElementById("passaporte").value = "";
      document.getElementById("funcao").value = "";
      carregarGTMs();
    } else {
      alert(data.error || "Erro ao cadastrar GTM");
    }
  } catch (err) {
    console.error("Erro ao cadastrar GTM:", err);
    alert("Erro ao cadastrar GTM. Verifique o console.");
  }
}

// ====================== INICIAR / FINALIZAR SERVIÇO ======================
function iniciarServico() {
  const passaporte = document.getElementById("passaporteServico").value;
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
    const data = await res.json();
    if (data.success) {
      alert("Serviço finalizado!");
      servicoAtual = null;
      pararCronometro();
      carregarGTMs();
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

// ====================== QRT / ACOMPANHAMENTO / PRISÃO ======================
async function registrarQRT() {
  const passaporte = document.getElementById("qrtPassaporte").value;
  const quantidade = parseInt(document.getElementById("qrtQuantidade").value);
  if (!passaporte || !quantidade) return alert("Preencha os campos corretamente!");

  try {
    const res = await fetch(`${BACKEND_URL}/pontuar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passaporte, pontos: quantidade })
    });
    const data = await res.json();
    if (data.success) {
      alert("QRT registrado!");
      carregarGTMs();
    }
  } catch (err) {
    console.error(err);
  }
}

async function registrarAcompanhamento() {
  const passaporte = document.getElementById("acompPassaporte").value;
  const status = document.getElementById("acompStatus").value;
  if (!passaporte || !status) return alert("Preencha os campos corretamente!");

  try {
    const res = await fetch(`${BACKEND_URL}/registrar-acomp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passaporte, status })
    });
    const data = await res.json();
    if (data.success) {
      alert("Acompanhamento registrado!");
      carregarGTMs();
    }
  } catch (err) {
    console.error(err);
  }
}

async function registrarPrisao() {
  const passaporteGTM = document.getElementById("prisaoPassaporteGTM").value;
  const nomePreso = document.getElementById("nomePreso").value;
  const passaportePreso = document.getElementById("passaportePreso").value;
  const qtd = parseInt(document.getElementById("qtdPresos").value);
  if (!passaporteGTM || !nomePreso || !passaportePreso || !qtd) return alert("Preencha todos os campos!");

  try {
    const res = await fetch(`${BACKEND_URL}/registrar-prisao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passaporteGTM, nomePreso, passaportePreso, qtd })
    });
    const data = await res.json();
    if (data.success) {
      alert("Prisão registrada!");
      carregarGTMs();
    }
  } catch (err) {
    console.error(err);
  }
}

// ====================== PAINEL COMANDO ======================
const SENHA_COMANDO = "gtm2025";

async function entrarPainel() {
  const senha = document.getElementById("senhaComando").value;
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
  const passaporte = document.getElementById("passaporteExonerar").value;
  try {
    const res = await fetch(`${BACKEND_URL}/gtm/${passaporte}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      alert("GTM exonerado!");
      carregarGTMs();
    }
  } catch (err) {
    console.error(err);
  }
}

// ====================== AVISOS ======================
async function enviarAviso() {
  const texto = document.getElementById("avisoTexto").value;
  if (!texto) return alert("Digite o aviso!");
  try {
    const res = await fetch(`${BACKEND_URL}/avisos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto, data: new Date().toLocaleString() })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("avisoTexto").value = "";
      carregarAvisos();
      alert("Aviso enviado!");
    }
  } catch (err) {
    console.error(err);
  }
}

async function carregarAvisos() {
  try {
    const res = await fetch(`${BACKEND_URL}/avisos`);
    avisos = await res.json();
    const ul = document.getElementById("listaAvisos");
    ul.innerHTML = "";
    avisos.forEach((a, index) => {
      const li = document.createElement("li");
      const botoes = comandoLogado ? `<br><button onclick="apagarAviso(${index})">Apagar</button>` : "";
      li.innerHTML = `<strong>${a.data}</strong><br>${a.texto}${botoes}`;
      ul.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

async function apagarAviso(index) {
  if (!comandoLogado) return alert("Acesso negado!");
  const aviso = avisos[index];
  try {
    const res = await fetch(`${BACKEND_URL}/avisos/${aviso.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) carregarAvisos();
  } catch (err) {
    console.error(err);
  }
}

// ====================== ZERAR PONTOS ======================
async function zerarRanking() {
  if (!comandoLogado) return alert("Acesso negado!");
  try {
    const res = await fetch(`${BACKEND_URL}/zerar`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      alert("Ranking zerado!");
      carregarGTMs();
    }
  } catch (err) {
    console.error(err);
  }
}

// ====================== INICIALIZAÇÃO ======================
carregarGTMs();
carregarAvisos();
