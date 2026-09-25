const API_URL = "http://localhost:5678/webhook-test/chamados";

async function carregarChamados() {

  const lista = document.getElementById("listaChamados");

  lista.innerHTML = "Carregando chamados...";

  try {

    const resposta = await fetch(API_URL);

    if (!resposta.ok) {
      throw new Error("Erro ao buscar chamados");
    }

    const dados = await resposta.json();

    document.getElementById("totalChamados").textContent =
      dados.total;

    const aguardando = dados.chamados.filter(
      chamado => chamado.status === "aguardando_humano"
    );

    document.getElementById("aguardando").textContent =
      aguardando.length;

    if (dados.chamados.length === 0) {

      lista.innerHTML = "<p>Nenhum chamado encontrado.</p>";

      return;
    }

    lista.innerHTML = "";

    dados.chamados.forEach(chamado => {

      const numero = chamado.numero
        ?.replace("@s.whatsapp.net", "");

      const card = document.createElement("div");

      card.className = "chamado";

      card.innerHTML = `
        <div class="chamado-topo">

          <div>
            <strong>${numero}</strong>
            <div class="data">
              ${chamado.data || ""}
            </div>
          </div>

          <span class="status">
            ${chamado.status}
          </span>

        </div>

        <div class="problema">

          <strong>Problema:</strong>

          <p>
            ${chamado.problema_original}
          </p>

        </div>

        <button onclick='abrirChamado(${JSON.stringify(chamado)})'>
          Abrir chamado
        </button>
      `;

      lista.appendChild(card);

    });

  } catch (erro) {

    console.error(erro);

    lista.innerHTML = `
      <p>
        Não foi possível carregar os chamados.
      </p>
    `;

  }

}

function abrirChamado(chamado) {

  alert(
`Cliente: ${chamado.numero}

Problema:
${chamado.problema_original}

Resumo da IA:
${chamado.resumo_ia}`
  );

}

carregarChamados();