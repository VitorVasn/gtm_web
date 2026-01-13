const BACKEND_URL = "https://gtm-backend-8mh0.onrender.com/api";

let gtms = [];
let servicoAtual = null;
let intervalo = null;
let comandoLogado = false;
let avisos = [];

// ====================== UTIL ======================
async function tratarResposta(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error("Resposta do backend não é JSON válido:", text);
    throw new Error("Resposta do backend não é JSON válido");
  }
}

// ====================== CARREGAR GTMS ======================
async function carregarGTMs() {
  try {
    const res = await fetch(`${BACKEND_URL}/gtms`);
    if (!res.ok) throw new Error(`Erro ao buscar GTMs: ${res.status}`);
    gtms = await tratarResposta(res);
    console.log("GTMs carregados:", gtms);
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
    alert("Preencha todos os campos antes de cadastrar!");
    return;
  }

  const payload = { posto, nome, passaporte, funcao };
  console.log("Payload de cadastro:", payload);

  try {
    const res = await fetch(`${BACKEND_URL}/gtm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Status da resposta:", res.status);
    const dataText = await res.text();
    console.log("Resposta do backend:", dataText);

    let data;
    try {
      data = JSON.parse(dataText);
    } catch {
      alert("Erro: resposta do backend não é JSON válido");
      return;
    }

    if (res.ok && data.success) {
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

// ====================== INICIAR SERVIÇO ======================
function iniciarServico() {
  const passaporte = document.getElementById("passaporteServico").value.trim();
  const gtm = gtms.find(g => g.passaporte === passaporte);

  if (!gtm) return alert("GTM não encontrado!");
  if (servicoAtual) return alert("Já existe um serviço em andamento!");

  servicoAtual = { passaporte, inicio: Date.now() };
  console.log("Serviço iniciado:", servicoAtual);
  iniciarCronometro();
}

// ====================== FINALIZAR SERVIÇO ======================
async function finalizarServico() {
  if (!servicoAtual) return alert("Nenhum serviço em andamento!");

  const duracaoHoras = (Date.now() - servicoAtual.inicio) / (1000 * 60 * 60);
  const payload = { passaporte: servicoAtual.passaporte, duracaoHoras };
  console.log("Payload de finalização:", payload);

  try {
    const res = await fetch(`${BACKEND_URL}/finalizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Status da resposta:", res.status);
    const dataText = await res.text();
    console.log("Resposta do backend:", dataText);

    let data = JSON.parse(dataText);
    if (res.ok && data.success) {
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

// ====================== QRT ======================
async function registrarQRT() {
  const passaporte = document.getElementById("qrtPassaporte").value.trim();
  const pontos = parseInt(document.getElementById("qrtQuantidade").value);
  if (!passaporte || !pontos) return alert("Preencha os campos corretamente!");

  const payload = { passaporte, pontos };
  console.log("Payload QRT:", payload);

  try {
    const res = await fetch(`${BACKEND_URL}/pontuar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await tratarResposta(res);
    console.log("Resposta QRT:", data);
    if (data.success) {
      alert("QRT registrado!");
      carregarGTMs();
    } else alert(data.error || "Erro ao registrar QRT");
  } catch (err) {
    console.error("Erro ao registrar QRT:", err);
  }
}

// ====================== ACOMPANHAMENTO ======================
async function registrarAcompanhamento() {
  const passaporte = document.getElementById("acompPassaporte").value.trim();
  const status = document.getElementById("acompStatus").value.trim();
  if (!passaporte || !status) return alert("Preencha os campos corretamente!");

  const payload = { passaporte, status };
  console.log("Payload acompanhamento:", payload);

  try {
    const res = await fetch(`${BACKEND_URL}/registrar-acomp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await tratarResposta(res);
    console.log("Resposta acompanhamento:", data);
    if (data.success) {
      alert("Acompanhamento registrado!");
      carregarGTMs();
    } else alert(data.error || "Erro ao registrar acompanhamento");
  } catch (err) {
    console.error("Erro ao registrar acompanhamento:", err);
  }
}

// ====================== PRISÃO ======================
async function registrarPrisao() {
  const passaporteGTM = document.getElementById("prisaoPassaporteGTM").value.trim();
  const nomePreso = document.getElementById("nomePreso").value.trim();
  const passaportePreso = document.getElementById("passaportePreso").value.trim();
  const qtd = parseInt(document.getElementById("qtdPresos").value);
  if (!passaporteGTM || !nomePreso || !passaportePreso || !qtd) return alert("Preencha todos os campos!");

  const payload = { passaporteGTM, nomePreso, passaportePreso, qtd };
  console.log("Payload prisão:", payload);

  try {
    const res = await fetch(`${BACKEND_URL}/registrar-prisao`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await tratarResposta(res);
    console.log("Resposta prisão:", data);
    if (data.success) {
      alert("Prisão registrada!");
      carregarGTMs();
    } else alert(data.error || "Erro ao registrar prisão");
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
  console.log("Exonerar GTM:", passaporte);

  try {
    const res = await fetch(`${BACKEND_URL}/gtm/${passaporte}`, { method: "DELETE" });
    const data = await tratarResposta(res);
    console.log("Resposta exonerar:", data);
    if (data.success) {
      alert("GTM exonerado!");
      carregarGTMs();
    } else alert(data.error || "Erro ao exonerar GTM");
  } catch (err) {
    console.error("Erro ao exonerar GTM:", err);
  }
}

// ====================== AVISOS ======================
async function enviarAviso() {
  const texto = document.getElementById("avisoTexto").value.trim();
  if (!texto) return alert("Digite o aviso!");
  const payload = { texto, data: new Date().toLocaleString() };
  console.log("Payload aviso:", payload);

  try {
    const res = await fetch(`${BACKEND_URL}/avisos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await tratarResposta(res);
    console.log("Resposta aviso:", data);
    if (data.success) {
      document.getElementById("avisoTexto").value = "";
      carregarAvisos();
      alert("Aviso enviado!");
    } else alert(data.error || "Erro ao enviar aviso");
  } catch (err) {
    console.error("Erro ao enviar aviso:", err);
  }
}

async function carregarAvisos() {
  try {
    const res = await fetch(`${BACKEND_URL}/avisos`);
    avisos = await tratarResposta(res);
    console.log("Avisos carregados:", avisos);

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
  console.log("Apagar aviso:", aviso);

  try {
    const res = await fetch(`${BACKEND_URL}/avisos/${aviso.id}`, { method: "DELETE" });
    const data = await tratarResposta(res);
    console.log("Resposta apagar aviso:", data);
    if (data.success) carregarAvisos();
  } catch (err) {
    console.error("Erro ao apagar aviso:", err);
  }
}

// ====================== ZERAR RANKING ======================
async function zerarRanking() {
  if (!comandoLogado) return alert("Acesso negado!");
  console.log("Zerar ranking");

  try {
    const res = await fetch(`${BACKEND_URL}/zerar`, { method: "POST" });
    const data = await tratarResposta(res);
    console.log("Resposta zerar ranking:", data);
    if (data.success) {
      alert("Ranking zerado!");
      carregarGTMs();
    } else alert(data.error || "Erro ao zerar ranking");
  } catch (err) {
    console.error("Erro ao zerar ranking:", err);
  }
}

// ====================== INICIALIZAÇÃO ======================
carregarGTMs();
carregarAvisos();
