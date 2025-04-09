/**
 * Script para probar el modal de alerta de token
 * 
 * Este script puede ejecutarse en la consola del navegador para simular
 * problemas con el token de autenticación y probar el modal de alerta.
 */

/**
 * Simula un problema con el token de autenticación
 */
function simulateTokenIssue() {
  console.log('Simulando problema con el token de autenticación...');
  window.tokenHasIssues = true;
  console.log('Variable window.tokenHasIssues establecida a true');
  console.log('El modal debería aparecer en breve (2 segundos máximo)');
}

/**
 * Restablece el estado del token
 */
function resetTokenIssue() {
  console.log('Restableciendo estado del token...');
  window.tokenHasIssues = false;
  console.log('Variable window.tokenHasIssues restablecida a false');
  console.log('El modal debería cerrarse en breve (2 segundos máximo)');
}

/**
 * Simula una respuesta de API con error de autenticación
 */
function simulateApiAuthError() {
  console.log('Simulando respuesta de API con error de autenticación...');
  
  // Importar la función checkTokenIssue desde tokenUtils
  // Nota: Esto solo funcionará si se ejecuta en un contexto donde tokenUtils está disponible
  try {
    const { checkTokenIssue } = require('../lib/tokenUtils');
    
    // Simular una respuesta de API con error 401
    checkTokenIssue({
      status: 401,
      message: 'Token no autorizado o expirado'
    });
    
    console.log('Función checkTokenIssue ejecutada correctamente');
    console.log('El modal debería aparecer en breve (2 segundos máximo)');
  } catch (error) {
    console.error('Error al importar tokenUtils:', error);
    console.log('Alternativa: Estableciendo window.tokenHasIssues = true directamente');
    window.tokenHasIssues = true;
  }
}

/**
 * Instrucciones de uso
 */
console.log('=== Test de Modal de Alerta de Token ===');
console.log('Funciones disponibles:');
console.log('- simulateTokenIssue(): Simula un problema con el token');
console.log('- resetTokenIssue(): Restablece el estado del token');
console.log('- simulateApiAuthError(): Simula una respuesta de API con error de autenticación');
console.log('\nEjemplo de uso:');
console.log('  simulateTokenIssue()');
console.log('  // Esperar a que aparezca el modal');
console.log('  resetTokenIssue()');
