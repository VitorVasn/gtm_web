const BASE_URL = "https://gtm-backend-8mh0.onrender.com"; // Backend Render
let servicoAtual = null;
let intervalo = null;
let comandoLogado = false;

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
    const res = await fetch(`${BASE_URL}/gtms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ posto, nome, passaporte, funcao })
    });

    const data = await res.json();
    if (data.success) {
      alert("GTM cadastrado com sucesso!");
      atualizarRanking();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Erro ao cadastrar GTM: " + err.message);
  }
}

// ====================== SERVIÇO ======================
async function iniciarServico() {
  const passaporte = document.getElementById("passaporteServico").value;

  if (servicoAtual) {
    alert("Já existe um serviço em andamento!");
    return;
  }

  servicoAtual = { passaporte, inicio: Date.now() };
  iniciarCronometro();
}

async function finalizarServico() {
  if (!servicoAtual) {
    alert("Nenhum serviço em andamento!");
    return;
  }

  const fim = Date.now();
  const duracaoMs = fim - servicoAtual.inicio;
  const duracaoHoras = duracaoMs / (1000 * 60 * 60);

  try {
    const res = await fetch(`${BASE_URL}/gtms/${servicoAtual.passaporte}/horas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horas: duracaoHoras })
    });
    const data = await res.json();
    if (data.success) {
      alert(`Serviço finalizado e ${duracaoHoras.toFixed(2)} horas contabilizadas!`);
      atualizarRanking();
    }
  } catch (err) {
    alert("Erro ao finalizar serviço: " + err.message);
  }

  servicoAtual = null;
  pararCronometro();
}

// ====================== CRONÔMETRO ======================
function iniciarCronometro() {
  const inicio = Date.now();
  intervalo = setInterval(() => {
    const agora = Date.now();
    const diff = agora - inicio;
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
async function atualizarRanking() {
  try {
    const res = await fetch(`${BASE_URL}/gtms`);
    const gtms = await res.json();
    const tbody = document.getElementById("ranking");
    tbody.innerHTML = "";

    gtms.sort((a, b) => b.horas - a.horas).forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${g.posto}</td>
        <td>${g.nome}</td>
        <td>${g.horas.toFixed(2)} h</td>
        <td>${g.pontos}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao atualizar ranking:", err);
  }
}

// ====================== PAINEL DO COMANDO ======================
const SENHA_COMANDO = "gtm2025";

function entrarPainel() {
  const senha = document.getElementById("senhaComando").value;
  if (senha === SENHA_COMANDO) {
    document.getElementById("painelComando").style.display = "block";
    comandoLogado = true;
    alert("Acesso liberado ao Painel do Comando!");
    carregarAvisos();
  } else {
    alert("Senha incorreta!");
  }
}

function fecharPainel() {
  document.getElementById("painelComando").style.display = "none";
  document.getElementById("senhaComando").value = "";
  comandoLogado = false;
  carregarAvisos();
}

// ====================== EXONERAR ======================
async function exonerarGTM() {
  const passaporte = document.getElementById("passaporteExonerar").value;
  if (!passaporte) return alert("Digite o passaporte!");

  try {
    const res = await fetch(`${BASE_URL}/gtms/${passaporte}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      alert(`GTM ${data.nome} exonerado com sucesso!`);
      atualizarRanking();
    }
  } catch (err) {
    alert("Erro ao exonerar GTM: " + err.message);
  }
}

// ====================== AVISOS ======================
async function enviarAviso() {
  const texto = document.getElementById("avisoTexto").value;
  if (!texto) return alert("Digite o aviso!");

  try {
    const res = await fetch(`${BASE_URL}/avisos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto })
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("avisoTexto").value = "";
      carregarAvisos();
      alert("Aviso publicado!");
    }
  } catch (err) {
    alert("Erro ao enviar aviso: " + err.message);
  }
}

async function carregarAvisos() {
  try {
    const res = await fetch(`${BASE_URL}/avisos`);
    const avisos = await res.json();
    const ul = document.getElementById("listaAvisos");
    ul.innerHTML = "";

    avisos.forEach((a, index) => {
      const li = document.createElement("li");
      let botoes = "";
      if (comandoLogado) {
        botoes = `
          <br>
          <button onclick="editarAviso(${index})">Editar</button>
          <button onclick="apagarAviso(${index})">Apagar</button>
        `;
      }
      li.innerHTML = `<strong>${a.data}</strong><br>${a.texto}${botoes}`;
      ul.appendChild(li);
    });
  } catch (err) {
    console.error("Erro ao carregar avisos:", err);
  }
}

async function apagarAviso(index) {
  if (!comandoLogado) return alert("Acesso negado!");
  try {
    const res = await fetch(`${BASE_URL}/avisos/${index}`, { method: "DELETE" });
    await res.json();
    carregarAvisos();
  } catch (err) {
    alert("Erro ao apagar aviso: " + err.message);
  }
}

async function editarAviso(index) {
  if (!comandoLogado) return alert("Acesso negado!");
  const novoTexto = prompt("Edite o aviso:");
  if (!novoTexto) return;

  try {
    const res = await fetch(`${BASE_URL}/avisos/${index}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: novoTexto })
    });
    await res.json();
    carregarAvisos();
  } catch (err) {
    alert("Erro ao editar aviso: " + err.message);
  }
}

// ====================== REGISTROS ======================
async function registrarQRT() {
  const passaporte = document.getElementById("qrtPassaporte").value;
  const quantidade = parseInt(document.getElementById("qrtQuantidade").value);
  if (!passaporte || !quantidade) return alert("Dados inválidos!");

  try {
    const res = await fetch(`${BASE_URL}/gtms/${passaporte}/pontos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "qrt", valor: quantidade })
    });
    await res.json();
    atualizarRanking();
    alert("QRT registrado!");
  } catch (err) {
    alert("Erro ao registrar QRT: " + err.message);
  }
}

