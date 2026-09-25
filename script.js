const API_URL = "https://specialty-romance-optimal-kept.trycloudflare.com/webhook-test/chamados";

let chamadoAtual = null;

async function carregarChamados() {
  const lista = document.getElementById("listaChamados");

  lista.innerHTML = "Carregando chamados...";

  try {
    const resposta = await fetch(API_URL);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();
    const chamados = Array.isArray(dados.chamados) ? dados.chamados : [];

    document.getElementById("totalChamados").textContent = chamados.length;

    const aguardando = chamados.filter(
      chamado => chamado.status === "aguardando_humano"
    );

    document.getElementById("aguardando").textContent = aguardando.length;

    if (chamados.length === 0) {
      lista.innerHTML = `
        <div class="mensagem-vazia">
          Nenhum chamado encontrado.
        </div>
      `;
      return;
    }

    lista.innerHTML = "";

    chamados.forEach(chamado => {
      const numero = limparNumero(chamado.numero);

      const card = document.createElement("div");
      card.className = "chamado";

      const topo = document.createElement("div");
      topo.className = "chamado-topo";

      const cliente = document.createElement("div");
      cliente.innerHTML = `
        <strong class="numero-cliente">${escapeHtml(numero)}</strong>
        <div class="data">${escapeHtml(chamado.data || "")}</div>
      `;

      const status = document.createElement("span");
      status.className = "status";
      status.textContent = formatarStatus(chamado.status);

      topo.appendChild(cliente);
      topo.appendChild(status);

      const problema = document.createElement("div");
      problema.className = "problema";

      const tituloProblema = document.createElement("strong");
      tituloProblema.textContent = "Problema:";

      const textoProblema = document.createElement("p");
      textoProblema.textContent = chamado.problema_original || "Não informado";

      problema.appendChild(tituloProblema);
      problema.appendChild(textoProblema);

      const botao = document.createElement("button");
      botao.className = "botao-secundario botao-abrir";
      botao.textContent = "Abrir chamado";
      botao.addEventListener("click", () => abrirChamado(chamado));

      card.appendChild(topo);
      card.appendChild(problema);
      card.appendChild(botao);

      lista.appendChild(card);
    });

  } catch (erro) {
    console.error("Erro ao carregar chamados:", erro);

    document.getElementById("totalChamados").textContent = "0";
    document.getElementById("aguardando").textContent = "0";

    lista.innerHTML = `
      <div class="mensagem-erro">
        Não foi possível carregar os chamados.
        <br><br>
        Verifique se o workflow do n8n está em modo de teste e se o Cloudflare Tunnel continua aberto.
      </div>
    `;
  }
}

function abrirChamado(chamado) {
  chamadoAtual = chamado;

  document.getElementById("modalNumero").textContent =
    limparNumero(chamado.numero);

  document.getElementById("modalData").textContent =
    chamado.data || "";

  document.getElementById("modalStatus").textContent =
    formatarStatus(chamado.status);

  document.getElementById("modalProblema").textContent =
    chamado.problema_original || "Não informado";

  document.getElementById("modalResumo").textContent =
    chamado.resumo_ia || "Sem resumo disponível.";

  document.getElementById("mensagemTecnico").value = "";

  document.getElementById("areaResposta")
    .classList.add("oculto");

  document.getElementById("modalChamado")
    .classList.remove("oculto");
}

function fecharModal() {
  document.getElementById("modalChamado")
    .classList.add("oculto");

  document.getElementById("areaResposta")
    .classList.add("oculto");

  chamadoAtual = null;
}

function mostrarResposta() {
  document.getElementById("areaResposta")
    .classList.remove("oculto");

  document.getElementById("mensagemTecnico").focus();
}

function ocultarResposta() {
  document.getElementById("areaResposta")
    .classList.add("oculto");
}

function assumirChamado() {
  if (!chamadoAtual) return;

  mostrarToast(
    "Botão pronto. No próximo passo vamos conectar 'Assumir atendimento' ao n8n/Redis."
  );
}

function resolverChamado() {
  if (!chamadoAtual) return;

  mostrarToast(
    "Botão pronto. No próximo passo vamos conectar 'Marcar como resolvido' ao n8n/Redis."
  );
}

function enviarResposta() {
  if (!chamadoAtual) return;

  const mensagem = document
    .getElementById("mensagemTecnico")
    .value
    .trim();

  if (!mensagem) {
    mostrarToast("Digite uma mensagem antes de enviar.");
    return;
  }

  mostrarToast(
    "Mensagem preparada. No próximo passo vamos conectá-la ao n8n + Evolution API para chegar no WhatsApp."
  );
}

function limparNumero(numero) {
  return String(numero || "")
    .replace("@s.whatsapp.net", "")
    .replace("@c.us", "");
}

function formatarStatus(status) {
  const mapa = {
    aguardando_humano: "Aguardando humano",
    em_atendimento: "Em atendimento",
    resolvido: "Resolvido"
  };

  return mapa[status] || status || "Sem status";
}

function mostrarToast(mensagem) {
  const toast = document.getElementById("toast");

  toast.textContent = mensagem;
  toast.classList.remove("oculto");

  clearTimeout(window.__toastTimer);

  window.__toastTimer = setTimeout(() => {
    toast.classList.add("oculto");
  }, 3500);
}

function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    fecharModal();
  }
});

document.getElementById("modalChamado").addEventListener("click", (event) => {
  if (event.target.id === "modalChamado") {
    fecharModal();
  }
});

carregarChamados();
