/**
 * Helper para resolver el nombre de las tablas según el entorno (Producción o Sandbox/Dev)
 * @param {string} tableName - Nombre base de la tabla (ej. 'contactos')
 * @param {boolean} isDev - Si el usuario actual tiene permisos/modo Dev activado
 * @returns {string} El nombre de la tabla a utilizar
 */
export const getTable = (tableName, isDev) => {
  return isDev ? `${tableName}_sandbox` : tableName;
};