async function registrarAcompanhamento() {
  const passaporte = document.getElementById("acompPassaporte").value;
  const status = document.getElementById("acompStatus").value;
  if (!passaporte || !status) return alert("Dados inválidos!");

  try {
    const res = await fetch(`${BASE_URL}/gtms/${passaporte}/pontos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "acomp", status })
    });
    await res.json();
    atualizarRanking();
    alert("Acompanhamento registrado!");
  } catch (err) {
    alert("Erro ao registrar acompanhamento: " + err.message);
  }
}

async function registrarPrisao() {
  const passaporteGTM = document.getElementById("prisaoPassaporteGTM").value;
  const nomePreso = document.getElementById("nomePreso").value;
  const passaportePreso = document.getElementById("passaportePreso").value;
  const qtd = parseInt(document.getElementById("qtdPresos").value);
  if (!passaporteGTM || !nomePreso || !passaportePreso || !qtd)
    return alert("Preencha todos os campos!");

  try {
    const res = await fetch(`${BASE_URL}/gtms/${passaporteGTM}/pontos`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tipo: "prisao", valor: qtd, nomePreso, passaportePreso })
    });
    await res.json();
    atualizarRanking();
    alert("Prisão registrada!");
  } catch (err) {
    alert("Erro ao registrar prisão: " + err.message);
  }
}

// ====================== ZERAR PONTUAÇÃO ======================
async function zerarPontuacao() {
  if (!comandoLogado) return alert("Acesso negado!");
  try {
    await fetch(`${BASE_URL}/gtms/zerar-pontos`, { method: "PUT" });
    atualizarRanking();
    alert("Pontuação zerada com sucesso!");
  } catch (err) {
    alert("Erro ao zerar pontuação: " + err.message);
  }
}

// ====================== AUTO ======================
atualizarRanking();
carregarAvisos();
