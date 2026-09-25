const API_LISTAR_CHAMADOS =
  "https://desktop-cc7diaj.tail8f3985.ts.net/webhook/chamados";

const API_RESPONDER_CHAMADO =
  "https://desktop-cc7diaj.tail8f3985.ts.net/webhook/chamado/responder";

let chamadoAtual = null;

async function carregarChamados() {
  const lista = document.getElementById("listaChamados");

  lista.innerHTML = "Carregando chamados...";

  try {
    const resposta = await fetch(API_LISTAR_CHAMADOS);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    const dados = await resposta.json();

    const chamados = Array.isArray(dados.chamados)
      ? dados.chamados
      : [];

    document.getElementById("totalChamados").textContent =
      chamados.length;

    const aguardando = chamados.filter(
      chamado => chamado.status === "aguardando_humano"
    );

    document.getElementById("aguardando").textContent =
      aguardando.length;

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
        <strong class="numero-cliente">
          ${escapeHtml(numero)}
        </strong>

        <div class="data">
          ${escapeHtml(chamado.data || "")}
        </div>
      `;

      const status = document.createElement("span");

      status.className = "status";

      status.textContent =
        formatarStatus(chamado.status);

      topo.appendChild(cliente);
      topo.appendChild(status);

      const problema = document.createElement("div");

      problema.className = "problema";

      const tituloProblema =
        document.createElement("strong");

      tituloProblema.textContent = "Problema:";

      const textoProblema =
        document.createElement("p");

      textoProblema.textContent =
        chamado.problema_original ||
        "Não informado";

      problema.appendChild(tituloProblema);
      problema.appendChild(textoProblema);

      const botao =
        document.createElement("button");

      botao.className =
        "botao-secundario botao-abrir";

      botao.textContent =
        "Abrir chamado";

      botao.addEventListener(
        "click",
        () => abrirChamado(chamado)
      );

      card.appendChild(topo);
      card.appendChild(problema);
      card.appendChild(botao);

      lista.appendChild(card);
    });

  } catch (erro) {
    console.error(
      "Erro ao carregar chamados:",
      erro
    );

    document.getElementById(
      "totalChamados"
    ).textContent = "0";

    document.getElementById(
      "aguardando"
    ).textContent = "0";

    lista.innerHTML = `
      <div class="mensagem-erro">
        Não foi possível carregar os chamados.
        <br><br>
        Verifique se o n8n está ligado e se
        o workflow "Listar Chamados" está ativo.
      </div>
    `;
  }
}



function abrirChamado(chamado) {
  chamadoAtual = chamado;

  document.getElementById(
    "modalNumero"
  ).textContent =
    limparNumero(chamado.numero);

  document.getElementById(
    "modalData"
  ).textContent =
    chamado.data || "";

  document.getElementById(
    "modalStatus"
  ).textContent =
    formatarStatus(chamado.status);

  document.getElementById(
    "modalProblema"
  ).textContent =
    chamado.problema_original ||
    "Não informado";

  document.getElementById(
    "modalResumo"
  ).textContent =
    chamado.resumo_ia ||
    "Sem resumo disponível.";

  document.getElementById(
    "mensagemTecnico"
  ).value = "";

  document.getElementById(
    "areaResposta"
  ).classList.add("oculto");

  document.getElementById(
    "modalChamado"
  ).classList.remove("oculto");
}



function fecharModal() {
  document.getElementById(
    "modalChamado"
  ).classList.add("oculto");

  document.getElementById(
    "areaResposta"
  ).classList.add("oculto");

  chamadoAtual = null;
}



function mostrarResposta() {
  document.getElementById(
    "areaResposta"
  ).classList.remove("oculto");

  document.getElementById(
    "mensagemTecnico"
  ).focus();
}



function ocultarResposta() {
  document.getElementById(
    "areaResposta"
  ).classList.add("oculto");
}



function assumirChamado() {
  if (!chamadoAtual) {
    return;
  }

  mostrarToast(
    "O botão Assumir atendimento será conectado ao Redis no próximo passo."
  );
}



function resolverChamado() {
  if (!chamadoAtual) {
    return;
  }

  mostrarToast(
    "O botão Marcar como resolvido será conectado ao Redis no próximo passo."
  );
}



async function enviarResposta() {
  if (!chamadoAtual) {
    mostrarToast(
      "Nenhum chamado selecionado."
    );

    return;
  }

  const campoMensagem =
    document.getElementById(
      "mensagemTecnico"
    );

  const mensagem =
    campoMensagem.value.trim();

  if (!mensagem) {
    mostrarToast(
      "Digite uma mensagem antes de enviar."
    );

    campoMensagem.focus();

    return;
  }

  const numero =
    chamadoAtual.numero;

  const botaoEnviar =
    document.querySelector(
      "#areaResposta .botao-primario"
    );

  const textoOriginal =
    botaoEnviar
      ? botaoEnviar.textContent
      : "";

  try {
    if (botaoEnviar) {
      botaoEnviar.disabled = true;
      botaoEnviar.textContent =
        "Enviando...";
    }

    const resposta = await fetch(
      API_RESPONDER_CHAMADO,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          numero: numero,
          mensagem: mensagem
        })
      }
    );

    if (!resposta.ok) {
      throw new Error(
        `Erro HTTP ${resposta.status}`
      );
    }

    let dados = null;

    try {
      dados = await resposta.json();
    } catch {
      dados = null;
    }

    if (
      dados &&
      dados.success === false
    ) {
      throw new Error(
        dados.message ||
        "O n8n informou que o envio falhou."
      );
    }

    campoMensagem.value = "";

    ocultarResposta();

    mostrarToast(
      "Mensagem enviada para o WhatsApp do cliente."
    );

  } catch (erro) {
    console.error(
      "Erro ao enviar mensagem:",
      erro
    );

    mostrarToast(
      "Não foi possível enviar a mensagem. Verifique o n8n, Tailscale e Evolution API."
    );

  } finally {
    if (botaoEnviar) {
      botaoEnviar.disabled = false;

      botaoEnviar.textContent =
        textoOriginal || "Enviar mensagem";
    }
  }
}



function limparNumero(numero) {
  return String(numero || "")
    .replace(
      "@s.whatsapp.net",
      ""
    )
    .replace(
      "@c.us",
      ""
    );
}



function formatarStatus(status) {
  const mapa = {
    aguardando_humano:
      "Aguardando humano",

    em_atendimento:
      "Em atendimento",

    resolvido:
      "Resolvido"
  };

  return (
    mapa[status] ||
    status ||
    "Sem status"
  );
}



function mostrarToast(mensagem) {
  const toast =
    document.getElementById(
      "toast"
    );

  toast.textContent =
    mensagem;

  toast.classList.remove(
    "oculto"
  );

  clearTimeout(
    window.__toastTimer
  );

  window.__toastTimer =
    setTimeout(() => {
      toast.classList.add(
        "oculto"
      );
    }, 3500);
}



function escapeHtml(valor) {
  return String(valor ?? "")
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}



document.addEventListener(
  "keydown",
  event => {
    if (event.key === "Escape") {
      fecharModal();
    }
  }
);



document
  .getElementById(
    "modalChamado"
  )
  .addEventListener(
    "click",
    event => {
      if (
        event.target.id ===
        "modalChamado"
      ) {
        fecharModal();
      }
    }
  );



carregarChamados();