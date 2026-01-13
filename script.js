const API = "https://gtm-backend-8mh0.onrender.com/api";

// ===================== AUTO LOAD =====================
document.addEventListener("DOMContentLoaded", () => {
  carregarRanking();
  carregarAvisos();
});

// ===================== CADASTRAR GTM =====================
function cadastrarGTM() {
  const posto = document.getElementById("posto").value;
  const nome = document.getElementById("nomeGuerra").value;
  const passaporte = document.getElementById("passaporte").value;
  const funcao = document.getElementById("funcao").value;

  fetch(`${API}/gtm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ posto, nome, passaporte, funcao })
  })
    .then(res => res.json())
    .then(() => {
      carregarRanking();
      limparCampos();
    })
    .catch(err => console.error(err));
}

// ===================== LISTAR RANKING =====================
function carregarRanking() {
  fetch(`${API}/gtms`)
    .then(res => res.json())
    .then(dados => {
      const ranking = document.getElementById("ranking");
      ranking.innerHTML = "";

      dados.forEach(g => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${g.posto}</td>
          <td>${g.nome}</td>
          <td>${g.passaporte}</td>
          <td>${g.horas.toFixed(2)} h</td>
          <td>${g.pontos}</td>
        `;
        ranking.appendChild(tr);
      });
    });
}

// ===================== SERVIÇO =====================
let inicioServico = null;

function iniciarServico() {
  inicioServico = new Date();
  iniciarCronometro();
}

function finalizarServico() {
  if (!inicioServico) {
    alert("Nenhum serviço em andamento!");
    return;
  }

  const fim = new Date();
  const diffMs = fim - inicioServico;
  const horas = diffMs / (1000 * 60 * 60);

  const passaporte = document.getElementById("passaporteServico").value;

  fetch(`${API}/finalizar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passaporte, duracaoHoras: horas })
  })
    .then(res => res.json())
    .then(() => {
      inicioServico = null;
      pararCronometro();
      carregarRanking();
    });
}

// ===================== CRONÔMETRO =====================
let intervalo = null;

function iniciarCronometro() {
  const display = document.getElementById("cronometro");
  const start = new Date();

  intervalo = setInterval(() => {
    const agora = new Date();
    const diff = new Date(agora - start);
    const h = String(diff.getUTCHours()).padStart(2, "0");
    const m = String(diff.getUTCMinutes()).padStart(2, "0");
    const s = String(diff.getUTCSeconds()).padStart(2, "0");
    display.textContent = `${h}:${m}:${s}`;
  }, 1000);
}

function pararCronometro() {
  clearInterval(intervalo);
  document.getElementById("cronometro").textContent = "00:00:00";
}

// ===================== QRT =====================
function registrarQRT() {
  const passaporte = document.getElementById("qrtPassaporte").value;
  const qtd = Number(document.getElementById("qrtQuantidade").value);
  const pontos = qtd * 2;

  fetch(`${API}/pontuar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passaporte, pontos })
  })
    .then(res => res.json())
    .then(() => carregarRanking());
}

// ===================== ACOMPANHAMENTO =====================
function registrarAcompanhamento() {
  const passaporte = document.getElementById("acompPassaporte").value;
  const status = document.getElementById("acompStatus").value;

  fetch(`${API}/registrar-acomp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passaporte, status })
  })
    .then(res => res.json())
    .then(() => carregarAvisos());
}

// ===================== PRISÃO =====================
function registrarPrisao() {
  const passaporteGTM = document.getElementById("prisaoPassaporteGTM").value;
  const nomePreso = document.getElementById("nomePreso").value;
  const passaportePreso = document.getElementById("passaportePreso").value;
  const qtd = Number(document.getElementById("qtdPresos").value);

  fetch(`${API}/registrar-prisao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passaporteGTM, nomePreso, passaportePreso, qtd })
  })
    .then(res => res.json())
    .then(() => carregarAvisos());
}

// ===================== EXONERAR =====================
function exonerarGTM() {
  const passaporte = document.getElementById("passaporteExonerar").value;

  fetch(`${API}/gtm/${passaporte}`, { method: "DELETE" })
    .then(res => res.json())
    .then(() => carregarRanking());
}

// ===================== ZERAR RANKING =====================
function zerarRanking() {
  fetch(`${API}/zerar`, { method: "POST" })
    .then(res => res.json())
    .then(() => carregarRanking());
}

// ===================== AVISOS =====================
function enviarAviso() {
  const texto = document.getElementById("avisoTexto").value;

  fetch(`${API}/avisos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto })
  })
    .then(res => res.json())
    .then(() => {
      document.getElementById("avisoTexto").value = "";
      carregarAvisos();
    });
}

function carregarAvisos() {
  fetch(`${API}/avisos`)
    .then(res => res.json())
    .then(avisos => {
      const lista = document.getElementById("listaAvisos");
      lista.innerHTML = "";

      avisos.forEach(a => {
        const li = document.createElement("li");
        li.innerHTML = `
          ${a.data} - ${a.texto}
          <button onclick="apagarAviso(${a.id})">🗑️</button>
        `;
        lista.appendChild(li);
      });
    });
}

function apagarAviso(id) {
  fetch(`${API}/avisos/${id}`, { method: "DELETE" })
    .then(res => res.json())
    .then(() => carregarAvisos());
}

function apagarTodosAvisos() {
  fetch(`${API}/avisos`)
    .then(res => res.json())
    .then(avisos => {
      avisos.forEach(a => {
        fetch(`${API}/avisos/${a.id}`, { method: "DELETE" });
      });
      carregarAvisos();
    });
}

// ===================== PAINEL =====================
function entrarPainel() {
  const senha = document.getElementById("senhaComando").value;
  if (senha === "gtmcomando123") {
    document.getElementById("painelComando").style.display = "block";
  } else {
    alert("Senha incorreta!");
  }
}

function fecharPainel() {
  document.getElementById("painelComando").style.display = "none";
}

// ===================== UTIL =====================
function limparCampos() {
  document.getElementById("posto").value = "";
  document.getElementById("nomeGuerra").value = "";
  document.getElementById("passaporte").value = "";
  document.getElementById("funcao").value = "";
}
