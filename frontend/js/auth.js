// Authentication utilities

const API_BASE_URL = 'http://localhost:3000/api';

// Verify if user is authenticated
function verificarAutenticacao() {
  const usuarioJSON = localStorage.getItem('usuarioLogado');
  if (!usuarioJSON) {
    window.location.href = 'index.html';
    return null;
  }
  return JSON.parse(usuarioJSON);
}

// Logout function
function sair() {
  if (confirm('Tem certeza que deseja sair?')) {
    localStorage.removeItem('usuarioLogado');
    window.location.href = 'index.html';
  }
}

// Get fuel records for a user
function obterAbastecimentos(userId) {
  const key = 'abastecimentos_' + userId;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Save fuel records for a user
function salvarAbastecimentos(userId, array) {
  const key = 'abastecimentos_' + userId;
  localStorage.setItem(key, JSON.stringify(array));
}

// Show message helper
function mostrarMensagem(mensagem, tipo = 'info') {
  const existingMsg = document.querySelector('.mensagem-feedback');
  if (existingMsg) {
    existingMsg.remove();
  }

  const div = document.createElement('div');
  div.className = `mensagem-feedback mensagem-${tipo}`;
  div.textContent = mensagem;
  
  const container = document.querySelector('.container') || document.body;
  container.insertBefore(div, container.firstChild);
  
  setTimeout(() => div.remove(), 5000);
}

// Format currency
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor);
}

// Format date
function formatarData(dataISO) {
  if (!dataISO) return 'Data inválida';
  const data = new Date(dataISO);
  if (isNaN(data.getTime())) return 'Data inválida';
  return data.toLocaleDateString('pt-BR');
}
