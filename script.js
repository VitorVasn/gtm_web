const SENHA_COMANDO = "gtm2025";

let gtms = JSON.parse(localStorage.getItem("gtms")) || [];
let avisos = JSON.parse(localStorage.getItem("avisos")) || [];

let cronometroIntervalo = null;
let inicioServico = null;

// ================== SALVAR ==================
function salvar() {
  localStorage.setItem("gtms", JSON.stringify(gtms));
  localStorage.setItem("avisos", JSON.stringify(avisos));
}

// ================== CADASTRO ==================
function cadastrarGTM() {
  const posto = postoInput().value.trim();
  const nome = nomeGuerraInput().value.trim();
  const passaporte = passaporteInput().value.trim();
  const funcao = funcaoSelect().value;

  if (!posto || !nome || !passaporte || !funcao) {
    alert("Preencha todos os campos!");
    return;
  }

  if (gtms.find(g => g.passaporte === passaporte)) {
    alert("Passaporte já cadastrado!");
    return;
  }

  gtms.push({
    posto,
    nome,
    passaporte,
    funcao,
    horas: 0,
    pontos: 0
  });

  salvar();
  atualizarRanking();
  alert("GTM cadastrado com sucesso!");
}

// ================== SERVIÇO ==================
function iniciarServico() {
  const passaporte = document.getElementById("passaporteServico").value.trim();
  const gtm = gtms.find(g => g.passaporte === passaporte);

  if (!gtm) {
    alert("GTM não encontrado!");
    return;
  }

  inicioServico = new Date();

  if (cronometroIntervalo) clearInterval(cronometroIntervalo);

  cronometroIntervalo = setInterval(() => {
    const agora = new Date();
    const diff = new Date(agora - inicioServico);
    const h = String(diff.getUTCHours()).padStart(2, "0");
    const m = String(diff.getUTCMinutes()).padStart(2, "0");
    const s = String(diff.getUTCSeconds()).padStart(2, "0");
    document.getElementById("cronometro").innerText = `${h}:${m}:${s}`;
  }, 1000);

  alert("Serviço iniciado!");
}

function finalizarServico() {
  if (!inicioServico) {
    alert("Nenhum serviço em andamento!");
    return;
  }

  const passaporte = document.getElementById("passaporteServico").value.trim();
  const gtm = gtms.find(g => g.passaporte === passaporte);

  if (!gtm) {
    alert("GTM não encontrado!");
    return;
  }

  const fim = new Date();
  const diffMs = fim - inicioServico;
  const horas = diffMs / (1000 * 60 * 60);

  gtm.horas = Number(gtm.horas) + horas;

  clearInterval(cronometroIntervalo);
  cronometroIntervalo = null;
  inicioServico = null;
  document.getElementById("cronometro").innerText = "00:00:00";

  salvar();
  atualizarRanking();

  alert(`Serviço finalizado! +${horas.toFixed(2)} horas contabilizadas`);
}

// ================== RANKING ==================
function atualizarRanking() {
  const tbody = document.getElementById("ranking");
  tbody.innerHTML = "";

  const ordenado = [...gtms].sort((a, b) => b.horas - a.horas || b.pontos - a.pontos);

  ordenado.forEach(gtm => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${gtm.posto}</td>
      <td>${gtm.nome}</td>
      <td>${Number(gtm.horas).toFixed(2)}</td>
      <td>${Number(gtm.pontos)}</td>
    `;

    tbody.appendChild(tr);
  });
}

// ================== QRT ==================
function registrarQRT() {
  const passaporte = document.getElementById("qrtPassaporte").value.trim();
  const qtd = Number(document.getElementById("qrtQuantidade").value);

  const gtm = gtms.find(g => g.passaporte === passaporte);
  if (!gtm || isNaN(qtd) || qtd <= 0) {
    alert("Dados inválidos!");
    return;
  }

  const pontos = qtd * 5;
  gtm.pontos = Number(gtm.pontos) + pontos;

  salvar();
  atualizarRanking();

  alert(`QRT registrado! +${pontos} pontos`);
}

// ================== ACOMPANHAMENTO ==================
function registrarAcompanhamento() {
  const passaporte = document.getElementById("acompPassaporte").value.trim();
  const status = document.getElementById("acompStatus").value;

  const gtm = gtms.find(g => g.passaporte === passaporte);
  if (!gtm || !status) {
    alert("Dados inválidos!");
    return;
  }

  let pontos = 0;
  if (status === "concluido") pontos = 10;
  if (status === "qta") pontos = 3;

  gtm.pontos = Number(gtm.pontos) + pontos;

  salvar();
  atualizarRanking();

  alert(`Acompanhamento registrado! +${pontos} pontos`);
}

// ================== PRISÃO ==================
function registrarPrisao() {
  const passaporte = document.getElementById("prisaoPassaporteGTM").value.trim();
  const nomePreso = document.getElementById("nomePreso").value.trim();
  const passaportePreso = document.getElementById("passaportePreso").value.trim();
  const qtd = Number(document.getElementById("qtdPresos").value);

  const gtm = gtms.find(g => g.passaporte === passaporte);
  if (!gtm || !nomePreso || !passaportePreso || isNaN(qtd) || qtd <= 0) {
    alert("Preencha todos os campos!");
    return;
  }

  const pontos = qtd * 8;
  gtm.pontos = Number(gtm.pontos) + pontos;

  salvar();
  atualizarRanking();

  alert(`Prisão registrada! +${pontos} pontos`);
}

// ================== PAINEL COMANDO ==================
function entrarPainel() {
  const senha = document.getElementById("senhaComando").value;
  if (senha === SENHA_COMANDO) {
    document.getElementById("painelComando").style.display = "block";
    alert("Acesso liberado!");
  } else {
    alert("Senha incorreta!");
  }
}

function fecharPainel() {
  document.getElementById("painelComando").style.display = "none";
}

 // ================== ZERAR RANKING ================== 
function zerarPontuacaoRanking() {
  const confirmar = confirm("⚠️ ATENÇÃO: Isso irá ZERAR a pontuação de TODOS os GTMs. Deseja continuar?");
  if (!confirmar) return;

  gtms.forEach(gtm => {
    gtm.pontos = 0;
  });

  salvar();
  atualizarRanking();

  alert("✅ Pontuação de todos os GTMs foi zerada com sucesso!");
}


// ================== EXONERAR ==================
function exonerarGTM() {
  const passaporte = document.getElementById("passaporteExonerar").value.trim();
  gtms = gtms.filter(g => g.passaporte !== passaporte);
  salvar();
  atualizarRanking();
  alert("GTM exonerado!");
}

// ================== AVISOS ==================
function enviarAviso() {
  const texto = document.getElementById("avisoTexto").value.trim();
  if (!texto) return;

  avisos.push(texto);
  salvar();
  atualizarAvisos();
  document.getElementById("avisoTexto").value = "";
}

function atualizarAvisos() {
  const ul = document.getElementById("listaAvisos");
  ul.innerHTML = "";

  avisos.forEach((aviso, index) => {
    const li = document.createElement("li");
    li.innerText = aviso;
    ul.appendChild(li);
  });
}

// ================== HELPERS ==================
function postoInput() { return document.getElementById("posto"); }
function nomeGuerraInput() { return document.getElementById("nomeGuerra"); }
function passaporteInput() { return document.getElementById("passaporte"); }
function funcaoSelect() { return document.getElementById("funcao"); }

// ================== INIT ==================
atualizarRanking();
atualizarAvisos();
