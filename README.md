# echarts-heatmap-gmap-air-quality
Qualidade do ar por localização com a biblioteca Apache ECharts usando o gráfico Heatmap no GMap (Google Maps)
---

## 📝 Descrição

Um painel interativo para visualização da qualidade do ar por localização, construído com React, TypeScript e Apache ECharts, utilizando a extensão do Google Maps para renderizar um mapa de calor (heatmap) sobre dados em tempo real.

## 🚀 Tecnologias Utilizadas

-   **Frontend:** [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Visualização de Dados:** [Apache ECharts](https://echarts.apache.org/), [echarts-for-react](https://github.com/hustcc/echarts-for-react), [echarts-extension-gmap](https://github.com/plainheart/echarts-extension-gmap)
-   **Gerenciamento de Estado do Servidor:** [TanStack Query (React Query)](https://tanstack.com/query)
-   **Gerenciamento de Formulários:** [React Hook Form](https://react-hook-form.com/)
-   **Validação de Schema:** [Zod](https://zod.dev/)
-   **Componentes de UI:** [ShadCN/UI](https://ui.shadcn.com/), [Tailwind CSS](https://tailwindcss.com/)
-   **APIs Externas:** [World Air Quality Index Project API](https://aqicn.org/api/)

---

## 📦 Instalação

1. Clone o repositório:

```bash
git clone https://github.com/rafaelstu/echarts-heatmap-gmap-air-quality.git
cd echarts-heatmap-gmap-air-quality
```

2. Instale as dependências:

```bash
npm install
```

3. Configure o arquivo `.env` com a sua chave de API do World Air Quality Index:

```bash
VITE_AQICN_TOKEN=AQICN_API_TOKEN
```
4. Execute o projeto:

```bash
npm run dev
```

Abra a porta indicada no terminal em seu navegador para ver a aplicação.

---

## 🏛️ Arquitetura e Decisões Técnicas

**Gerenciamento de Estado do Servidor com TanStack Query:**
  -   Em vez de gerenciar manualmente estados de `isLoading`, `error` e `data` com `useState`, utilizamos o **TanStack Query**.
  -   **Decisão:** Essa escolha abstrai a complexidade do *data fetching*, fornecendo gratuitamente cache, revalidação automática, e hooks dedicados (`useQuery`, `useQueries`, `useMutation`) que tornam o código mais limpo e declarativo.



**Formulários Otimizados com React Hook Form & Zod:**
  -   O formulário de filtros é controlado pelo **React Hook Form** para otimizar a performance, evitando re-renderizações desnecessárias a cada digitação.
  -   **Decisão:** O **Zod** foi integrado através do `@hookform/resolvers` para fornecer validação de schema robusta e type-safe, garantindo que os dados do formulário estejam no formato correto antes de serem utilizados.

**Experiência do Usuário (UX):**
  -   **Skeleton Loaders:** Durante o carregamento dos dados, um componente de *skeleton* é exibido no lugar do resumo estatístico. Isso fornece um feedback visual claro ao usuário.
