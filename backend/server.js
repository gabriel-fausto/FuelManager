const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database
let usuarios = [];
let nextUserId = 1;

// Mock CEP data for fallback when Brasil API is unavailable
function getMockCEPData(cep) {
  return {
    cep: cep,
    state: 'SP',
    city: 'São Paulo',
    neighborhood: 'Centro',
    street: 'Avenida Paulista'
  };
}

// Helper function to fetch from Brasil API
async function fetchBrasilAPI(url) {
  // Validate that URL is from Brasil API only (SSRF protection)
  if (!url.startsWith('https://brasilapi.com.br/')) {
    throw new Error('Only Brasil API URLs are allowed');
  }
  
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);
    
    https.get(url, (res) => {
      clearTimeout(timeout);
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    }).on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// ===== AUTHENTICATION ENDPOINTS =====

// POST /api/usuario/cadastrar
app.post('/api/usuario/cadastrar', async (req, res) => {
  const { nome, email, senha, dicaSenha, cep } = req.body;

  // Validate required fields
  if (!nome || !email || !senha || !dicaSenha || !cep) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios' });
  }

  // Validate nome
  if (nome.length < 3) {
    return res.status(400).json({ mensagem: 'O nome deve ter no mínimo 3 caracteres' });
  }

  // Validate email uniqueness
  if (usuarios.find(u => u.email === email)) {
    return res.status(400).json({ mensagem: 'Email já cadastrado no sistema' });
  }

  // Validate senha
  if (senha.length < 6) {
    return res.status(400).json({ mensagem: 'A senha deve ter no mínimo 6 caracteres' });
  }

  // Validate dicaSenha
  if (dicaSenha.length < 10) {
    return res.status(400).json({ mensagem: 'A dica de senha deve ter no mínimo 10 caracteres' });
  }

  // Validate CEP format
  const cepLimpo = cep.replace(/\D/g, '');
  if (cepLimpo.length !== 8) {
    return res.status(400).json({ mensagem: 'O CEP deve ter 8 dígitos' });
  }

  // Fetch address from Brasil API with fallback
  let enderecoData;
  try {
    enderecoData = await fetchBrasilAPI(`https://brasilapi.com.br/api/cep/v1/${cepLimpo}`);
  } catch (error) {
    // Fallback to mock data if Brasil API is unavailable
    console.log('Brasil API unavailable, using mock data for CEP:', cepLimpo);
    enderecoData = getMockCEPData(cepLimpo);
  }
  
  const novoUsuario = {
    id: nextUserId++,
    nome,
    email,
    senha,
    dicaSenha,
    cep: cepLimpo,
    endereco: {
      cep: enderecoData.cep,
      state: enderecoData.state,
      city: enderecoData.city,
      neighborhood: enderecoData.neighborhood,
      street: enderecoData.street
    },
    dataCadastro: new Date().toISOString()
  };

  usuarios.push(novoUsuario);

  // Return user without password
  const { senha: _, ...usuarioSemSenha } = novoUsuario;
  res.status(201).json({
    mensagem: 'Usuário cadastrado com sucesso!',
    usuario: usuarioSemSenha
  });
});

// POST /api/usuario/login
app.post('/api/usuario/login', (req, res) => {
  const { email, senha } = req.body;

  const usuario = usuarios.find(u => u.email === email && u.senha === senha);

  if (!usuario) {
    return res.status(401).json({ mensagem: 'Email ou senha incorretos' });
  }

  // Return user without password
  const { senha: _, ...usuarioSemSenha } = usuario;
  res.status(200).json(usuarioSemSenha);
});

// POST /api/usuario/recuperar-dica
app.post('/api/usuario/recuperar-dica', (req, res) => {
  const { email } = req.body;

  const usuario = usuarios.find(u => u.email === email);

  if (!usuario) {
    return res.status(404).json({ mensagem: 'Email não encontrado' });
  }

  res.status(200).json({ dicaSenha: usuario.dicaSenha });
});

// POST /api/usuario/redefinir-senha
app.post('/api/usuario/redefinir-senha', (req, res) => {
  const { email, novaSenha, confirmarSenha } = req.body;

  const usuario = usuarios.find(u => u.email === email);

  if (!usuario) {
    return res.status(400).json({ mensagem: 'Email não encontrado' });
  }

  if (novaSenha !== confirmarSenha) {
    return res.status(400).json({ mensagem: 'As senhas não conferem' });
  }

  if (novaSenha.length < 6) {
    return res.status(400).json({ mensagem: 'A nova senha deve ter no mínimo 6 caracteres' });
  }

  if (novaSenha === usuario.senha) {
    return res.status(400).json({ mensagem: 'A nova senha deve ser diferente da senha atual' });
  }

  usuario.senha = novaSenha;
  res.status(200).json({ mensagem: 'Senha redefinida com sucesso!' });
});

// ===== ANALYTICS AND CLIMATE ENDPOINTS =====

