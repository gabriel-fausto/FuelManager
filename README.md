# FuelManager Pro

Sistema completo de gerenciamento de abastecimentos de veículos desenvolvido com Node.js, Express.js e JavaScript vanilla.

## 📋 Descrição

FuelManager Pro é uma aplicação web full-stack que permite aos usuários gerenciar seus abastecimentos de combustível, acompanhar estatísticas de consumo, visualizar análises financeiras e planejar viagens com base no consumo do veículo.

## 🚀 Como Executar

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm (Node Package Manager)
- Navegador web moderno

### Backend

1. Navegue até a pasta do backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

### Frontend

1. Navegue até a pasta frontend:
```bash
cd frontend
```

2. Abra o arquivo `index.html` em um navegador web, ou utilize um servidor HTTP local como o Live Server do VS Code ou o http-server do Node:

```bash
# Opção 1: usando Python
python -m http.server 8080

# Opção 2: usando Node.js http-server (instale globalmente se necessário)
npx http-server -p 8080
```

3. Acesse `http://localhost:8080` no navegador

## ✅ Funcionalidades Implementadas

### Autenticação
- [x] Cadastro de usuário com validação de CEP via Brasil API
- [x] Login de usuário
- [x] Recuperação de senha com dica
- [x] Redefinição de senha
- [x] Proteção de rotas internas

### Gerenciamento de Abastecimentos
- [x] Registro de abastecimento com todos os campos necessários
- [x] Cálculo automático de valor total
- [x] Cálculo automático de consumo médio para tanque cheio
- [x] Busca de endereço por CEP do posto
- [x] Validação de data e quilometragem
- [x] Listagem de abastecimentos com ordenação por data
- [x] Filtros por tipo de combustível, posto e período
- [x] Totalizadores de quantidade, litros e gastos
- [x] Exclusão de abastecimento com confirmação

### Dashboard
- [x] Boas-vindas personalizadas
- [x] Cards com resumos (total de abastecimentos, gasto total, total de litros, consumo médio)
- [x] Cálculos baseados nos dados do localStorage

### Estatísticas e Análises
- [x] Consumo médio geral
- [x] Combustível mais usado
- [x] Posto mais frequentado
- [x] Tendência de consumo (melhorando/piorando/estável)
- [x] Gasto médio por mês
- [x] Km total percorridos
- [x] Alertas de revisão e troca de óleo

### Clima e Viagens
- [x] Busca de previsão do tempo da cidade do usuário
- [x] Busca de previsão para outras cidades
- [x] Calculadora de viagem (litros necessários e custo total)
- [x] Pré-preenchimento do consumo médio do usuário

### Backend API
- [x] `POST /api/usuario/cadastrar` - Cadastro com validação e integração Brasil API
- [x] `POST /api/usuario/login` - Autenticação de usuário
- [x] `POST /api/usuario/recuperar-dica` - Recuperação de dica de senha
- [x] `POST /api/usuario/redefinir-senha` - Redefinição de senha
- [x] `POST /api/analise/consumo` - Análise completa de consumo e estatísticas
- [x] `GET /api/clima/:nomeCidade` - Previsão do tempo via Brasil API

## 🛠️ Decisões Técnicas

### Arquitetura
- **Backend**: Node.js com Express.js para criar uma API RESTful robusta
- **Frontend**: HTML5, CSS3 e JavaScript vanilla para manter simplicidade e performance
- **Armazenamento**: localStorage para persistência de dados do cliente e array em memória no servidor

### Organização do Código
- Separação clara entre backend e frontend
- Arquivo `auth.js` centralizado com funções utilitárias de autenticação
- CSS modular com classes reutilizáveis
- Validações tanto no frontend quanto no backend para segurança

### APIs Externas
- **Brasil API**: Utilizada para validação de CEP e busca de previsão do tempo
- Uso de HTTPS nativo do Node.js para chamadas à Brasil API no backend

### UX/UI
- Design responsivo com gradiente moderno
- Feedback visual para todas as ações do usuário
- Estados de carregamento para operações assíncronas
- Confirmações para ações destrutivas (exclusão, logout)

## 🔧 Dificuldades Encontradas e Soluções

### 1. Integração com Brasil API
**Dificuldade**: Fazer requisições HTTPS no Node.js sem bibliotecas externas.
**Solução**: Implementação de uma função helper `fetchBrasilAPI` usando o módulo `https` nativo do Node.js.

### 2. Cálculo de Consumo Médio
**Dificuldade**: Calcular o consumo apenas com dados válidos (tanque cheio) e encontrar o último abastecimento de tanque cheio.
**Solução**: Filtragem dos abastecimentos com `tanqueCheio: true` e ordenação por data para obter o último registro válido.

### 3. Persistência de Dados por Usuário
**Dificuldade**: Armazenar abastecimentos separadamente para cada usuário no localStorage.
**Solução**: Uso de chaves compostas `abastecimentos_${userId}` no localStorage.

### 4. Validação de Data e Quilometragem
**Dificuldade**: Garantir que a data não seja futura e que a quilometragem seja crescente.
**Solução**: Validações no frontend antes de salvar, comparando com a data atual e o histórico de abastecimentos.

### 5. Tendência de Consumo
**Dificuldade**: Comparar períodos de consumo para identificar tendências.
**Solução**: Implementação de lógica que compara a média dos últimos 3 abastecimentos com os 3 anteriores, usando um threshold de 0.5 Km/L.

### 6. Interface Responsiva
**Dificuldade**: Criar uma interface que funcione bem em diferentes tamanhos de tela.
**Solução**: Uso de CSS Grid com `auto-fit` e `minmax`, além de media queries para ajustes em telas menores.

## 📁 Estrutura do Projeto

```
FuelManager/
├── backend/
│   ├── server.js          # Servidor Express com todos os endpoints
│   └── package.json       # Dependências do backend
├── frontend/
│   ├── index.html         # Tela de login
│   ├── cadastro.html      # Tela de cadastro
│   ├── recuperar-senha.html  # Tela de recuperação de senha
│   ├── dashboard.html     # Dashboard principal
│   ├── abastecimento.html # Registro de abastecimento
│   ├── meus-abastecimentos.html  # Listagem de abastecimentos
│   ├── estatisticas.html  # Estatísticas e análises
│   ├── clima.html         # Clima e calculadora de viagem
│   ├── css/
│   │   └── style.css      # Estilos globais
│   └── js/
│       └── auth.js        # Funções de autenticação e utilitários
└── README.md              # Este arquivo
```

## 🔐 Segurança

- Validações de entrada no frontend e backend
- Senhas não são retornadas nas respostas da API
- Proteção de rotas com verificação de autenticação
- Validação de CEP através de API externa confiável

## 🎨 Tecnologias Utilizadas

- **Backend**: Node.js, Express.js, CORS
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **APIs Externas**: Brasil API (CEP e Clima)
- **Armazenamento**: localStorage (cliente), Array em memória (servidor)

## 📝 Notas

- Este é um projeto demonstrativo/educacional
- Em produção, seria necessário um banco de dados real (MongoDB, PostgreSQL, etc.)
- As senhas deveriam ser hasheadas (bcrypt)
- Seria necessário implementar autenticação JWT ou sessions
- O CORS deveria ser configurado de forma mais restritiva em produção

## 👤 Autor

Desenvolvido como parte do FuelManager Pro
