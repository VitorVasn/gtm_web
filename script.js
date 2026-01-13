const API = "https://gtm-backend-8mh0.onrender.com/api";

let comandoLogado = false;

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

  if (!posto || !nome || !passaporte || !funcao) return alert("Preencha todos os campos!");

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
  if (!inicioServico) return alert("Nenhum serviço em andamento!");

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
  if (!passaporte || !qtd) return alert("Preencha passaporte e quantidade!");

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
  if (!passaporte || !status) return alert("Preencha passaporte e status!");

  fetch(`${API}/registrar-acomp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passaporte, status })
  })
    .then(res => res.json())
    .then(() => carregarAvisos());
}

// ===================== PRISÃO =====================
async function registrarPrisao() {
  const passaporteGTM = document.getElementById("prisaoPassaporteGTM").value.trim();
  const nomePreso = document.getElementById("nomePreso").value.trim();
  const passaportePreso = document.getElementById("passaportePreso").value.trim();

  if (!passaporteGTM || !nomePreso || !passaportePreso) return alert("Preencha todos os campos!");

  const payload = { passaporteGTM, nomePreso, passaportePreso };

  const res = await fetch(`${API}/registrar-prisao`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.sucesso) {
    alert("Prisão registrada!");
    carregarRanking();
    carregarAvisos();
  } else {
    alert(data.mensagem || "Erro ao registrar prisão");
  }
}

// ===================== EXONERAR =====================
function exonerarGTM() {
  const passaporte = document.getElementById("passaporteExonerar").value;
  if (!passaporte) return alert("Preencha o passaporte!");

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

// ====================== AVISOS ======================
async function enviarAviso() {
  const texto = document.getElementById("avisoTexto").value.trim();
  if (!texto) return alert("Digite o aviso!");

  const payload = { texto };
  if (comandoLogado) payload.nomeGuerra = "Comando"; // 👈 Marca quem enviou

  try {
    const res = await fetch(`${API}/avisos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.sucesso) {
      document.getElementById("avisoTexto").value = "";
      carregarAvisos();
    } else {
      alert(data.mensagem || "Erro ao enviar aviso");
    }
  } catch (err) {
    console.error("Erro ao enviar aviso:", err);
    alert("Erro ao conectar com o servidor de avisos");
  }
}

// ====================== CARREGAR AVISOS ======================
async function carregarAvisos() {
  try {
    const res = await fetch(`${API}/avisos`);
    const avisos = await res.json();

    const ul = document.getElementById("listaAvisos");
    ul.innerHTML = "";

    avisos.forEach(a => {
      const li = document.createElement("li");

      // Ajuste de fuso para Brasília (UTC-3)
      const dataObj = new Date(a.data);
      const utc = dataObj.getTime() + dataObj.getTimezoneOffset() * 60000;
      const brasiliaTime = new Date(utc - 3 * 60 * 60000);

      const dataFormatada = brasiliaTime.toLocaleDateString("pt-BR") +
        " - " +
        brasiliaTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) + "h";

      const nome = a.nomeGuerra || "Desconhecido";

      let botoes = "";
      if (comandoLogado) {
        botoes = `<div style="margin-top:5px;">
                    <button onclick="apagarAviso(${a.id})">🗑️</button>
                  </div>`;
      }

      li.innerHTML = `<strong>${nome}</strong> - ${dataFormatada}<br>${a.texto}${botoes}`;
      ul.appendChild(li);
    });
  } catch (err) {
    console.error("Erro ao carregar avisos:", err);
  }
}

// ====================== APAGAR AVISO ======================
async function apagarAviso(id) {
  if (!confirm("Tem certeza que deseja apagar este aviso?")) return;

  try {
    await fetch(`${API}/avisos/${id}`, { method: "DELETE" });
    carregarAvisos();
  } catch (err) {
    console.error("Erro ao apagar aviso:", err);
  }
}

// ====================== APAGAR TODOS AVISOS ======================
async function apagarTodosAvisos() {
  if (!confirm("Tem certeza que deseja APAGAR TODOS os avisos?")) return;

  try {
    const res = await fetch(`${API}/avisos`);
    const avisos = await res.json();

    await Promise.all(
      avisos.map(a => fetch(`${API}/avisos/${a.id}`, { method: "DELETE" }))
    );

    carregarAvisos();
  } catch (err) {
    console.error("Erro ao apagar todos avisos:", err);
  }
}

// ====================== EDITAR AVISO ======================
async function editarAviso(id) {
  const novoTexto = prompt("Editar aviso:");
  if (!novoTexto || novoTexto.trim() === "") return;

  try {
    await fetch(`${API}/avisos/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto: novoTexto })
    });
    carregarAvisos();
  } catch (err) {
    console.error("Erro ao editar aviso:", err);
  }
}

// ===================== PAINEL =====================
function entrarPainel() {
  const senha = document.getElementById("senhaComando").value;
  if (senha === "gtmcomando123") {
    comandoLogado = true;
    document.getElementById("painelComando").style.display = "block";
    carregarAvisos(); // 🔥 re-render
  } else {
    alert("Senha incorreta!");
  }
}

function fecharPainel() {
  comandoLogado = false;
  document.getElementById("painelComando").style.display = "none";
  carregarAvisos();
}

// ===================== UTIL =====================
function limparCampos() {
  document.getElementById("posto").value = "";
  document.getElementById("nomeGuerra").value = "";
  document.getElementById("passaporte").value = "";
  document.getElementById("funcao").value = "";
}
