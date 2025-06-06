📘 Teacher Absence Management System
Sistema de Gestão de Ausências de Professores — uma aplicação web desenvolvida em React + TypeScript para registrar, visualizar e exportar ausências de professores. Ideal para escolas e instituições educacionais.

🚀 Tecnologias Utilizadas
React 18 — Biblioteca para construção da interface.

TypeScript — Tipagem estática para maior segurança.

Vite — Ferramenta moderna de build.

TailwindCSS — Framework de estilos utilitário.

Supabase — Backend como serviço (autenticação e banco de dados).

Firebase — (Possivelmente usado para autenticação ou notificações).

React Router Dom — Roteamento SPA.

Lucide React — Ícones modernos.

Recharts — Gráficos interativos.

XLSX e jsPDF — Exportação de dados para Excel e PDF.

📁 Estrutura do Projeto
csharp
Copiar
Editar
├── src/
│   ├── components/
│   │   └── absence/         # Formulários e listas de ausências
│   ├── App.tsx              # Configuração de rotas
│   ├── main.tsx             # Ponto de entrada
│   └── PrivateRoute.tsx     # Rota protegida (autenticação)
├── public/
├── index.html
├── tailwind.config.js
├── vite.config.ts

📦 Instalação e Execução
# 1. Clone o repositório
git clone https://github.com/tom-educacao/teacher-absence-management-system.git

# 2. Acesse o diretório do projeto
cd teacher-absence-management-system

# 3. Instale as dependências
npm install

# 4. Inicie o servidor de desenvolvimento
npm run dev

📜 Scripts Disponíveis
Comando	Descrição
npm run dev	Inicia o ambiente de desenvolvimento
npm run build	Gera a versão de produção
npm run preview	Previsualiza a build de produção
npm run lint	Executa o ESLint para análise de código

🔐 Ambiente (.env)
Crie um arquivo .env com as variáveis necessárias para integração com o Supabase e/ou Firebase:

VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_FIREBASE_API_KEY=...
...
✅ Funcionalidades
Cadastro de ausências

Listagem e exportação em PDF/Excel

Autenticação (provavelmente com Supabase/Firebase)

Gráficos analíticos de ausências

Interface responsiva e moderna