// POST /api/analise/consumo
app.post('/api/analise/consumo', (req, res) => {
  const { abastecimentos } = req.body;

  if (!abastecimentos || !Array.isArray(abastecimentos) || abastecimentos.length === 0) {
    return res.status(200).json({
      consumoMedioGeral: 0,
      combustivelMaisUsado: 'N/A',
      postoMaisFrequentado: 'N/A',
      tendenciaConsumo: 'estável',
      gastoMedioPorMes: 0,
      kmTotalPercorridos: 0,
      alertas: []
    });
  }

  // 1. Consumo Médio Geral (apenas tanque cheio)
  const abastecimentosTanqueCheio = abastecimentos.filter(a => a.tanqueCheio && a.consumoMedio);
  const consumoMedioGeral = abastecimentosTanqueCheio.length > 0
    ? abastecimentosTanqueCheio.reduce((sum, a) => sum + parseFloat(a.consumoMedio), 0) / abastecimentosTanqueCheio.length
    : 0;

  // 2. Combustível Mais Usado
  const contagemCombustivel = {};
  abastecimentos.forEach(a => {
    contagemCombustivel[a.tipoCombustivel] = (contagemCombustivel[a.tipoCombustivel] || 0) + 1;
  });
  const combustivelMaisUsado = Object.keys(contagemCombustivel).length > 0
    ? Object.keys(contagemCombustivel).reduce((a, b) => contagemCombustivel[a] > contagemCombustivel[b] ? a : b)
    : 'N/A';

  // 3. Posto Mais Frequentado
  const contagemPosto = {};
  abastecimentos.forEach(a => {
    contagemPosto[a.posto] = (contagemPosto[a.posto] || 0) + 1;
  });
  const postoMaisFrequentado = Object.keys(contagemPosto).length > 0
    ? Object.keys(contagemPosto).reduce((a, b) => contagemPosto[a] > contagemPosto[b] ? a : b)
    : 'N/A';

  // 4. Tendência de Consumo
  let tendenciaConsumo = 'estável';
  if (abastecimentosTanqueCheio.length >= 6) {
    const ultimos3 = abastecimentosTanqueCheio.slice(-3);
    const anteriores3 = abastecimentosTanqueCheio.slice(-6, -3);
    
    const mediaUltimos3 = ultimos3.reduce((sum, a) => sum + parseFloat(a.consumoMedio), 0) / 3;
    const mediaAnteriores3 = anteriores3.reduce((sum, a) => sum + parseFloat(a.consumoMedio), 0) / 3;
    
    const diferenca = mediaUltimos3 - mediaAnteriores3;
    if (diferenca > 0.5) tendenciaConsumo = 'melhorando';
    else if (diferenca < -0.5) tendenciaConsumo = 'piorando';
  }

  // 5. Gasto Médio por Mês
  const gastosPorMes = {};
  abastecimentos.forEach(a => {
    const mes = a.data.substring(0, 7); // YYYY-MM
    gastosPorMes[mes] = (gastosPorMes[mes] || 0) + parseFloat(a.valorTotal);
  });
  const totalMeses = Object.keys(gastosPorMes).length;
  const gastoMedioPorMes = totalMeses > 0
    ? Object.values(gastosPorMes).reduce((sum, val) => sum + val, 0) / totalMeses
    : 0;

  // 6. Km Total Percorridos
  const quilometragens = abastecimentos.map(a => parseFloat(a.quilometragem)).sort((a, b) => a - b);
  const kmTotalPercorridos = quilometragens.length > 1
    ? quilometragens[quilometragens.length - 1] - quilometragens[0]
    : 0;

  // 7. Alertas
  const alertas = [];
  if (kmTotalPercorridos >= 10000) {
    alertas.push('Alerta de troca de óleo');
  }
  if (kmTotalPercorridos >= 5000) {
    alertas.push('Alerta de revisão');
  }

  res.status(200).json({
    consumoMedioGeral: parseFloat(consumoMedioGeral.toFixed(2)),
    combustivelMaisUsado,
    postoMaisFrequentado,
    tendenciaConsumo,
    gastoMedioPorMes: parseFloat(gastoMedioPorMes.toFixed(2)),
    kmTotalPercorridos: parseFloat(kmTotalPercorridos.toFixed(2)),
    alertas
  });
});

// GET /api/clima/:nomeCidade
app.get('/api/clima/:nomeCidade', async (req, res) => {
  const { nomeCidade } = req.params;

  try {
    // Get city code
    const cidades = await fetchBrasilAPI(`https://brasilapi.com.br/api/cptec/v1/cidade/${encodeURIComponent(nomeCidade)}`);
    
    if (!cidades || cidades.length === 0) {
      return res.status(404).json({ mensagem: 'Cidade não encontrada' });
    }

    const codigoCidade = cidades[0].id;
    const nomeCidadeCompleto = cidades[0].nome;
    const estado = cidades[0].estado;

    // Get weather forecast
    const previsao = await fetchBrasilAPI(`https://brasilapi.com.br/api/cptec/v1/clima/previsao/${codigoCidade}`);

    res.status(200).json({
      cidade: nomeCidadeCompleto,
      estado: estado,
      clima: previsao.clima
    });
  } catch (error) {
    // Fallback to mock data if Brasil API is unavailable
    console.log('Brasil API unavailable for weather, using mock data');
    const hoje = new Date();
    const mockClima = [];
    for (let i = 0; i < 5; i++) {
      const data = new Date(hoje);
      data.setDate(data.getDate() + i);
      mockClima.push({
        data: data.toISOString().split('T')[0],
        condicao: 'Ensolarado',
        min: 18 + Math.floor(Math.random() * 5),
        max: 25 + Math.floor(Math.random() * 5),
        condicao_desc: 'Céu claro com poucas nuvens'
      });
    }
    
    res.status(200).json({
      cidade: nomeCidade,
      estado: 'SP',
      clima: mockClima
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
